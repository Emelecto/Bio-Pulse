// ============================================================
// HOOK useBiopulseData — aísla todo el estado de la app:
// fuente demo/CSV/wearable, periodo, conexiones, CSV, persistencia.
// La UI solo consume el objeto devuelto.
// ============================================================
import { useMemo, useState, useEffect } from "react";
import Papa from "papaparse";
import { generateSyntheticRawDays, computePipeline, clamp } from "../lib/bioUtils.js";

// ---- DICCIONARIO DE MÉTRICAS AGRUPADAS POR SEMÁNTICA ----
// Cada clave mapea a uno o varios "patrones" (substrings normalizados) que
// identifican esa métrica en CUALQUIER export (Apple Health, Google Fit,
// Whoop, Oura, Garmin, CSV genérico). Es tolerante a idioma/variaciones.
const METRIC_PATTERNS = {
  hrv: ["hrv", "heartratevariability", "heart rate variability", "sdnn", "rmssd", "variabilidad", "variabilidad cardiaca", "variabilidad cardíaca"],
  rhr: ["restingheartrate", "resting heart rate", "resting hr", "restinghr", "rhr", "frecuencia cardiaca en reposo", "frecuencia cardíaca en reposo", "resting"],
  heartRate: ["heartrate", "heart rate", "hr ", "pulsaciones", "frecuencia cardiaca", "frecuencia cardíaca"],
  steps: ["stepcount", "step count", "steps", "pasos"],
  activeEnergy: ["activeenergyburned", "active energy", "active energy burned", "energia activa", "energía activa", "calorias activas"],
  exerciseTime: ["appleexercisetime", "exercise time", "exercise", "tiempo de ejercicio", "ejercicio"],
  timeInDaylight: ["timeindaylight", "daylight", "luz solar", "tiempo a la luz", "tiempo de luz"],
  flights: ["flightsclimbed", "flights climbed", "flights", "pisos", "escaleras subidas"],
  sleepHours: ["sleepanalysis", "sleeanalysis", "total sleeptime", "total sleep time", "sleepduration", "sleep duration", "sleephours", "sleep hours", "sleep", "horas de sueno", "horas de sueño", "sueno", "sueño"],
  sleepEff: ["sleepefficiency", "sleep efficiency", "eficiencia de sueno", "eficiencia de sueño"],
  recovery: ["recovery", "recovery score", "recovery score", "recuperacion"],
  resp: ["respiratoryrate", "respiratory rate", "breathing rate", "frecuencia respiratoria", "resp"],
  skinTemp: ["skintemp", "skin temp", "bodytemp", "body temp", "temperature deviation", "desviacion temp", "desviación temp", "temperature"],
  dayStrain: ["daystrain", "strain", "strain score", "carga"],
  wakeUps: ["wakeups", "wake ups", "awakenings", "despertares"],
};
// Cómo agregar valores de un mismo día para cada métrica.
const AGG = {
  hrv: "mean", rhr: "mean", heartRate: "mean", recovery: "mean", resp: "mean",
  skinTemp: "mean", sleepEff: "mean", sleepPerf: "mean", dayStrain: "mean",
  steps: "sum", activeEnergy: "sum", exerciseTime: "sum", timeInDaylight: "sum", flights: "sum",
  sleepHours: "sum", wakeUps: "sum",
};

const DEFAULTS = { recovery: 65, resp: 15, skinTemp: 0, sleepEff: 85, sleepPerf: 85, sleepHours: 7, dayStrain: 10, steps: 6000, wakeUps: 1, activeEnergy: 350, exerciseTime: 20, timeInDaylight: 30, flights: 8 };

const norm = (s) =>
  String(s == null ? "" : s)
    .replace(/^﻿/, "")
    .toLowerCase()
    .trim()
    .replace(/[_\-]+/g, " ")
    .replace(/﻿/g, "")
    .replace(/\s+/g, " ")
    .normalize("NFD").replace(/[̀-ͯ]/g, ""); // quita acentos para tolerar español

// ¿El header matchea alguno de los patrones de la métrica?
function matchMetric(headerNorm, metricKey) {
  const pats = METRIC_PATTERNS[metricKey] || [];
  return pats.some((p) => headerNorm === p || headerNorm.includes(p) || p.includes(headerNorm));
}
// Encuentra la columna de FECHA (genérica).
function findDateCol(headers) {
  const datePats = ["startdate", "enddate", "date", "fecha", "day", "timestamp", "time", "cycle start time", "datetime"];
  // Prefiere start/date exactos antes que end (end suele ser lo mismo).
  const pref = ["startdate", "date", "fecha", "day", "timestamp", "datetime", "cycle start time", "time"];
  for (const p of pref) {
    const hit = headers.find((h) => norm(h) === p || norm(h).includes(p));
    if (hit) return hit;
  }
  return headers.find((h) => datePats.some((p) => norm(h).includes(p))) || null;
}
// Parsea una fecha en múltiples formatos (incl. "2026-08-11 08:41:32 -0500").
function parseDate(v) {
  if (!v) return null;
  const s = String(v).trim();
  // ISO o con zona tipo "-0500"
  let d = new Date(s.replace(" -", " -").replace(/(\d{2})(\d{2})$/, "$1:$2"));
  if (!Number.isNaN(d.getTime())) return d;
  // "2026-06-06 21:11:06" sin zona
  d = new Date(s.replace(" ", "T"));
  if (!Number.isNaN(d.getTime())) return d;
  const ms = Date.parse(s);
  return Number.isNaN(ms) ? null : new Date(ms);
}
function dayKey(d) {
  const x = parseDate(d);
  return x ? x.toISOString().slice(0, 10) : null;
}
const toNum = (v) => {
  const n = parseFloat(String(v).replace(",", "."));
  return Number.isFinite(n) ? n : NaN;
};
function aggregate(values, mode) {
  const nums = values.filter((n) => Number.isFinite(n));
  if (!nums.length) return NaN;
  if (mode === "sum") return nums.reduce((a, b) => a + b, 0);
  return nums.reduce((a, b) => a + b, 0) / nums.length; // mean
}

// ---- DETECCIÓN DE FORMATO ----
// Devuelve "wide" | "tidy" | "unknown".
function detectFormat(headers) {
  const hn = headers.map(norm);
  const hasType = hn.some((h) => h === "type" || h === "metric" || h === "measure" || h === "name" || h === "variable");
  const hasValue = hn.some((h) => h === "value" || h === "val" || h === "reading" || h === "count" || h === "amount" || h === "result");
  const hasWideMetric = hn.some((h) => matchMetric(h, "hrv") || matchMetric(h, "rhr"));
  if (hasType && hasValue && !hasWideMetric) return "tidy";
  if (hasWideMetric) return "wide";
  return "unknown";
}

// Convierte un CSV "tidy" (una fila por medición: type/value/[fecha]) a
// filas por día (formato ancho interno). Genérico: usa METRIC_PATTERNS.
function buildRawFromTidy(rows) {
  const dateCol = findDateCol(Object.keys(rows[0] || {}));
  const typeCol = (Object.keys(rows[0] || {})).find((h) => {
    const n = norm(h); return n === "type" || n === "metric" || n === "measure" || n === "name" || n === "variable" || n === "identifier" || n.includes("quantitytype") || n.includes("categorytype");
  }) || null;
  const valueCol = (Object.keys(rows[0] || {})).find((h) => {
    const n = norm(h); return n === "value" || n === "val" || n === "reading" || n === "count" || n === "amount" || n === "result" || n === "level";
  }) || null;
  if (!typeCol || !valueCol) return { days: [], diag: { format: "tidy", error: "No se encontró columna de tipo/valor." } };

  // Para cada tipo de fila, ¿a qué métrica interna corresponde?
  const typeToMetric = {};
  const typeSamples = {};
  for (const r of rows) {
    const t = norm(r[typeCol] || "");
    if (!t) continue;
    if (!typeSamples[t]) typeSamples[t] = 0;
    typeSamples[t]++;
    if (typeToMetric[t]) continue;
    for (const m of Object.keys(METRIC_PATTERNS)) {
      if (matchMetric(t, m)) { typeToMetric[t] = m; break; }
    }
  }

  // Agrupa por día y por métrica. Para heartRate/rhr guarda {v, t} (timestamp)
  // para poder deducir la ventana de sueño por timing real.
  const byDay = {}; // dayKey -> { metric -> [values] | hrSeries: [{v,t}] }
  for (const r of rows) {
    const dk = dayKey(r[dateCol]);
    if (!dk) continue;
    const t = norm(r[typeCol] || "");
    const m = typeToMetric[t];
    if (!m) continue;
    const v = toNum(r[valueCol]);
    if (Number.isNaN(v)) continue;
    (byDay[dk] = byDay[dk] || {});
    // heartRate y rhr se guardan como serie temporal para la ventana de sueño.
    if (m === "heartRate" || m === "rhr") {
      (byDay[dk].hrSeries = byDay[dk].hrSeries || []).push({ v, t: parseDate(r[dateCol] && r[dateCol].includes(" ") ? r[dateCol] : dk + "T00:00:00") });
      (byDay[dk][m] = byDay[dk][m] || []).push(v);
    } else {
      (byDay[dk][m] = byDay[dk][m] || []).push(v);
    }
  }

  const days = Object.keys(byDay).sort().map((dk) => {
    const agg = byDay[dk];
    const get = (m) => aggregate(agg[m] || [], AGG[m] || "mean");
    const hrv = get("hrv");
    // RHR: media de resting; si no hay, mínimo de heartRate del día (proxy de reposo).
    let rhr = get("rhr");
    if (Number.isNaN(rhr) && agg.heartRate) rhr = Math.min(...agg.heartRate.filter(Number.isFinite));
    const sleepEff = get("sleepEff");
    const sleepHours = get("sleepHours");
    // dayStrain desde carga real (energía activa + ejercicio), no default ciego.
    const aE = get("activeEnergy");
    const exT = get("exerciseTime");
    let dayStrain = Number.isNaN(aE) ? DEFAULTS.dayStrain : clamp(aE / 90, 2, 21);
    if (!Number.isNaN(exT)) dayStrain = clamp(dayStrain + exT / 12, 2, 21);
    // Mediana del día de HeartRate para la vista Live (en VIVO, no RHR).
    const liveHr = agg.heartRate && agg.heartRate.length
      ? [...agg.heartRate].sort((a, b) => a - b)[Math.floor(agg.heartRate.length / 2)]
      : (Number.isNaN(rhr) ? 60 : rhr);
    return {
      date: new Date(dk + "T00:00:00"),
      hrv: Number.isNaN(hrv) ? NaN : hrv,
      rhr: Number.isNaN(rhr) ? NaN : rhr,
      heartRate: agg.heartRate ? [...agg.heartRate] : [],
      liveHr: Number.isFinite(liveHr) ? liveHr : 60,
      hrSeries: agg.hrSeries || [],
      recovery: Number.isNaN(get("recovery")) ? DEFAULTS.recovery : get("recovery"),
      dayStrain: +dayStrain.toFixed(1),
      sleepHours: Number.isNaN(sleepHours) ? DEFAULTS.sleepHours : sleepHours,
      sleepEff: Number.isNaN(sleepEff) ? DEFAULTS.sleepEff : sleepEff,
      sleepPerf: Number.isNaN(sleepEff) ? DEFAULTS.sleepPerf : sleepEff,
      resp: Number.isNaN(get("resp")) ? DEFAULTS.resp : get("resp"),
      skinTemp: Number.isNaN(get("skinTemp")) ? DEFAULTS.skinTemp : get("skinTemp"),
      steps: Number.isNaN(get("steps")) ? DEFAULTS.steps : Math.round(get("steps")),
      activeEnergy: Number.isNaN(aE) ? DEFAULTS.activeEnergy : Math.round(aE),
      exerciseTime: Number.isNaN(exT) ? DEFAULTS.exerciseTime : Math.round(exT),
      timeInDaylight: Number.isNaN(get("timeInDaylight")) ? DEFAULTS.timeInDaylight : Math.round(get("timeInDaylight")),
      flights: Number.isNaN(get("flights")) ? DEFAULTS.flights : Math.round(get("flights")),
      wakeUps: Number.isNaN(get("wakeUps")) ? DEFAULTS.wakeUps : Math.round(get("wakeUps")),
    };
  }).filter((d) => Number.isFinite(d.hrv) && Number.isFinite(d.rhr));

  // Diagnóstico para el usuario.
  const foundMetrics = new Set();
  for (const t of Object.keys(typeToMetric)) foundMetrics.add(typeToMetric[t]);
  const diag = {
    format: "tidy",
    days: days.length,
    metrics: Array.from(foundMetrics),
    hasHrv: foundMetrics.has("hrv"),
    hasRhr: foundMetrics.has("rhr") || foundMetrics.has("heartRate"),
    hasSteps: foundMetrics.has("steps"),
    hasSleep: foundMetrics.has("sleepHours"),
    unmappedTypes: Object.keys(typeSamples).filter((t) => !typeToMetric[t]).slice(0, 8),
  };
  return { days, diag };
}

// CSV ancho (una fila por día). Auto-detecta columnas por sinónimos ampliados.
function buildRawFromWide(rows, headers) {
  const hn = headers.map(norm);
  const pick = (metricKey) => {
    for (const h of headers) if (matchMetric(norm(h), metricKey)) return h;
    return "";
  };
  const map = { date: findDateCol(headers) };
  for (const m of Object.keys(METRIC_PATTERNS)) map[m] = pick(m);
  const out = [];
  rows.forEach((row, idx) => {
    const hrvVal = map.hrv ? toNum(row[map.hrv]) : NaN;
    const rhrVal = map.rhr ? toNum(row[map.rhr]) : NaN;
    if (Number.isNaN(hrvVal) || Number.isNaN(rhrVal)) return;
    let date = map.date && row[map.date] ? parseDate(row[map.date]) : null;
    if (!date || Number.isNaN(date.getTime())) { date = new Date(); date.setDate(date.getDate() - (rows.length - 1 - idx)); }
    const get = (m) => { const c = map[m]; if (!c) return DEFAULTS[m]; const v = toNum(row[c]); return Number.isNaN(v) ? DEFAULTS[m] : v; };
    const sleepEff = get("sleepEff");
    out.push({
      date, hrv: hrvVal, rhr: rhrVal, recovery: get("recovery"), dayStrain: get("dayStrain"),
      sleepHours: get("sleepHours"), sleepEff, sleepPerf: map.sleepPerf ? get("sleepPerf") : sleepEff,
      resp: get("resp"), skinTemp: get("skinTemp"), steps: Math.round(get("steps")), wakeUps: Math.round(get("wakeUps")),
    });
  });
  const diag = { format: "wide", days: out.length, metrics: Object.keys(METRIC_PATTERNS).filter((m) => map[m]), hasHrv: !!map.hrv, hasRhr: !!map.rhr, hasSteps: !!map.steps, hasSleep: !!map.sleepHours, unmappedTypes: [] };
  return { days: out.sort((a, b) => a.date - b.date), diag };
}

// Proxy de sueño HONESTO (cuando el export NO trae sueño real):
//  (1) Ventana de sueño por TIMING: agrupa HeartRate por hora del día y busca
//      el tramo de HR sostenidamente baja (ventana de reposo). Da horas de
//      ventana. Si hay pocas muestras nocturnas -> pasa al paso 2.
//  (2) Fallback por recuperación (HRV/RHR) si no hay timing fiable.
//  (3) timeInDaylight modula la calidad/eficiencia (ritmo circadiano).
// Siempre sleepEstimated=true: es un proxy, NO sueño medido.
function estimateSleepWindowHours(series) {
  // series: [{v, t:Date}] del día. Agrupa por hora local.
  const byHour = {}; // hora -> [v]
  for (const s of series) {
    if (!s.t || isNaN(s.t.getTime())) continue;
    const h = s.t.getHours();
    (byHour[h] = byHour[h] || []).push(s.v);
  }
  const horas = Object.keys(byHour).map(Number).sort((a, b) => a - b);
  if (horas.length < 6) return null; // muy pocas horas muestreadas -> no fiable
  const median = (a) => { const s = [...a].sort((x, y) => x - y); return s[Math.floor(s.length / 2)]; };
  const medByHour = horas.map((h) => ({ h, m: median(byHour[h]) }));
  const vals = medByHour.map((x) => x.m);
  const globalMed = median(vals);
  const lowThr = globalMed * 0.92; // HR bajo = en reposo
  // Busca la mayor racha de horas consecutivas con HR <= lowThr (circular en horas).
  const flags = medByHour.map((x) => (x.m <= lowThr ? 1 : 0));
  // expandir circularmente para abarcar sueño que cruza medianoche
  const ext = [...flags, ...flags];
  let best = 0, cur = 0, bestStart = -1, curStart = -1;
  for (let i = 0; i < ext.length; i++) {
    if (ext[i]) { if (cur === 0) curStart = i % 24; cur++; if (cur > best) { best = cur; bestStart = curStart; } }
    else cur = 0;
  }
  if (best < 4) return null; // ventana demasiado corta para ser sueño
  return { hours: clamp(best, 4, 10), startHour: bestStart };
}

function applySleepProxy(days) {
  const n = days.length;
  if (!n) return days;
  const mean = (arr) => arr.reduce((a, b) => a + b, 0) / arr.length;
  const std = (arr, m) => { const v = arr.reduce((a, b) => a + (b - m) ** 2, 0) / arr.length; return Math.sqrt(v) || 1; };
  const hrv = days.map((d) => d.hrv);
  const rhr = days.map((d) => d.rhr);
  const mH = mean(hrv), sH = std(hrv, mH);
  const mR = mean(rhr), sR = std(rhr, mR);
  return days.map((d) => {
    const hrvZ = (d.hrv - mH) / sH;
    const rhrZ = (d.rhr - mR) / sR;
    const recovery = clamp(50 + 14 * hrvZ - 11 * rhrZ, 8, 96);
    // (1) Ventana por timing
    const win = d.hrSeries && d.hrSeries.length ? estimateSleepWindowHours(d.hrSeries) : null;
    let hours, source;
    if (win) { hours = win.hours; source = "timing"; }
    else { hours = clamp(6.3 + (recovery - 50) / 50 * 1.6, 5.2, 8.3); source = "recovery"; }
    // (3) calidad: recuperación + luz solar (circadiano). Más luz -> mejor sueño.
    const daylight = d.timeInDaylight || 0;
    const daylightBonus = clamp((daylight - 30) / 30, -8, 10); // ~30min base
    const eff = clamp(72 + (recovery - 50) * 0.42 + daylightBonus, 56, 96);
    return { ...d, sleepHours: +hours.toFixed(1), sleepEff: Math.round(eff), sleepPerf: Math.round(recovery), sleepProxySource: source, sleepEstimated: true };
  });
}

// Punto de entrada: detecta formato y convierte.
function parseHealthCsv(rows, headers) {
  const fmt = detectFormat(headers);
  let res;
  if (fmt === "tidy") res = buildRawFromTidy(rows);
  else if (fmt === "wide") res = buildRawFromWide(rows, headers);
  else {
    const tidy = buildRawFromTidy(rows);
    if (tidy.days.length >= 3) res = tidy;
    else res = buildRawFromWide(rows, headers);
  }
  if (!res.days.length) return res;
  if (!res.diag.hasSleep) {
    res.days = applySleepProxy(res.days);
    res.diag.sleepEstimated = true;
  }
  return res;
}

// Campos mostrados en el mapeo manual (solo etiquetas; la detección
// automática usa METRIC_PATTERNS, no esto).
const FIELD_DEFS = [
  { key: "hrv", label: "HRV (ms)", required: true },
  { key: "rhr", label: "RHR (bpm)", required: true },
  { key: "recovery", label: "Recuperación (%)", required: false },
  { key: "resp", label: "Frec. respiratoria", required: false },
  { key: "skinTemp", label: "Desv. temp. piel", required: false },
  { key: "sleepEff", label: "Eficiencia de sueño (%)", required: false },
  { key: "sleepHours", label: "Horas de sueño", required: false },
  { key: "steps", label: "Pasos", required: false },
  { key: "wakeUps", label: "Despertares", required: false },
  { key: "date", label: "Fecha", required: true },
];

export function useBiopulseData() {
  const demoRaw = useMemo(() => generateSyntheticRawDays(), []);
  const demoData = useMemo(() => computePipeline(demoRaw), [demoRaw]);

  const [customData, setCustomData] = useState(null);
  const [customSourceLabel, setCustomSourceLabel] = useState(null);
  const [historyRange, setHistoryRange] = useState(30);
  const [riskThreshold, setRiskThreshold] = useState(30);

  const [showModal, setShowModal] = useState(false);
  const [activeTab, setActiveTab] = useState("wearable");
  const [connections, setConnections] = useState({
    fitbit: { connected: false, token: "", lastSync: null },
    whoop: { connected: false, token: "", lastSync: null },
  });
  const [syncStatus, setSyncStatus] = useState({ fitbit: null, whoop: null });
  const [csvHeaders, setCsvHeaders] = useState([]);
  const [csvMapping, setCsvMapping] = useState({});
  const [csvRows, setCsvRows] = useState([]);
  const [csvDiag, setCsvDiag] = useState(null);
  const [csvError, setCsvError] = useState(null);
  const [csvFileName, setCsvFileName] = useState(null);

  // Perfil de usuario (onboarding): calibra contexto personal (edad, objetivo,
  // condiciones) para hacer el BioScore/Sleep y el Coach mas personales.
  // NO inventa datos: solo anade contexto a las metricas reales.
  const [profile, setProfileState] = useState(null);

  useEffect(() => {
    const store = window.storage;
    (async () => {
      try { const c = await store?.get("biopulse-connections"); if (c?.value) setConnections(JSON.parse(c.value)); } catch (e) {}
      try {
        const s = await store?.get("biopulse-custom-source");
        if (s?.value) {
          const p = JSON.parse(s.value);
          const rawDays = p.rawDays.map((d) => ({ ...d, date: new Date(d.date) }));
          setCustomData(computePipeline(rawDays));
          setCustomSourceLabel(p.label);
        }
      } catch (e) {}
      try { const hr = await store?.get("biopulse-history-range"); if (hr?.value) setHistoryRange(Number(hr.value) || 30); } catch (e) {}
      try { const rt = await store?.get("biopulse-risk-threshold"); if (rt?.value) setRiskThreshold(Number(rt.value) || 30); } catch (e) {}
      try { const pf = await store?.get("biopulse-profile"); if (pf?.value) setProfileState(JSON.parse(pf.value)); } catch (e) {}
    })();
  }, []);

  const persistProfile = async (next) => { setProfileState(next); try { await window.storage?.set("biopulse-profile", JSON.stringify(next), false); } catch (e) {} };

  const persistHistoryRange = async (v) => { setHistoryRange(v); try { await window.storage?.set("biopulse-history-range", String(v)); } catch (e) {} };
  const persistRiskThreshold = async (v) => { setRiskThreshold(v); try { await window.storage?.set("biopulse-risk-threshold", String(v)); } catch (e) {} };
  const persistConnections = async (next) => { setConnections(next); try { await window.storage?.set("biopulse-connections", JSON.stringify(next), false); } catch (e) {} };

  function handleCsvFile(e) {
    const file = e.target.files[0];
    if (!file) return;
    setCsvFileName(file.name); setCsvError(null); setCsvDiag(null);
    Papa.parse(file, {
      header: true, dynamicTyping: false, skipEmptyLines: true, worker: false,
      complete: (res) => {
        if (!res.data.length) { setCsvError("El archivo no tiene filas válidas."); return; }
        const headers = res.meta.fields || [];
        const parsed = parseHealthCsv(res.data, headers);
        setCsvHeaders(headers); setCsvRows(res.data); setCsvDiag(parsed.diag || null);
        if (parsed.diag?.format === "wide") setCsvMapping(autoDetectMappingWide(headers));
        if (parsed.diag?.error) setCsvError(parsed.diag.error);
        else if (!parsed.days.length) setCsvError("No se encontraron días con HRV y RHR válidos en el archivo.");
      },
      error: (err) => setCsvError(err.message || "No se pudo leer el archivo."),
    });
  }
  async function confirmCsv() {
    const parsed = csvRows.length ? parseHealthCsv(csvRows, csvHeaders) : { days: [] };
    const rawDays = parsed.days;
    if (rawDays.length < 3) { setCsvError("Se necesitan al menos 3 días válidos (con HRV y RHR numéricos) para calcular el modelo."); return; }
    const processed = computePipeline(rawDays);
    setCustomData(processed); setCustomSourceLabel(csvFileName); setShowModal(false);
    try {
      await window.storage?.set("biopulse-custom-source", JSON.stringify({ label: csvFileName, rawDays: rawDays.map((d) => ({ ...d, date: d.date.toISOString() })) }), false);
    } catch (e) {}
  }
  function autoDetectMappingWide(headers) {
    const mapping = {};
    for (const m of Object.keys(METRIC_PATTERNS)) {
      for (const h of headers) { if (matchMetric(norm(h), m)) { mapping[m] = h; break; } }
    }
    return mapping;
  }
  async function clearCustom() {
    setCustomData(null); setCustomSourceLabel(null); setCsvHeaders([]); setCsvRows([]); setCsvDiag(null); setCsvFileName(null);
    try { await window.storage?.delete("biopulse-custom-source"); } catch (e) {}
  }
  async function clearAllData() {
    setCustomData(null); setCustomSourceLabel(null); setCsvHeaders([]); setCsvRows([]); setCsvDiag(null); setCsvFileName(null);
    setHistoryRange(30); setRiskThreshold(30);
    try {
      await window.storage?.delete("biopulse-custom-source");
      await window.storage?.delete("biopulse-history-range");
      await window.storage?.delete("biopulse-risk-threshold");
    } catch (e) {}
  }

  return {
    demoData, customData, customSourceLabel,
    profile, setProfile: persistProfile,
    historyRange, setHistoryRange: persistHistoryRange,
    riskThreshold, setRiskThreshold: persistRiskThreshold,
    clearAllData,
    showModal, setShowModal,
    activeTab, setActiveTab,
    connections, setConnections: persistConnections,
    syncStatus, setSyncStatus,
    handleCsvFile, csvHeaders, csvMapping, setCsvMapping,
    csvError, csvFileName, csvRowCount: csvRows.length, csvDiag,
    confirmCsv, clearCustom,
    FIELD_DEFS,
  };
}
