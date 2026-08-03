// ============================================================
// HOOK useBiopulseData — aísla todo el estado de la app:
// fuente demo/CSV/wearable, periodo, conexiones, CSV, persistencia.
// La UI solo consume el objeto devuelto.
// ============================================================
import { useMemo, useState, useEffect } from "react";
import Papa from "papaparse";
import { generateSyntheticRawDays, computePipeline } from "../lib/bioUtils.js";

const FIELD_DEFS = [
  { key: "date", label: "Fecha", required: true, synonyms: ["date","fecha","day","cycle start time","timestamp"] },
  { key: "hrv", label: "HRV (ms)", required: true, synonyms: ["hrv","heart rate variability","hrv_rmssd","rmssd"] },
  { key: "rhr", label: "RHR (bpm)", required: true, synonyms: ["rhr","resting_heart_rate","resting heart rate","resting hr"] },
  { key: "recovery", label: "Recuperación (%)", required: false, synonyms: ["recovery","recovery_score","recovery score"] },
  { key: "resp", label: "Frec. respiratoria", required: false, synonyms: ["respiratory_rate","respiratory rate","breathing rate"] },
  { key: "skinTemp", label: "Desv. temp. piel", required: false, synonyms: ["skin_temp_deviation","skin temp deviation","temperature deviation"] },
  { key: "sleepEff", label: "Eficiencia de sueño (%)", required: false, synonyms: ["sleep_efficiency","sleep efficiency"] },
  { key: "sleepPerf", label: "Sleep Performance (%)", required: false, synonyms: ["sleep_performance","sleep performance"] },
  { key: "sleepHours", label: "Horas de sueño", required: false, synonyms: ["sleep_hours","sleep duration","total sleep time"] },
  { key: "dayStrain", label: "Strain diario", required: false, synonyms: ["day_strain","strain","strain score"] },
  { key: "steps", label: "Pasos", required: false, synonyms: ["steps","step count"] },
  { key: "wakeUps", label: "Despertares", required: false, synonyms: ["wake_ups","awakenings","wakeups"] },
];
const norm = (s) => String(s).toLowerCase().trim().replace(/[_-]+/g, " ").replace(/\s+/g, " ");
function autoDetectMapping(headers) {
  const mapping = {};
  FIELD_DEFS.forEach(({ key, synonyms }) => {
    const norms = synonyms.map(norm);
    const hit = headers.find((h) => norms.includes(norm(h))) ||
      headers.find((h) => norms.some((s) => norm(h).includes(s) || s.includes(norm(h))));
    mapping[key] = hit || "";
  });
  return mapping;
}
const DEFAULTS = { recovery: 65, resp: 15, skinTemp: 0, sleepEff: 85, sleepPerf: 85, sleepHours: 7, dayStrain: 10, steps: 6000, wakeUps: 1 };
function buildRawFromCsv(rows, mapping) {
  const out = [];
  rows.forEach((row, idx) => {
    const hrvVal = mapping.hrv ? parseFloat(row[mapping.hrv]) : NaN;
    const rhrVal = mapping.rhr ? parseFloat(row[mapping.rhr]) : NaN;
    if (Number.isNaN(hrvVal) || Number.isNaN(rhrVal)) return;
    let date;
    if (mapping.date && row[mapping.date]) {
      const parsed = new Date(row[mapping.date]);
      date = Number.isNaN(parsed.getTime()) ? null : parsed;
    }
    if (!date) { date = new Date(); date.setDate(date.getDate() - (rows.length - 1 - idx)); }
    const get = (key) => {
      const col = mapping[key];
      if (!col) return DEFAULTS[key];
      const v = parseFloat(row[col]);
      return Number.isNaN(v) ? DEFAULTS[key] : v;
    };
    const sleepEff = get("sleepEff");
    out.push({
      date, hrv: hrvVal, rhr: rhrVal, recovery: get("recovery"), dayStrain: get("dayStrain"),
      sleepHours: get("sleepHours"), sleepEff, sleepPerf: mapping.sleepPerf ? get("sleepPerf") : sleepEff,
      resp: get("resp"), skinTemp: get("skinTemp"), steps: Math.round(get("steps")), wakeUps: Math.round(get("wakeUps")),
    });
  });
  return out.sort((a, b) => a.date - b.date);
}

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
  const [csvError, setCsvError] = useState(null);
  const [csvFileName, setCsvFileName] = useState(null);

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
    })();
  }, []);

  const persistHistoryRange = async (v) => { setHistoryRange(v); try { await window.storage?.set("biopulse-history-range", String(v)); } catch (e) {} };
  const persistRiskThreshold = async (v) => { setRiskThreshold(v); try { await window.storage?.set("biopulse-risk-threshold", String(v)); } catch (e) {} };
  const persistConnections = async (next) => { setConnections(next); try { await window.storage?.set("biopulse-connections", JSON.stringify(next), false); } catch (e) {} };

  function handleCsvFile(e) {
    const file = e.target.files[0];
    if (!file) return;
    setCsvFileName(file.name); setCsvError(null);
    Papa.parse(file, {
      header: true, dynamicTyping: false, skipEmptyLines: true, worker: false,
      complete: (res) => {
        if (!res.data.length) { setCsvError("El archivo no tiene filas válidas."); return; }
        const headers = res.meta.fields || [];
        setCsvHeaders(headers); setCsvRows(res.data); setCsvMapping(autoDetectMapping(headers));
      },
      error: (err) => setCsvError(err.message || "No se pudo leer el archivo."),
    });
  }
  async function confirmCsv() {
    const rawDays = buildRawFromCsv(csvRows, csvMapping);
    if (rawDays.length < 3) { setCsvError("Se necesitan al menos 3 días válidos (con HRV y RHR numéricos) para calcular el modelo."); return; }
    const processed = computePipeline(rawDays);
    setCustomData(processed); setCustomSourceLabel(csvFileName); setShowModal(false);
    try {
      await window.storage?.set("biopulse-custom-source", JSON.stringify({ label: csvFileName, rawDays: rawDays.map((d) => ({ ...d, date: d.date.toISOString() })) }), false);
    } catch (e) {}
  }
  async function clearCustom() {
    setCustomData(null); setCustomSourceLabel(null); setCsvHeaders([]); setCsvRows([]); setCsvFileName(null);
    try { await window.storage?.delete("biopulse-custom-source"); } catch (e) {}
  }
  async function clearAllData() {
    setCustomData(null); setCustomSourceLabel(null); setCsvHeaders([]); setCsvRows([]); setCsvFileName(null);
    setHistoryRange(30); setRiskThreshold(30);
    try {
      await window.storage?.delete("biopulse-custom-source");
      await window.storage?.delete("biopulse-history-range");
      await window.storage?.delete("biopulse-risk-threshold");
    } catch (e) {}
  }

  return {
    demoData, customData, customSourceLabel,
    historyRange, setHistoryRange: persistHistoryRange,
    riskThreshold, setRiskThreshold: persistRiskThreshold,
    clearAllData,
    showModal, setShowModal,
    activeTab, setActiveTab,
    connections, setConnections: persistConnections,
    syncStatus, setSyncStatus,
    handleCsvFile, csvHeaders, csvMapping, setCsvMapping,
    csvError, csvFileName, csvRowCount: csvRows.length,
    confirmCsv, clearCustom,
    FIELD_DEFS,
  };
}
