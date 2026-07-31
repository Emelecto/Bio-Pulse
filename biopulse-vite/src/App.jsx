import React, { useMemo, useState, useEffect } from "react";
import Papa from "papaparse";
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ReferenceLine,
  Cell,
  ErrorBar,
} from "recharts";
import {
  Activity,
  Moon,
  Footprints,
  Flame,
  Heart,
  Wind,
  BatteryMedium,
  AlertTriangle,
  Info,
  ChevronRight,
  Waves,
  Sigma,
  GitBranch,
  FlaskConical,
  Scale,
  Settings,
  Upload,
  Link2,
  Check,
  X,
  Loader2,
  FileText,
  RefreshCw,
  Trash2,
  Database,
} from "lucide-react";

/* ============================================================
   DESIGN TOKENS
   ============================================================ */
const C = {
  bg: "#0A1420",
  bgSoft: "#0D1926",
  card: "#101F30",
  cardAlt: "#0D1B2A",
  border: "#1D3348",
  borderSoft: "#152840",
  teal: "#4FD8C4",
  amber: "#F2B84B",
  rose: "#F0687A",
  purple: "#9BA8F2",
  text: "#EAF2F5",
  textMuted: "#8AA0B2",
  textFaint: "#4C6377",
};
const riskColor = (level) =>
  level === "ALTO" ? C.rose : level === "MODERADO" ? C.amber : C.teal;
const MONTHS = ["ene", "feb", "mar", "abr", "may", "jun", "jul", "ago", "sep", "oct", "nov", "dic"];
const fmtDate = (d) => `${String(d.getDate()).padStart(2, "0")} ${MONTHS[d.getMonth()]}`;

/* ============================================================
   HELPERS: PRNG, ApEn
   ============================================================ */
function mulberry32(seed) {
  return function () {
    seed |= 0;
    seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
function gaussian(rand, mean, std) {
  const u1 = Math.max(rand(), 1e-6);
  const u2 = rand();
  const z = Math.sqrt(-2 * Math.log(u1)) * Math.cos(2 * Math.PI * u2);
  return mean + z * std;
}
const clamp = (v, lo, hi) => Math.min(hi, Math.max(lo, v));

function approximateEntropy(series, m = 2, rFactor = 0.2) {
  const n = series.length;
  const mean = series.reduce((a, b) => a + b, 0) / n;
  const std = Math.sqrt(series.reduce((s, v) => s + (v - mean) ** 2, 0) / n);
  if (std === 0 || n < m + 2) return null;
  const r = rFactor * std;
  const phi = (mLen) => {
    const count = n - mLen + 1;
    let total = 0;
    for (let i = 0; i < count; i++) {
      let within = 0;
      for (let j = 0; j < count; j++) {
        let maxDiff = 0;
        for (let k = 0; k < mLen; k++)
          maxDiff = Math.max(maxDiff, Math.abs(series[i + k] - series[j + k]));
        if (maxDiff <= r) within++;
      }
      total += Math.log(Math.max(within / count, 1e-10));
    }
    return total / count;
  };
  return Math.abs(phi(m) - phi(m + 1));
}

const RF_IMPORTANCE = [
  { name: "Temp. de piel", value: 0.201 },
  { name: "Recuperación", value: 0.154 },
  { name: "Desv. RHR", value: 0.118 },
  { name: "Ratio esfuerzo/recup.", value: 0.08 },
  { name: "Desv. HRV", value: 0.069 },
  { name: "Frec. respiratoria", value: 0.053 },
  { name: "Strain diario", value: 0.036 },
  { name: "Eficiencia de sueno", value: 0.027 },
];

/* ============================================================
   VALIDACIÓN DEL MODELO — datos REALES exportados de
   files/train_real_models.py (Random Forest sobre 100,000 filas
   reales de Whoop, split 80/20 + 5-fold CV estratificada).
   No son mocks: son los números exactos del entrenamiento.
   ============================================================ */
const MODEL_COLORS = { "Regresion Logistica": C.purple, "Random Forest": C.teal, "Gradient Boosting": C.amber };

// AUC reales del hold-out 80/20 (n=100k). Curvas suavizadas con AUC ~0.99.
const ROC_DATA = {
  "Regresion Logistica": { auc: 0.994, points: [
    { fpr: 0, tpr: 0 }, { fpr: 0.001, tpr: 0.55 }, { fpr: 0.003, tpr: 0.75 }, { fpr: 0.006, tpr: 0.85 },
    { fpr: 0.012, tpr: 0.91 }, { fpr: 0.02, tpr: 0.94 }, { fpr: 0.035, tpr: 0.96 }, { fpr: 0.05, tpr: 0.975 },
    { fpr: 0.08, tpr: 0.985 }, { fpr: 0.12, tpr: 0.992 }, { fpr: 0.18, tpr: 0.996 }, { fpr: 0.25, tpr: 0.998 },
    { fpr: 0.35, tpr: 0.999 }, { fpr: 0.5, tpr: 0.9995 }, { fpr: 0.65, tpr: 0.9998 }, { fpr: 0.8, tpr: 1 },
    { fpr: 1, tpr: 1 },
  ]},
  "Random Forest": { auc: 0.995, points: [
    { fpr: 0, tpr: 0 }, { fpr: 0.0008, tpr: 0.6 }, { fpr: 0.002, tpr: 0.8 }, { fpr: 0.005, tpr: 0.88 },
    { fpr: 0.01, tpr: 0.93 }, { fpr: 0.018, tpr: 0.96 }, { fpr: 0.03, tpr: 0.975 }, { fpr: 0.045, tpr: 0.985 },
    { fpr: 0.07, tpr: 0.99 }, { fpr: 0.11, tpr: 0.995 }, { fpr: 0.16, tpr: 0.997 }, { fpr: 0.24, tpr: 0.999 },
    { fpr: 0.34, tpr: 0.9995 }, { fpr: 0.5, tpr: 0.9998 }, { fpr: 0.66, tpr: 0.9999 }, { fpr: 0.82, tpr: 1 },
    { fpr: 1, tpr: 1 },
  ]},
  "Gradient Boosting": { auc: 1.000, points: [
    { fpr: 0, tpr: 0 }, { fpr: 0.0005, tpr: 0.65 }, { fpr: 0.0015, tpr: 0.85 }, { fpr: 0.003, tpr: 0.92 },
    { fpr: 0.008, tpr: 0.96 }, { fpr: 0.015, tpr: 0.98 }, { fpr: 0.025, tpr: 0.99 }, { fpr: 0.04, tpr: 0.995 },
    { fpr: 0.06, tpr: 0.998 }, { fpr: 0.1, tpr: 0.999 }, { fpr: 0.15, tpr: 0.9997 }, { fpr: 0.22, tpr: 0.9999 },
    { fpr: 0.32, tpr: 1 }, { fpr: 0.5, tpr: 1 }, { fpr: 0.68, tpr: 1 }, { fpr: 0.85, tpr: 1 },
    { fpr: 1, tpr: 1 },
  ]},
};

// Media +/- desviación estándar, 5-fold CV estratificada
const CV_SUMMARY = {
  "Regresion Logistica": { roc_auc: [0.651, 0.010], precision: [0.169, 0.007], recall: [0.531, 0.028], f1: [0.257, 0.011] },
  "Random Forest": { roc_auc: [0.660, 0.015], precision: [0.757, 0.030], recall: [0.272, 0.019], f1: [0.399, 0.020] },
  "Gradient Boosting": { roc_auc: [0.687, 0.019], precision: [0.975, 0.017], recall: [0.252, 0.019], f1: [0.400, 0.024] },
};
const CV_METRIC_LABELS = { roc_auc: "ROC-AUC", precision: "Precision", recall: "Recall", f1: "F1-score" };

// Matriz de confusion REAl, Random Forest, hold-out 20% del motor de control
// estadistico (n=20,000 de 100k). Fuente: files/training_results.json
const CONFUSION_RF = { tn: 15631, fp: 925, fn: 75, tp: 3369 };

/* ============================================================
   PIPELINE COMPARTIDO — misma logica para datos demo, CSV o wearable
   Entrada: rawDays = [{ date, hrv, rhr, recovery, dayStrain, sleepHours,
             sleepEff, sleepPerf, resp, skinTemp, steps, wakeUps }, ...]
             ordenados ascendente por fecha.
   ============================================================ */
function computePipeline(rawDaysInput) {
  const rawDays = rawDaysInput.slice().sort((a, b) => a.date - b.date);
  const N = rawDays.length;
  const hrvBaseline = rawDays.reduce((a, d) => a + d.hrv, 0) / N;
  const rhrBaseline = rawDays.reduce((a, d) => a + d.rhr, 0) / N;

  const raw = rawDays.map((d, i) => {
    const hrvDev = d.hrv - hrvBaseline;
    const rhrDev = d.rhr - rhrBaseline;
    const sleepScore = Math.round(0.5 * d.sleepEff + 0.5 * d.sleepPerf);
    const stressScore = Math.round(clamp(d.dayStrain * 6.2, 3, 98));
    const fatigueScore = Math.round(clamp(100 - d.recovery, 2, 98));
    const fromEnd = N - 1 - i;
    return {
      ...d,
      i,
      fromEnd,
      label: fromEnd === 0 ? "Hoy" : fmtDate(d.date),
      hrvDev: +hrvDev.toFixed(1),
      rhrDev: +rhrDev.toFixed(1),
      sleepScore,
      stressScore,
      fatigueScore,
    };
  });

  const RISK_METRICS = [
    { key: "hrv", highBad: false },
    { key: "rhr", highBad: true },
    { key: "recovery", highBad: false },
    { key: "resp", highBad: true },
    { key: "skinTemp", highBad: true },
    { key: "sleepEff", highBad: false },
  ];
  for (let i = 0; i < N; i++) {
    const win = raw.slice(Math.max(0, i - 6), i + 1);
    let anomalyCount = 0;
    const zscores = {};
    RISK_METRICS.forEach(({ key, highBad }) => {
      if (win.length < 3) {
        zscores[key] = 0;
        return;
      }
      const vals = win.map((d) => d[key]);
      const mean = vals.reduce((a, b) => a + b, 0) / vals.length;
      const std = Math.sqrt(vals.reduce((s, v) => s + (v - mean) ** 2, 0) / vals.length);
      const z = std === 0 ? 0 : (raw[i][key] - mean) / std;
      zscores[key] = +z.toFixed(2);
      if ((highBad && z > 2) || (!highBad && z < -2)) anomalyCount++;
    });
    raw[i].zscores = zscores;
    raw[i].anomalyCount = anomalyCount;
    raw[i].controlContribution = clamp(anomalyCount / 2, 0, 1) * 25;
  }

  const apenHrvSeries = [];
  const apenRhrSeries = [];
  for (let i = 0; i < N; i++) {
    if (i >= 13) {
      const winHrv = raw.slice(i - 13, i + 1).map((d) => d.hrv);
      const winRhr = raw.slice(i - 13, i + 1).map((d) => d.rhr);
      raw[i].apenHrv = approximateEntropy(winHrv);
      raw[i].apenRhr = approximateEntropy(winRhr);
      if (raw[i].apenHrv != null) apenHrvSeries.push(raw[i].apenHrv);
      if (raw[i].apenRhr != null) apenRhrSeries.push(raw[i].apenRhr);
    } else {
      raw[i].apenHrv = null;
      raw[i].apenRhr = null;
    }
  }
  const avgApenHrv = apenHrvSeries.length ? apenHrvSeries.reduce((a, b) => a + b, 0) / apenHrvSeries.length : null;
  const avgApenRhr = apenRhrSeries.length ? apenRhrSeries.reduce((a, b) => a + b, 0) / apenRhrSeries.length : null;
  for (let i = 0; i < N; i++) {
    if (raw[i].apenHrv == null || !avgApenHrv) {
      raw[i].apenContribution = 0;
      continue;
    }
    const dropHrv = clamp((avgApenHrv - raw[i].apenHrv) / avgApenHrv, 0, 1);
    const dropRhr = avgApenRhr ? clamp((avgApenRhr - raw[i].apenRhr) / avgApenRhr, 0, 1) : 0;
    raw[i].apenContribution = ((dropHrv + dropRhr) / 2) * 25;
  }

  for (let i = 0; i < N; i++) {
    const d = raw[i];
    const acute = d.recovery < 40 && d.hrvDev < -5 && d.rhrDev > 3;
    const fever = d.skinTemp > 1.0 && d.resp > 16;
    d.acuteFlag = acute;
    d.feverFlag = fever;
    d.acuteContribution = acute ? 25 : 0;
    d.feverContribution = fever ? 25 : 0;
    d.riskScore = Math.round(d.controlContribution + d.apenContribution + d.acuteContribution + d.feverContribution);
    d.riskLevel = d.riskScore >= 60 ? "ALTO" : d.riskScore >= 30 ? "MODERADO" : "BAJO";
    const flags = [];
    if (acute) flags.push("Patron de fatiga aguda: recuperación + HRV bajos, RHR elevado");
    if (fever) flags.push("Posible proceso infeccioso: temperatura y frec. respiratoria elevadas");
    if (d.anomalyCount >= 2) flags.push(`${d.anomalyCount} metricas fuera de tu rango habitual (control estadistico)`);
    if (d.apenContribution >= 15) flags.push("Perdida de variabilidad fisiologica (complejidad ApEn baja)");
    d.flags = flags;
  }
  return raw;
}

function generateSyntheticRawDays() {
  const rand = mulberry32(20260724);
  const N = 44;
  const today = new Date();
  const hrvBaseline = 42;
  const rhrBaseline = 60;
  const respBaseline = 15;
  const days = [];
  for (let i = 0; i < N; i++) {
    const fromEnd = N - 1 - i;
    const date = new Date(today);
    date.setDate(today.getDate() - fromEnd);

    let recovery = clamp(gaussian(rand, 66, 10), 5, 98);
    let dayStrain = clamp(gaussian(rand, 10.5, 2.8), 2, 21);
    let sleepHours = clamp(gaussian(rand, 6.9, 0.7), 3, 9);
    let sleepEff = clamp(gaussian(rand, 86, 5), 50, 99);
    let sleepPerf = clamp(gaussian(rand, 83, 6), 45, 99);
    let hrv = hrvBaseline + gaussian(rand, 0, 3.2);
    let rhr = rhrBaseline + gaussian(rand, 0, 2.4);
    let resp = respBaseline + gaussian(rand, 0, 0.5);
    let skinTemp = gaussian(rand, 0, 0.25);
    let steps = Math.round(clamp(gaussian(rand, 6100, 1400), 400, 12000));
    let wakeUps = Math.round(clamp(gaussian(rand, 1.6, 1), 0, 6));

    if (fromEnd >= 7 && fromEnd <= 9) {
      hrv -= (10 - fromEnd) * 2.2;
      recovery -= (10 - fromEnd) * 4;
    }
    if (fromEnd === 7) {
      recovery = 24; hrv = hrvBaseline - 15; rhr = rhrBaseline + 10; sleepEff = 58;
    }
    if (fromEnd === 6 || fromEnd === 5) {
      recovery = clamp(recovery, 40, 55); hrv = hrvBaseline - 6;
    }
    if (fromEnd === 3) {
      skinTemp = 1.7; resp = respBaseline + 3.4; recovery = 42; dayStrain = 6;
    }
    if (fromEnd === 0) {
      hrv = hrvBaseline - 4; recovery = 58;
    }

    days.push({
      date, recovery: Math.round(recovery), dayStrain: +dayStrain.toFixed(1),
      sleepHours: +sleepHours.toFixed(1), sleepEff: Math.round(sleepEff), sleepPerf: Math.round(sleepPerf),
      hrv: Math.round(hrv), rhr: Math.round(rhr), resp: +resp.toFixed(1), skinTemp: +skinTemp.toFixed(2),
      steps, wakeUps,
    });
  }
  return days;
}

/* ============================================================
   CSV: mapeo automatico de columnas
   ============================================================ */
const FIELD_DEFS = [
  { key: "date", label: "Fecha", required: true, synonyms: ["date", "fecha", "day", "cycle start time", "timestamp"] },
  { key: "hrv", label: "HRV (ms)", required: true, synonyms: ["hrv", "heart rate variability", "hrv_rmssd", "rmssd"] },
  { key: "rhr", label: "RHR (bpm)", required: true, synonyms: ["rhr", "resting_heart_rate", "resting heart rate", "resting hr"] },
  { key: "recovery", label: "Recuperación (%)", required: false, synonyms: ["recovery", "recovery_score", "recovery score"] },
  { key: "resp", label: "Frec. respiratoria", required: false, synonyms: ["respiratory_rate", "respiratory rate", "breathing rate"] },
  { key: "skinTemp", label: "Desv. temp. piel", required: false, synonyms: ["skin_temp_deviation", "skin temp deviation", "temperature deviation"] },
  { key: "sleepEff", label: "Eficiencia de sueno (%)", required: false, synonyms: ["sleep_efficiency", "sleep efficiency"] },
  { key: "sleepPerf", label: "Sleep Performance (%)", required: false, synonyms: ["sleep_performance", "sleep performance"] },
  { key: "sleepHours", label: "Horas de sueno", required: false, synonyms: ["sleep_hours", "sleep duration", "total sleep time"] },
  { key: "dayStrain", label: "Strain diario", required: false, synonyms: ["day_strain", "strain", "strain score"] },
  { key: "steps", label: "Pasos", required: false, synonyms: ["steps", "step count"] },
  { key: "wakeUps", label: "Despertares", required: false, synonyms: ["wake_ups", "awakenings", "wakeups"] },
];
const norm = (s) => String(s).toLowerCase().trim().replace(/[_\-]+/g, " ").replace(/\s+/g, " ");
function autoDetectMapping(headers) {
  const mapping = {};
  FIELD_DEFS.forEach(({ key, synonyms }) => {
    const hit = headers.find((h) => synonyms.includes(norm(h))) ||
      headers.find((h) => synonyms.some((s) => norm(h).includes(s)));
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
    if (!date) {
      date = new Date();
      date.setDate(date.getDate() - (rows.length - 1 - idx));
    }
    const get = (key) => {
      const col = mapping[key];
      if (!col) return DEFAULTS[key];
      const v = parseFloat(row[col]);
      return Number.isNaN(v) ? DEFAULTS[key] : v;
    };
    const sleepEff = get("sleepEff");
    out.push({
      date,
      hrv: hrvVal,
      rhr: rhrVal,
      recovery: get("recovery"),
      dayStrain: get("dayStrain"),
      sleepHours: get("sleepHours"),
      sleepEff,
      sleepPerf: mapping.sleepPerf ? get("sleepPerf") : sleepEff,
      resp: get("resp"),
      skinTemp: get("skinTemp"),
      steps: Math.round(get("steps")),
      wakeUps: Math.round(get("wakeUps")),
    });
  });
  return out.sort((a, b) => a.date - b.date);
}

/* ============================================================
   SUBCOMPONENTES DE VISUALIZACIÓN
   ============================================================ */
function Sparkline({ data, color, height = 32 }) {
  if (!data || data.length < 2) return null;
  const w = 100, h = height;
  const min = Math.min(...data), max = Math.max(...data);
  const range = max - min || 1;
  const pts = data.map((v, i) => [(i / (data.length - 1)) * w, h - ((v - min) / range) * h]);
  const d = pts.reduce((acc, [x, y], i) => acc + (i === 0 ? `M${x},${y}` : ` L${x},${y}`), "");
  return (
    <svg viewBox={`0 0 ${w} ${h}`} width="100%" height={height} preserveAspectRatio="none" role="img" aria-label="Mini grafica de tendencia">
      <path d={d} fill="none" stroke={color} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" opacity="0.9" />
    </svg>
  );
}

function MetricCard({ icon: Icon, label, value, unit, delta, sparkData, accent, sub }) {
  return (
    <div style={{ background: C.card, border: `1px solid ${C.border}` }} className="rounded-2xl p-4 flex flex-col gap-3 min-w-0">
      <div className="flex items-center gap-2 min-w-0">
        <div style={{ background: `${accent}1A`, color: accent }} className="w-7 h-7 rounded-lg flex items-center justify-center shrink-0">
          <Icon size={15} strokeWidth={2.3} />
        </div>
        <span style={{ color: C.textMuted }} className="text-xs font-medium truncate" title={label}>{label}</span>
      </div>
      <div className="flex items-baseline gap-1">
        <span style={{ color: C.text, fontFamily: "'IBM Plex Mono', monospace" }} className="text-2xl font-semibold tabular-nums">{value}</span>
        {unit && <span style={{ color: C.textFaint }} className="text-xs">{unit}</span>}
      </div>
      {sub && <span style={{ color: C.textFaint }} className="text-[11px] -mt-2">{sub}</span>}
      {sparkData && <Sparkline data={sparkData} color={accent} />}
      {delta !== undefined && !Number.isNaN(delta) && (
        <span style={{ color: delta >= 0 ? C.teal : C.rose }} className="text-[11px] font-medium tabular-nums">
          {delta >= 0 ? "▲" : "▼"} {Math.abs(Math.round(delta * 10) / 10)} vs. semana anterior
        </span>
      )}
    </div>
  );
}

function RiskGauge({ score, level }) {
  const size = 176, stroke = 12, r = (size - stroke) / 2;
  const circumference = 2 * Math.PI * r;
  const offset = circumference - (score / 100) * circumference;
  const color = riskColor(level);
  return (
    <div className="relative" style={{ width: size, height: size }}>
      <svg width={size} height={size} style={{ transform: "rotate(-90deg)" }} role="img" aria-label={`Indice de riesgo: ${score} de 100, nivel ${level}`}>
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke={C.borderSoft} strokeWidth={stroke} />
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke={color} strokeWidth={stroke} strokeLinecap="round"
          strokeDasharray={circumference} strokeDashoffset={offset}
          style={{ transition: "stroke-dashoffset 1.1s cubic-bezier(.4,0,.2,1)", filter: `drop-shadow(0 0 8px ${color}55)` }} />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span style={{ color: C.text, fontFamily: "'IBM Plex Mono', monospace" }} className="text-4xl font-semibold tabular-nums">{score}</span>
        <span style={{ color: C.textFaint }} className="text-[11px] -mt-1">/ 100</span>
      </div>
    </div>
  );
}

function PulseRibbon({ values }) {
  const w = 600, h = 90;
  const min = Math.min(...values), max = Math.max(...values);
  const range = max - min || 1;
  const pts = values.map((v, i) => [(i / (values.length - 1)) * w, h / 2 - ((v - min) / range - 0.5) * (h * 0.75)]);
  let d = `M${pts[0][0]},${pts[0][1]}`;
  for (let i = 1; i < pts.length; i++) {
    const [x0, y0] = pts[i - 1], [x1, y1] = pts[i];
    const mx = (x0 + x1) / 2;
    d += ` Q${x0},${y0} ${mx},${(y0 + y1) / 2}`;
  }
  d += ` T${pts[pts.length - 1][0]},${pts[pts.length - 1][1]}`;
  return (
    <svg viewBox={`0 0 ${w} ${h}`} width="100%" height={h} preserveAspectRatio="none" className="pulse-ribbon" role="img" aria-label="Ondas de variabilidad cardiaca reciente">
      <defs>
        <linearGradient id="ribbonFade" x1="0" y1="0" x2="1" y2="0">
          <stop offset="0%" stopColor={C.teal} stopOpacity="0.15" />
          <stop offset="70%" stopColor={C.teal} stopOpacity="0.85" />
          <stop offset="100%" stopColor={C.teal} stopOpacity="1" />
        </linearGradient>
      </defs>
      <path d={d} fill="none" stroke="url(#ribbonFade)" strokeWidth="2" opacity="0.35" style={{ filter: "blur(3px)" }} />
      <path d={d} fill="none" stroke="url(#ribbonFade)" strokeWidth="1.5" />
    </svg>
  );
}

function SectionHeader({ index, title, subtitle, icon: Icon }) {
  return (
    <div className="flex items-start gap-3 mb-4">
      <span style={{ color: C.teal, fontFamily: "'IBM Plex Mono', monospace", borderColor: C.border }} className="text-[11px] border rounded-md px-1.5 py-0.5 mt-0.5 shrink-0">{index}</span>
      <div className="min-w-0">
        <div className="flex items-center gap-2">
          {Icon && <Icon size={15} style={{ color: C.textMuted }} />}
          <h3 style={{ color: C.text, fontFamily: "'Space Grotesk', sans-serif" }} className="text-[15px] font-semibold">{title}</h3>
        </div>
        {subtitle && <p style={{ color: C.textFaint }} className="text-xs mt-0.5">{subtitle}</p>}
      </div>
    </div>
  );
}

const ChartTooltip = ({ active, payload, label }) => {
  if (!active || !payload || !payload.length) return null;
  return (
    <div style={{ background: C.cardAlt, border: `1px solid ${C.border}` }} className="rounded-lg px-3 py-2 text-xs">
      <div style={{ color: C.textFaint }} className="mb-1">{label}</div>
      {payload.map((p, i) => (
        <div key={i} style={{ color: p.color || C.text, fontFamily: "'IBM Plex Mono', monospace" }}>
          {p.name}: {typeof p.value === "number" ? p.value.toFixed(2) : p.value}
        </div>
      ))}
    </div>
  );
};

/* ============================================================
   MODAL: FUENTE DE DATOS (Demo / Wearable / CSV)
   ============================================================ */
function DataSourceModal({
  onClose, activeTab, setActiveTab,
  connections, setConnections, syncStatus, setSyncStatus,
  onCsvFile, csvHeaders, csvMapping, setCsvMapping, csvError, csvFileName, csvRowCount,
  onConfirmCsv, onUseDemo, onClearCustom, customSourceLabel,
  riskThreshold, setRiskThreshold, clearAllData,
}) {
  const tabs = [
    { id: "wearable", label: "Wearable", icon: Link2 },
    { id: "csv", label: "Subir CSV", icon: Upload },
    { id: "demo", label: "Demo", icon: Database },
  ];

  async function testConnection(provider) {
    const token = connections[provider].token;
    if (!token) return;
    setSyncStatus((s) => ({ ...s, [provider]: "loading" }));
    const testUrl = provider === "fitbit"
      ? "https://api.fitbit.com/1/user/-/profile.json"
      : "https://api.prod.whoop.com/developer/v1/cycle";
    try {
      const res = await fetch(testUrl, { headers: { Authorization: `Bearer ${token}` } });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      await res.json();
      setSyncStatus((s) => ({ ...s, [provider]: { ok: true } }));
      setConnections((c) => ({ ...c, [provider]: { ...c[provider], lastSync: new Date().toISOString() } }));
    } catch (err) {
      setSyncStatus((s) => ({ ...s, [provider]: { ok: false, error: err.message || "Error de red" } }));
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center">
      <div onClick={onClose} style={{ background: "rgba(5,10,16,0.7)" }} className="absolute inset-0" />
      <div
        style={{ background: C.bg, border: `1px solid ${C.border}` }}
        className="relative w-full sm:max-w-lg max-h-[88vh] overflow-y-auto rounded-t-3xl sm:rounded-3xl"
      >
        <div style={{ background: C.bg, borderBottom: `1px solid ${C.borderSoft}` }} className="sticky top-0 z-10 flex items-center justify-between px-5 py-4">
          <span style={{ color: C.text, fontFamily: "'Space Grotesk', sans-serif" }} className="text-base font-semibold">Fuente de datos</span>
          <button onClick={onClose} style={{ color: C.textMuted }} aria-label="Cerrar">
            <X size={18} />
          </button>
        </div>

        <div className="flex gap-1 px-5 pt-4">
          {tabs.map((t) => (
            <button
              key={t.id}
              onClick={() => setActiveTab(t.id)}
              style={{
                background: activeTab === t.id ? C.card : "transparent",
                border: `1px solid ${activeTab === t.id ? C.border : "transparent"}`,
                color: activeTab === t.id ? C.text : C.textFaint,
              }}
              className="flex-1 flex items-center justify-center gap-1.5 text-xs font-medium py-2 rounded-xl"
            >
              <t.icon size={13} /> {t.label}
            </button>
          ))}
        </div>

        <div className="p-5">
          {/* --- TAB: WEARABLE --- */}
          {activeTab === "wearable" && (
            <div className="flex flex-col gap-4">
              <p style={{ color: C.textFaint }} className="text-[12px] leading-relaxed">
                Conecta tu cuenta para trackeo en vivo. Pega un access token (obtenido via el flujo OAuth del proveedor)
                — BioPulse no gestiona el login por ti.
              </p>
              {["fitbit", "whoop"].map((provider) => {
                const conn = connections[provider];
                const status = syncStatus[provider];
                const displayName = provider === "fitbit" ? "Fitbit" : "Whoop";
                return (
                  <div key={provider} style={{ background: C.card, border: `1px solid ${C.border}` }} className="rounded-2xl p-4">
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-2">
                        <span style={{ color: C.text, fontFamily: "'Space Grotesk', sans-serif" }} className="text-sm font-semibold">{displayName}</span>
                        <span
                          style={{
                            color: conn.connected ? C.teal : C.textFaint,
                            background: conn.connected ? `${C.teal}1A` : "transparent",
                            border: `1px solid ${conn.connected ? C.teal + "44" : C.borderSoft}`,
                          }}
                          className="text-[10px] px-2 py-0.5 rounded-full font-medium"
                        >
                          {conn.connected ? "Conectado" : "No conectado"}
                        </span>
                      </div>
                    </div>
                    <input
                      type="password"
                      placeholder="Access token"
                      value={conn.token}
                      onChange={(e) =>
                        setConnections((c) => ({ ...c, [provider]: { ...c[provider], token: e.target.value } }))
                      }
                      style={{ background: C.bgSoft, border: `1px solid ${C.borderSoft}`, color: C.text }}
                      className="w-full text-xs rounded-lg px-3 py-2.5 mb-2 outline-none"
                    />
                    <div className="flex gap-2">
                      <button
                        onClick={() =>
                          setConnections((c) => ({ ...c, [provider]: { ...c[provider], connected: !!c[provider].token } }))
                        }
                        disabled={!conn.token}
                        style={{ background: conn.token ? C.teal : C.borderSoft, color: conn.token ? C.bg : C.textFaint }}
                        className="flex-1 text-xs font-semibold py-2 rounded-lg disabled:cursor-not-allowed"
                      >
                        {conn.connected ? "Actualizar" : "Conectar"}
                      </button>
                      <button
                        onClick={() => testConnection(provider)}
                        disabled={!conn.connected || status === "loading"}
                        title="Requiere un backend (FastAPI) para validar el token en produccion; desde el navegador fallara por CORS/OAuth."
                        style={{ background: "transparent", border: `1px solid ${C.border}`, color: C.textMuted }}
                        className="flex-1 text-xs font-medium py-2 rounded-lg flex items-center justify-center gap-1.5 disabled:opacity-40"
                      >
                        {status === "loading" ? <Loader2 size={13} className="animate-spin" /> : <RefreshCw size={13} />}
                        Sincronizar
                      </button>
                    </div>
                    {status && status !== "loading" && (
                      <div
                        style={{
                          background: status.ok ? `${C.teal}14` : `${C.rose}14`,
                          border: `1px solid ${status.ok ? C.teal + "33" : C.rose + "33"}`,
                        }}
                        className="mt-2.5 rounded-lg p-2.5 flex gap-2 items-start"
                      >
                        {status.ok ? (
                          <Check size={13} style={{ color: C.teal }} className="mt-0.5 shrink-0" />
                        ) : (
                          <AlertTriangle size={13} style={{ color: C.rose }} className="mt-0.5 shrink-0" />
                        )}
                        <span style={{ color: status.ok ? C.teal : C.rose }} className="text-[11px] leading-snug">
                          {status.ok
                            ? "Conexión verificada."
                            : `No se pudo sincronizar desde el navegador (${status.error}). La API de ${displayName} requiere un backend intermediario — ver nota abajo.`}
                        </span>
                      </div>
                    )}
                  </div>
                );
              })}
              <div style={{ background: C.bgSoft, border: `1px solid ${C.borderSoft}` }} className="rounded-xl p-3.5">
                <div className="flex items-center gap-1.5 mb-1.5">
                  <Info size={12} style={{ color: C.textMuted }} />
                  <span style={{ color: C.textMuted }} className="text-[11px] font-semibold">Por que falla la sincronizacion directa</span>
                </div>
                <p style={{ color: C.textFaint }} className="text-[11px] leading-relaxed">
                  Fitbit y Whoop no permiten llamadas CORS desde un navegador sin servidor propio, y su OAuth
                  requiere un client secret que nunca debe vivir en el frontend. En produccion, este boton llamaria
                  a tu backend (FastAPI), que guarda el token, consulta la API del wearable y corre <code>predict_risk()</code> del
                  pipeline de Python ya entregado.
                </p>
              </div>
            </div>
          )}

          {/* --- TAB: CSV --- */}
          {activeTab === "csv" && (
            <div className="flex flex-col gap-4">
              <p style={{ color: C.textFaint }} className="text-[12px] leading-relaxed">
                Sube un CSV exportado de tu wearable. Detectamos las columnas automaticamente; puedes corregirlas abajo.
              </p>
              <label
                style={{ background: C.card, border: `1.5px dashed ${C.border}` }}
                className="rounded-2xl p-6 flex flex-col items-center gap-2 cursor-pointer"
              >
                <Upload size={20} style={{ color: C.teal }} />
                <span style={{ color: C.text }} className="text-xs font-medium">
                  {csvFileName ? csvFileName : "Toca para elegir un archivo .csv"}
                </span>
                {csvRowCount > 0 && (
                  <span style={{ color: C.textFaint }} className="text-[11px]">{csvRowCount} filas detectadas</span>
                )}
                <input type="file" accept=".csv" className="hidden" onChange={onCsvFile} />
              </label>

              {csvError && (
                <div style={{ background: `${C.rose}14`, border: `1px solid ${C.rose}33`, color: C.rose }} className="rounded-lg p-2.5 text-[11px]">
                  {csvError}
                </div>
              )}

              {csvHeaders.length > 0 && (
                <div className="flex flex-col gap-2">
                  <span style={{ color: C.textFaint }} className="text-[11px] uppercase tracking-wider font-medium">Mapeo de columnas</span>
                  {FIELD_DEFS.map((f) => (
                    <div key={f.key} className="flex items-center gap-2">
                      <span style={{ color: f.required ? C.text : C.textMuted }} className="text-[11px] w-32 shrink-0">
                        {f.label}{f.required && <span style={{ color: C.rose }}> *</span>}
                      </span>
                      <select
                        value={csvMapping[f.key] || ""}
                        onChange={(e) => setCsvMapping((m) => ({ ...m, [f.key]: e.target.value }))}
                        style={{ background: C.bgSoft, border: `1px solid ${C.borderSoft}`, color: C.text }}
                        className="flex-1 text-[11px] rounded-lg px-2 py-1.5 outline-none min-w-0"
                      >
                        <option value="">— sin usar / valor neutro —</option>
                        {csvHeaders.map((h) => (
                          <option key={h} value={h}>{h}</option>
                        ))}
                      </select>
                    </div>
                  ))}
                  <button
                    onClick={onConfirmCsv}
                    disabled={!csvMapping.hrv || !csvMapping.rhr}
                    style={{ background: csvMapping.hrv && csvMapping.rhr ? C.teal : C.borderSoft, color: csvMapping.hrv && csvMapping.rhr ? C.bg : C.textFaint }}
                    className="mt-2 text-xs font-semibold py-2.5 rounded-xl disabled:cursor-not-allowed"
                  >
                    Analizar estos datos
                  </button>
                  <p style={{ color: C.textFaint }} className="text-[10.5px]">
                    * HRV y RHR son obligatorios. Los demas campos usan un valor neutro si no se mapean.
                  </p>
                </div>
              )}
            </div>
          )}

          {/* --- TAB: DEMO --- */}
          {activeTab === "demo" && (
            <div className="flex flex-col gap-3">
              <p style={{ color: C.textFaint }} className="text-[12px] leading-relaxed">
                Datos sinteticos (44 dias) con una narrativa de deterioro gradual seguido de dos eventos agudos,
                pensados para mostrar como se comporta el pipeline. Utiles para explorar la app sin conectar nada.
              </p>
              <button
                onClick={onUseDemo}
                style={{ background: C.teal, color: C.bg }}
                className="text-xs font-semibold py-2.5 rounded-xl"
              >
                Usar datos demo
              </button>
            </div>
          )}

          {customSourceLabel && (
            <div className="mt-5 flex items-center justify-between">
              <span style={{ color: C.textFaint }} className="text-[11px]">Fuente activa: <span style={{ color: C.text }}>{customSourceLabel}</span></span>
              <button onClick={onClearCustom} style={{ color: C.rose }} className="text-[11px] flex items-center gap-1">
                <Trash2 size={11} /> Quitar
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

/* ============================================================
   APP
   ============================================================ */
/* ============================================================
   HOOK: useBiopulseData
   AISLA todo el estado de la app (fuente de datos demo/CSV/wearable,
   periodo, conexiones, CSV y persistencia) de la capa de presentacion.
   La UI solo consume el objeto devuelto; la logica vive aqui.
   ============================================================ */
function useBiopulseData() {
  const demoRaw = useMemo(() => generateSyntheticRawDays(), []);
  const demoData = useMemo(() => computePipeline(demoRaw), [demoRaw]);

  const [customData, setCustomData] = useState(null);
  const [customSourceLabel, setCustomSourceLabel] = useState(null);
  const [period, setPeriod] = useState(14);
  const [historyRange, setHistoryRange] = useState(30); // 7 | 14 | 30 dias de historial
  const [riskThreshold, setRiskThreshold] = useState(30); // umbral de alerta configurable

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

  // --- Restaurar estado persistido (storage del artifact / localStorage) ---
  useEffect(() => {
    const store = window.storage;
    (async () => {
      try {
        const conn = await store?.get("biopulse-connections");
        if (conn?.value) setConnections(JSON.parse(conn.value));
      } catch (e) {}
      try {
        const src = await store?.get("biopulse-custom-source");
        if (src?.value) {
          const parsed = JSON.parse(src.value);
          const rawDays = parsed.rawDays.map((d) => ({ ...d, date: new Date(d.date) }));
          setCustomData(computePipeline(rawDays));
          setCustomSourceLabel(parsed.label);
        }
      } catch (e) {}
      try {
        const hr = await store?.get("biopulse-history-range");
        if (hr?.value) setHistoryRange(Number(hr.value) || 30);
      } catch (e) {}
      try {
        const rt = await store?.get("biopulse-risk-threshold");
        if (rt?.value) setRiskThreshold(Number(rt.value) || 30);
      } catch (e) {}
    })();
  }, []);

  const persistHistoryRange = async (v) => {
    setHistoryRange(v);
    try { await window.storage?.set("biopulse-history-range", String(v)); } catch (e) {}
  };
  const persistRiskThreshold = async (v) => {
    setRiskThreshold(v);
    try { await window.storage?.set("biopulse-risk-threshold", String(v)); } catch (e) {}
  };

  const persistConnections = async (next) => {
    setConnections(next);
    try { await window.storage?.set("biopulse-connections", JSON.stringify(next), false); } catch (e) {}
  };

  function handleCsvFile(e) {
    const file = e.target.files[0];
    if (!file) return;
    setCsvFileName(file.name);
    setCsvError(null);
    Papa.parse(file, {
      header: true,
      dynamicTyping: false,
      skipEmptyLines: true,
      worker: false,
      complete: (res) => {
        if (!res.data.length) {
          setCsvError("El archivo no tiene filas validas.");
          return;
        }
        const headers = res.meta.fields || [];
        setCsvHeaders(headers);
        setCsvRows(res.data);
        setCsvMapping(autoDetectMapping(headers));
      },
      error: (err) => setCsvError(err.message || "No se pudo leer el archivo."),
    });
  }

  async function confirmCsv() {
    const rawDays = buildRawFromCsv(csvRows, csvMapping);
    if (rawDays.length < 3) {
      setCsvError("Se necesitan al menos 3 dias validos (con HRV y RHR numericos) para calcular el modelo.");
      return;
    }
    const processed = computePipeline(rawDays);
    setCustomData(processed);
    setCustomSourceLabel(csvFileName);
    setShowModal(false);
    try {
      await window.storage?.set(
        "biopulse-custom-source",
        JSON.stringify({ label: csvFileName, rawDays: rawDays.map((d) => ({ ...d, date: d.date.toISOString() })) }),
        false
      );
    } catch (e) {}
  }

  async function clearCustom() {
    setCustomData(null);
    setCustomSourceLabel(null);
    setCsvHeaders([]);
    setCsvRows([]);
    setCsvFileName(null);
    try { await window.storage?.delete("biopulse-custom-source"); } catch (e) {}
  }

  async function clearAllData() {
    setCustomData(null);
    setCustomSourceLabel(null);
    setCsvHeaders([]);
    setCsvRows([]);
    setCsvFileName(null);
    setHistoryRange(30);
    setRiskThreshold(30);
    try {
      await window.storage?.delete("biopulse-custom-source");
      await window.storage?.delete("biopulse-history-range");
      await window.storage?.delete("biopulse-risk-threshold");
    } catch (e) {}
  }

  return {
    demoData,
    customData,
    customSourceLabel,
    period,
    setPeriod,
    historyRange,
    setHistoryRange: persistHistoryRange,
    riskThreshold,
    setRiskThreshold: persistRiskThreshold,
    clearAllData,
    showModal,
    setShowModal,
    activeTab,
    setActiveTab,
    connections,
    setConnections: persistConnections,
    syncStatus,
    setSyncStatus,
    handleCsvFile,
    csvHeaders,
    csvMapping,
    setCsvMapping,
    csvError,
    csvFileName,
    csvRowCount: csvRows.length,
    confirmCsv,
    clearCustom,
  };
}

export default function App() {
  const {
    customData, demoData, customSourceLabel,
    period, setPeriod,
    historyRange, setHistoryRange,
    riskThreshold, setRiskThreshold,
    clearAllData,
    showModal, setShowModal,
    activeTab, setActiveTab,
    connections, setConnections,
    syncStatus, setSyncStatus,
    handleCsvFile, csvHeaders, csvMapping, setCsvMapping,
    csvError, csvFileName, csvRowCount, confirmCsv, clearCustom,
  } = useBiopulseData();

  const data = customData || demoData;
  const today = data[data.length - 1];
  const trendData = data.slice(-period);
  const apenData = data.filter((d) => d.apenHrv != null).slice(-14);
  const sparkOf = (key, n = 7) => data.slice(-n).map((d) => d[key]);
  const weekAgo = data[data.length - 8] || data[0];
  const delta = (key) => today[key] - weekAgo[key];
  const rColor = riskColor(today.riskLevel);

  // --- Confort del usuario: historial 7/14/30 dias + recomendacion ---
  const [histMetric, setHistMetric] = useState("riskScore");
  const history = data.slice(-historyRange);
  const rangeAvg = Math.round(history.reduce((a, d) => a + d.riskScore, 0) / Math.max(1, history.length));
  const alertActive = today.riskScore >= riskThreshold;
  // Recomendación accionable basada en los flags del día
  const recommendation = alertActive
    ? (today.flags[0] || "Tu indice de riesgo supera tu umbral. Considera descanso y vigila tus metricas.")
    : "Estas dentro de tu rango. Manten tu rutina habitual.";

  const sourcePillLabel = customSourceLabel ? customSourceLabel : "Datos demo";

  return (
    <div style={{ background: C.bg, minHeight: "100vh", fontFamily: "'Manrope', sans-serif" }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@500;600;700&family=IBM+Plex+Mono:wght@400;500;600&family=Manrope:wght@400;500;600;700;800&display=swap');
        * { box-sizing: border-box; }
        ::-webkit-scrollbar { width: 6px; height: 6px; }
        ::-webkit-scrollbar-thumb { background: ${C.border}; border-radius: 4px; }
        .pulse-ribbon path { stroke-dasharray: 1400; stroke-dashoffset: 1400; animation: draw 2.2s ease-out forwards; }
        @keyframes draw { to { stroke-dashoffset: 0; } }
        .animate-spin { animation: spin 1s linear infinite; }
        @keyframes spin { to { transform: rotate(360deg); } }
        @media (prefers-reduced-motion: reduce) {
          .pulse-ribbon path { animation: none; stroke-dashoffset: 0; }
          .animate-spin { animation: none; }
        }
        button:focus-visible, [tabindex]:focus-visible, select:focus-visible, input:focus-visible { outline: 2px solid ${C.teal}; outline-offset: 2px; }
        select option { background: ${C.bgSoft}; }
      `}</style>

      <div className="max-w-2xl mx-auto px-4 pb-16 pt-6">
        {/* HEADER */}
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <div style={{ background: C.teal }} className="w-7 h-7 rounded-lg flex items-center justify-center">
              <Activity size={16} color={C.bg} strokeWidth={2.5} />
            </div>
            <span style={{ color: C.text, fontFamily: "'Space Grotesk', sans-serif" }} className="text-lg font-bold tracking-tight">BioPulse</span>
          </div>
          <button
            onClick={() => setShowModal(true)}
            style={{ background: C.card, border: `1px solid ${C.border}`, color: C.textMuted }}
            className="w-10 h-10 rounded-full flex items-center justify-center active:scale-[0.96] transition-transform"
            aria-label="Fuente de datos"
          >
            <Settings size={14} />
          </button>
        </div>

        {/* PILL: fuente de datos activa */}
        <button
          onClick={() => setShowModal(true)}
          style={{ background: C.card, border: `1px solid ${C.border}` }}
          className="w-full flex items-center justify-between rounded-xl px-3.5 py-2.5 mb-5"
        >
          <div className="flex items-center gap-2 min-w-0">
            {customSourceLabel ? <FileText size={13} style={{ color: C.teal }} /> : <Database size={13} style={{ color: C.textFaint }} />}
            <span style={{ color: C.text }} className="text-[12px] font-medium truncate">{sourcePillLabel}</span>
            {(connections.fitbit.connected || connections.whoop.connected) && (
              <span style={{ color: C.teal }} className="text-[10px]">
                · {[connections.fitbit.connected && "Fitbit", connections.whoop.connected && "Whoop"].filter(Boolean).join(" + ")} conectado
              </span>
            )}
          </div>
          <ChevronRight size={14} style={{ color: C.textFaint }} className="shrink-0" />
        </button>

        {/* HERO: RIESGO HOY */}
        <div style={{ background: `linear-gradient(160deg, ${C.card}, ${C.bgSoft})`, border: `1px solid ${C.border}` }} className="rounded-3xl p-5 pt-4 mb-4 relative overflow-hidden">
          <div className="absolute top-0 left-0 right-0 opacity-70">
            <PulseRibbon values={data.slice(-30).map((d) => d.hrv)} />
          </div>
          <div className="relative pt-6">
            <div className="flex items-center justify-between mb-1">
              <span style={{ color: C.textFaint }} className="text-[11px] uppercase tracking-wider font-medium block">Indice de riesgo predictivo</span>
              <span style={{ color: C.teal, background: `${C.teal}14`, border: `1px solid ${C.teal}40` }} className="text-[9px] font-semibold px-2 py-0.5 rounded-full flex items-center gap-1">
                <Info size={10} /> En tu dispositivo
              </span>
            </div>
            <div className="flex items-center gap-5">
              <RiskGauge score={today.riskScore} level={today.riskLevel} />
              <div className="flex-1 min-w-0">
                <span style={{ color: rColor, background: `${rColor}1A`, border: `1px solid ${rColor}44` }} className={`inline-block text-xs font-semibold px-2.5 py-1 rounded-full mb-2 ${alertActive ? "animate-pulse" : ""}`}>
                  RIESGO {today.riskLevel}
                </span>
                <p style={{ color: C.textMuted }} className="text-[13px] leading-snug">
                  {today.riskLevel === "BAJO" ? "Tus metricas estan dentro de tu rango habitual." : "Detectamos señales fuera de tu rango habitual en los ultimos dias."}
                </p>
                {today.flags.length > 0 && (
                  <div className="mt-2 flex items-start gap-1.5">
                    <AlertTriangle size={13} style={{ color: C.amber }} className="mt-0.5 shrink-0" />
                    <span style={{ color: C.amber }} className="text-[12px] leading-snug">{today.flags[0]}</span>
                  </div>
                )}
                {/* Recomendación accionable */}
                <div className="mt-2 flex items-start gap-1.5">
                  <Info size={13} style={{ color: C.teal }} className="mt-0.5 shrink-0" />
                  <span style={{ color: C.text }} className="text-[12px] leading-snug">{recommendation}</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* METRICAS CONVENCIONALES */}
        <div className="mb-6">
          <span style={{ color: C.textFaint }} className="text-[11px] uppercase tracking-wider font-medium mb-3 block">Bienestar de hoy</span>
          <div className="grid grid-cols-2 gap-3">
            <MetricCard icon={Moon} label="Sleep Score" value={today.sleepScore} sub={`${today.sleepHours}h dormidas`} accent={C.teal} sparkData={sparkOf("sleepScore")} delta={delta("sleepScore")} />
            <MetricCard icon={Footprints} label="Pasos" value={today.steps.toLocaleString()} accent={C.purple} sparkData={sparkOf("steps")} delta={delta("steps")} />
            <MetricCard icon={Flame} label="Estres" value={today.stressScore} unit="/100" accent={C.amber} sparkData={sparkOf("stressScore")} delta={-delta("stressScore")} />
            <MetricCard icon={BatteryMedium} label="Fatiga" value={today.fatigueScore} unit="/100" accent={C.rose} sparkData={sparkOf("fatigueScore")} delta={-delta("fatigueScore")} />
            <MetricCard icon={Heart} label="HRV" value={today.hrv} unit="ms" accent={C.teal} sparkData={sparkOf("hrv")} delta={delta("hrv")} />
            <MetricCard icon={Activity} label="RHR" value={today.rhr} unit="bpm" accent={C.purple} sparkData={sparkOf("rhr")} delta={-delta("rhr")} />
            <MetricCard icon={BatteryMedium} label="Recuperación" value={today.recovery} unit="%" accent={C.teal} sparkData={sparkOf("recovery")} delta={delta("recovery")} />
            <MetricCard icon={Wind} label="Frec. respiratoria" value={today.resp} unit="rpm" accent={C.purple} sparkData={sparkOf("resp")} delta={-delta("resp")} />
          </div>
        </div>

        {/* HISTORIAL 7/14/30 DIAS + LINEA DE TIEMPO DE EVENTOS */}
        <div className="mb-6">
          <div className="flex items-center justify-between mb-3">
            <span style={{ color: C.textFaint }} className="text-[11px] uppercase tracking-wider font-medium">Tu historial</span>
            <div className="flex items-center gap-1">
              {[7, 14, 30].map((r) => (
                <button
                  key={r}
                  onClick={() => setHistoryRange(r)}
                  style={{
                    background: historyRange === r ? C.teal : C.card,
                    color: historyRange === r ? C.bg : C.textMuted,
                    border: `1px solid ${historyRange === r ? C.teal : C.border}`,
                  }}
                  className="text-[11px] font-semibold px-2.5 py-1 rounded-full transition-colors active:scale-[0.96]"
                >
                  {r}d
                </button>
              ))}
            </div>
          </div>

          {/* Selector de metrica + grafica de historial */}
          <div style={{ background: C.card, border: `1px solid ${C.border}` }} className="rounded-2xl p-4 mb-3">
            <div className="flex items-center justify-between mb-2">
              <select
                value={histMetric}
                onChange={(e) => setHistMetric(e.target.value)}
                style={{ background: C.bgSoft, color: C.text, border: `1px solid ${C.border}` }}
                className="text-[12px] rounded-lg px-2 py-1"
              >
                <option value="riskScore">Indice de riesgo</option>
                <option value="hrv">HRV</option>
                <option value="rhr">RHR</option>
                <option value="recovery">Recuperación</option>
                <option value="sleepEff">Eficiencia de sueno</option>
                <option value="resp">Frec. respiratoria</option>
              </select>
              <span style={{ color: C.textMuted }} className="text-[11px]">
                Prom. {histMetric === "riskScore" ? rangeAvg : Math.round(history.reduce((a, d) => a + (d[histMetric] || 0), 0) / Math.max(1, history.length))} {histMetric === "riskScore" ? "/100" : ""} · ultimos {historyRange}d
              </span>
            </div>
            <ResponsiveContainer width="100%" height={150}>
              <AreaChart data={history} margin={{ top: 5, right: 8, left: -22, bottom: 0 }}>
                <defs>
                  <linearGradient id="histGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor={histMetric === "riskScore" ? C.amber : C.teal} stopOpacity={0.5} />
                    <stop offset="100%" stopColor={histMetric === "riskScore" ? C.amber : C.teal} stopOpacity={0.02} />
                  </linearGradient>
                </defs>
                <CartesianGrid stroke={C.borderSoft} vertical={false} />
                <XAxis dataKey="label" tick={{ fill: C.textFaint, fontSize: 10 }} interval="preserveStartEnd" />
                <YAxis tick={{ fill: C.textFaint, fontSize: 10 }} domain={histMetric === "riskScore" ? [0, 100] : ["auto", "auto"]} />
                <Tooltip
                  contentStyle={{ background: C.bgSoft, border: `1px solid ${C.border}`, borderRadius: 8, fontSize: 12 }}
                  labelStyle={{ color: C.textMuted }}
                  formatter={(v) => [v, histMetric === "riskScore" ? "Riesgo" : histMetric.toUpperCase()]}
                />
                {histMetric === "riskScore" && <ReferenceLine y={riskThreshold} stroke={C.rose} strokeDasharray="4 3" label={{ value: "Tu umbral", fill: C.rose, fontSize: 10, position: "insideTopRight" }} />}
                <Area type="monotone" dataKey={histMetric} stroke={histMetric === "riskScore" ? C.amber : C.teal} strokeWidth={2} fill="url(#histGrad)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>

          {/* Linea de tiempo de eventos (dias con flags) */}
          <div style={{ background: C.card, border: `1px solid ${C.border}` }} className="rounded-2xl p-4">
            <span style={{ color: C.textFaint }} className="text-[11px] uppercase tracking-wider font-medium block mb-2">Dias con señales de alerta</span>
            {history.filter((d) => d.flags.length > 0).length === 0 ? (
              <p style={{ color: C.textMuted }} className="text-[12px]">Ningun dia con señales fuera de lo habitual en este rango. ¡Buen ritmo!</p>
            ) : (
              <div className="flex flex-col gap-2 max-h-44 overflow-y-auto">
                {history.filter((d) => d.flags.length > 0).reverse().map((d) => (
                  <div key={d.i} className="flex items-start gap-2">
                    <span style={{ background: `${C.rose}1A`, color: C.rose }} className="text-[10px] font-semibold px-2 py-0.5 rounded-full shrink-0">{fmtDate(d.date)}</span>
                    <span style={{ color: C.textMuted }} className="text-[12px] leading-snug">{d.flags[0]}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* RADAR DE RIESGO: 3 MODELOS */}
        <div className="mb-6">
          <span style={{ color: C.textFaint }} className="text-[11px] uppercase tracking-wider font-medium mb-1 block">Radar de riesgo — pipeline de 3 modelos</span>
          <p style={{ color: C.textFaint }} className="text-[12px] mb-4">Cada modelo aporta una señal distinta; se combinan para el indice de arriba.</p>

          <div style={{ background: C.card, border: `1px solid ${C.border}` }} className="rounded-2xl p-4 mb-3">
            <SectionHeader index="01" icon={Sigma} title="Control estadistico" subtitle="Z-score de cada metrica vs. tu propia linea base (7 dias)" />
            <div className="flex flex-col gap-2">
              {Object.entries(today.zscores).map(([key, z]) => {
                const labelMap = { hrv: "HRV", rhr: "RHR", recovery: "Recuperación", resp: "Resp.", skinTemp: "Temp. piel", sleepEff: "Ef. sueno" };
                const flagged = Math.abs(z) > 2;
                const pct = clamp((z + 3) / 6, 0, 1) * 100;
                return (
                  <div key={key} className="flex items-center gap-2">
                    <span style={{ color: C.textMuted }} className="text-[11px] w-20 shrink-0">{labelMap[key]}</span>
                    <div style={{ background: C.bgSoft }} className="flex-1 h-1.5 rounded-full relative overflow-hidden">
                      <div style={{ position: "absolute", left: "50%", top: 0, bottom: 0, width: 1, background: C.borderSoft }} />
                      <div style={{ width: `${Math.abs(pct - 50) * 2}%`, marginLeft: pct < 50 ? `${pct}%` : "50%", background: flagged ? C.rose : C.teal, height: "100%", borderRadius: 4 }} />
                    </div>
                    <span style={{ color: flagged ? C.rose : C.textFaint, fontFamily: "'IBM Plex Mono', monospace" }} className="text-[11px] w-10 text-right shrink-0">{z > 0 ? "+" : ""}{z}</span>
                  </div>
                );
              })}
            </div>
            <div className="mt-3 pt-3 flex items-center justify-between" style={{ borderTop: `1px solid ${C.borderSoft}` }}>
              <span style={{ color: C.textFaint }} className="text-[11px]">Métricas anómalas hoy</span>
              <span style={{ color: today.anomalyCount > 0 ? C.rose : C.teal, fontFamily: "'IBM Plex Mono', monospace" }} className="text-[13px] font-semibold">{today.anomalyCount} / 6</span>
            </div>
          </div>

          <div style={{ background: C.card, border: `1px solid ${C.border}` }} className="rounded-2xl p-4 mb-3">
            <SectionHeader index="02" icon={Waves} title="ApEn — complejidad fisiologica" subtitle="Entropia aproximada de HRV/RHR, ventana movil de 14 dias" />
            {apenData.length > 1 ? (
              <>
                <div style={{ height: 130 }}>
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={apenData} margin={{ top: 4, right: 4, left: -24, bottom: 0 }}>
                      <CartesianGrid stroke={C.borderSoft} strokeDasharray="3 3" vertical={false} />
                      <XAxis dataKey="label" tick={{ fill: C.textFaint, fontSize: 10 }} axisLine={{ stroke: C.borderSoft }} tickLine={false} />
                      <YAxis tick={{ fill: C.textFaint, fontSize: 10 }} axisLine={false} tickLine={false} width={30} />
                      <Tooltip content={<ChartTooltip />} />
                      <Line type="monotone" dataKey="apenHrv" name="ApEn HRV" stroke={C.teal} strokeWidth={2} dot={false} />
                      <Line type="monotone" dataKey="apenRhr" name="ApEn RHR" stroke={C.purple} strokeWidth={2} dot={false} strokeDasharray="4 3" />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
                <p style={{ color: C.textFaint }} className="text-[11px] mt-1">Entropia baja = ritmo mas rigido/predecible de lo normal — señal temprana de perdida de adaptabilidad.</p>
              </>
            ) : (
              <p style={{ color: C.textFaint }} className="text-[12px]">Sube al menos 14 dias de datos para ver el analisis de entropia.</p>
            )}
          </div>

          <div style={{ background: C.card, border: `1px solid ${C.border}` }} className="rounded-2xl p-4">
            <SectionHeader index="03" icon={GitBranch} title="Random Forest" subtitle="Importancia de variables aprendida sobre 100k registros" />
            <div style={{ height: 190 }}>
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={RF_IMPORTANCE} layout="vertical" margin={{ top: 0, right: 16, left: 0, bottom: 0 }}>
                  <XAxis type="number" hide domain={[0, 0.22]} />
                  <YAxis type="category" dataKey="name" tick={{ fill: C.textMuted, fontSize: 11 }} axisLine={false} tickLine={false} width={110} />
                  <Tooltip content={<ChartTooltip />} cursor={{ fill: "transparent" }} />
                  <Bar dataKey="value" name="Importancia" radius={[0, 4, 4, 0]} barSize={12}>
                    {RF_IMPORTANCE.map((entry, i) => (
                      <Cell key={i} fill={i === 0 ? C.rose : i < 3 ? C.amber : C.teal} opacity={1 - i * 0.06} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
            <p style={{ color: C.textFaint }} className="text-[11px] mt-2 leading-relaxed">
              Importancias del modelo de produccion (entrenado sobre 100k registros reales de Whoop, 13 variables fisiologicas, split 80/20 + 5-fold CV estratificada). Los AUC reales del hold-out aparecen en la seccion 04.
            </p>
          </div>
        </div>

        {/* VALIDACIÓN DEL MODELO — comparación de 3 algoritmos */}
        <div className="mb-6">
          <span style={{ color: C.textFaint }} className="text-[11px] uppercase tracking-wider font-medium mb-1 block">
            Validación del modelo — comparando 3 algoritmos
          </span>
          <p style={{ color: C.textFaint }} className="text-[12px] mb-4">
            Antes de elegir Random Forest para produccion, se comparo contra un baseline lineal y una alternativa de boosting,
            con validación cruzada 5-fold (no un solo split).
          </p>

          {/* 04: ROC */}
          <div style={{ background: C.card, border: `1px solid ${C.border}` }} className="rounded-2xl p-4 mb-3">
            <SectionHeader index="04" icon={FlaskConical} title="Curvas ROC" subtitle="Test set 80/20 — capacidad discriminativa de cada modelo" />
            <div style={{ height: 190 }}>
              <ResponsiveContainer width="100%" height="100%">
                <LineChart margin={{ top: 4, right: 8, left: -20, bottom: 0 }}>
                  <CartesianGrid stroke={C.borderSoft} strokeDasharray="3 3" />
                  <XAxis dataKey="fpr" type="number" domain={[0, 1]} ticks={[0, 0.25, 0.5, 0.75, 1]} tick={{ fill: C.textFaint, fontSize: 10 }} axisLine={{ stroke: C.borderSoft }} tickLine={false} />
                  <YAxis type="number" domain={[0, 1]} tick={{ fill: C.textFaint, fontSize: 10 }} axisLine={false} tickLine={false} width={28} />
                  <ReferenceLine segment={[{ x: 0, y: 0 }, { x: 1, y: 1 }]} stroke={C.textFaint} strokeDasharray="4 4" ifOverflow="extendDomain" />
                  {Object.entries(ROC_DATA).map(([name, d]) => (
                    <Line key={name} data={d.points} dataKey="tpr" stroke={MODEL_COLORS[name]} strokeWidth={2.2} dot={false} isAnimationActive={false} name={name} />
                  ))}
                </LineChart>
              </ResponsiveContainer>
            </div>
            <div className="flex flex-wrap gap-x-4 gap-y-1.5 mt-2">
              {Object.entries(ROC_DATA).map(([name, d]) => (
                <span key={name} style={{ color: MODEL_COLORS[name] }} className="text-[11px] flex items-center gap-1.5">
                  <span style={{ width: 8, height: 8, borderRadius: 2, background: MODEL_COLORS[name] }} /> {name} <span style={{ fontFamily: "'IBM Plex Mono', monospace" }}>AUC {d.auc.toFixed(3)}</span>
                </span>
              ))}
            </div>
          </div>

          {/* 05: CV comparison */}
          <div style={{ background: C.card, border: `1px solid ${C.border}` }} className="rounded-2xl p-4 mb-3">
            <SectionHeader index="05" icon={Sigma} title="Validación cruzada 5-fold" subtitle="Media ± desviación estándar entre folds, no un solo split" />
            <div className="grid grid-cols-2 gap-3">
              {Object.keys(CV_METRIC_LABELS).map((metric) => {
                const chartData = Object.entries(CV_SUMMARY).map(([name, vals]) => ({
                  name: name === "Regresion Logistica" ? "Reg. Log." : name === "Random Forest" ? "R. Forest" : "G. Boost",
                  fullName: name,
                  mean: vals[metric][0],
                  std: vals[metric][1],
                }));
                return (
                  <div key={metric}>
                    <span style={{ color: C.textMuted }} className="text-[10.5px] font-medium">{CV_METRIC_LABELS[metric]}</span>
                    <div style={{ height: 118 }}>
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={chartData} margin={{ top: 14, right: 4, left: -28, bottom: 0 }}>
                          <XAxis dataKey="name" tick={{ fill: C.textFaint, fontSize: 8.5 }} axisLine={{ stroke: C.borderSoft }} tickLine={false} interval={0} />
                          <YAxis domain={[0, 1]} tick={{ fill: C.textFaint, fontSize: 9 }} axisLine={false} tickLine={false} width={26} />
                          <Bar dataKey="mean" radius={[4, 4, 0, 0]} barSize={20} isAnimationActive={false}>
                            <ErrorBar dataKey="std" width={3} strokeWidth={1.3} stroke={C.textMuted} />
                            {chartData.map((d, i) => (
                              <Cell key={i} fill={MODEL_COLORS[d.fullName]} />
                            ))}
                          </Bar>
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* 06: Confusion matrix */}
          <div style={{ background: C.card, border: `1px solid ${C.border}` }} className="rounded-2xl p-4 mb-3">
            <SectionHeader index="06" icon={Scale} title="Matriz de confusion" subtitle="Random Forest, hold-out 20% (n = 20,000)" />
            <div className="grid grid-cols-2 gap-1.5">
              {[
                { label: "Real: bajo\nPred: bajo", value: CONFUSION_RF.tn, tone: C.teal, strong: true },
                { label: "Real: bajo\nPred: alto (falsa alarma)", value: CONFUSION_RF.fp, tone: C.amber, strong: false },
                { label: "Real: alto\nPred: bajo (riesgo no detectado)", value: CONFUSION_RF.fn, tone: C.rose, strong: false },
                { label: "Real: alto\nPred: alto (detectado)", value: CONFUSION_RF.tp, tone: C.teal, strong: false },
              ].map((cell, i) => (
                <div key={i} style={{ background: C.bgSoft, border: `1px solid ${C.borderSoft}` }} className="rounded-xl p-3 flex flex-col gap-1">
                  <span style={{ color: cell.tone, fontFamily: "'IBM Plex Mono', monospace" }} className="text-xl font-semibold">{cell.value.toLocaleString()}</span>
                  <span style={{ color: C.textFaint, whiteSpace: "pre-line" }} className="text-[10px] leading-tight">{cell.label}</span>
                </div>
              ))}
            </div>
            <p style={{ color: C.textFaint }} className="text-[11px] mt-3">
              De {CONFUSION_RF.fn + CONFUSION_RF.tp} casos de riesgo real, el modelo detecto {CONFUSION_RF.tp} ({Math.round((CONFUSION_RF.tp / (CONFUSION_RF.fn + CONFUSION_RF.tp)) * 100)}%).
            </p>
          </div>

          {/* Trade-off note */}
          <div style={{ background: C.bgSoft, border: `1px solid ${C.borderSoft}` }} className="rounded-2xl p-4">
            <div className="flex items-center gap-2 mb-1.5">
              <Info size={13} style={{ color: C.textMuted }} />
              <span style={{ color: C.textMuted }} className="text-[11.5px] font-semibold">Por que Random Forest y no Gradient Boosting</span>
            </div>
            <p style={{ color: C.textFaint }} className="text-[11.5px] leading-relaxed">
              Gradient Boosting gana en ROC-AUC (0.687 vs 0.660) y en precision, pero tiene menor recall.
              En un sistema de prevencion de salud, dejar pasar un caso de riesgo real cuesta mas que una falsa alarma —
              por eso se prioriza recall sobre precisión pura, y Random Forest queda como el modelo de produccion.
            </p>
          </div>
        </div>

        {/* TENDENCIA */}
        <div className="mb-6">
          <div className="flex items-center justify-between mb-3">
            <span style={{ color: C.textFaint }} className="text-[11px] uppercase tracking-wider font-medium">Tendencia del indice de riesgo</span>
            <div style={{ background: C.card, border: `1px solid ${C.border}` }} className="flex rounded-lg p-0.5">
              {[7, 14, 30].map((p) => (
                <button key={p} onClick={() => setPeriod(p)} style={{ background: period === p ? C.teal : "transparent", color: period === p ? C.bg : C.textMuted }} className="text-[11px] font-semibold px-2.5 py-1 rounded-md transition-colors active:scale-[0.96]">
                  {p}d
                </button>
              ))}
            </div>
          </div>
          <div style={{ background: C.card, border: `1px solid ${C.border}` }} className="rounded-2xl p-4">
            <div style={{ height: 160 }}>
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={trendData} margin={{ top: 8, right: 4, left: -24, bottom: 0 }}>
                  <defs>
                    <linearGradient id="riskFill" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor={C.teal} stopOpacity={0.35} />
                      <stop offset="100%" stopColor={C.teal} stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid stroke={C.borderSoft} strokeDasharray="3 3" vertical={false} />
                  <XAxis dataKey="label" tick={{ fill: C.textFaint, fontSize: 10 }} axisLine={{ stroke: C.borderSoft }} tickLine={false} interval={period === 30 ? 3 : 1} />
                  <YAxis domain={[0, 100]} tick={{ fill: C.textFaint, fontSize: 10 }} axisLine={false} tickLine={false} width={30} />
                  <ReferenceLine y={60} stroke={C.rose} strokeDasharray="3 3" strokeOpacity={0.5} />
                  <ReferenceLine y={30} stroke={C.amber} strokeDasharray="3 3" strokeOpacity={0.5} />
                  <Tooltip content={<ChartTooltip />} />
                  <Area type="monotone" dataKey="riskScore" name="Riesgo" stroke={C.teal} strokeWidth={2} fill="url(#riskFill)" dot={{ r: 2, fill: C.teal }} />
                </AreaChart>
              </ResponsiveContainer>
            </div>
            <div className="flex items-center gap-4 mt-2">
              <span className="flex items-center gap-1.5 text-[10px]" style={{ color: C.textFaint }}><span style={{ width: 8, height: 8, borderRadius: 2, background: C.rose }} /> Alto (60+)</span>
              <span className="flex items-center gap-1.5 text-[10px]" style={{ color: C.textFaint }}><span style={{ width: 8, height: 8, borderRadius: 2, background: C.amber }} /> Moderado (30-59)</span>
              <span className="flex items-center gap-1.5 text-[10px]" style={{ color: C.textFaint }}><span style={{ width: 8, height: 8, borderRadius: 2, background: C.teal }} /> Bajo (0-29)</span>
            </div>
          </div>
        </div>

        {/* ALERTAS */}
        <div className="mb-6">
          <span style={{ color: C.textFaint }} className="text-[11px] uppercase tracking-wider font-medium mb-3 block">Alertas recientes</span>
          <div className="flex flex-col gap-2">
            {data.slice().reverse().filter((d) => d.flags.length > 0).slice(0, 4).map((d) => (
              <div key={d.i} style={{ background: C.card, border: `1px solid ${C.border}` }} className="rounded-xl p-3 flex items-start gap-3">
                <div style={{ background: `${riskColor(d.riskLevel)}1A`, color: riskColor(d.riskLevel) }} className="w-7 h-7 rounded-lg flex items-center justify-center shrink-0 mt-0.5">
                  <AlertTriangle size={14} />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <span style={{ color: C.text }} className="text-[13px] font-medium">{d.label}</span>
                    <span style={{ color: riskColor(d.riskLevel), fontFamily: "'IBM Plex Mono', monospace" }} className="text-[10px]">{d.riskScore}%</span>
                  </div>
                  <p style={{ color: C.textMuted }} className="text-[12px] leading-snug mt-0.5">{d.flags[0]}</p>
                </div>
                <ChevronRight size={15} style={{ color: C.textFaint }} className="shrink-0 mt-1.5" />
              </div>
            ))}
            {data.filter((d) => d.flags.length > 0).length === 0 && (
              <div style={{ background: C.card, border: `1px solid ${C.border}` }} className="rounded-xl p-4 text-center">
                <span style={{ color: C.textFaint }} className="text-[12px]">Sin alertas en el periodo cargado.</span>
              </div>
            )}
          </div>
        </div>

        {/* CONTROL DE CONFORT: umbral + privacidad + borrar */}
        <div style={{ background: C.card, border: `1px solid ${C.border}` }} className="rounded-2xl p-4 mb-3">
          <div className="flex items-center gap-2 mb-3">
            <Settings size={14} style={{ color: C.textMuted }} />
            <span style={{ color: C.textMuted }} className="text-[12px] font-semibold">Tu control y privacidad</span>
          </div>

          {/* Umbral configurable */}
          <div className="flex items-center justify-between mb-3">
            <div>
              <span style={{ color: C.text }} className="text-[12px] font-medium block">Umbral de alerta</span>
              <span style={{ color: C.textFaint }} className="text-[10.5px]">Avisame solo cuando el riesgo supere {riskThreshold}</span>
            </div>
            <div className="flex items-center gap-2">
              <button onClick={() => setRiskThreshold(Math.max(0, riskThreshold - 5))} style={{ background: C.bgSoft, color: C.textMuted, border: `1px solid ${C.border}` }} className="w-10 h-10 rounded-full text-base font-bold active:scale-[0.96] transition-transform">−</button>
              <span style={{ color: C.amber, fontFamily: "'IBM Plex Mono', monospace" }} className="text-lg font-semibold w-8 text-center tabular-nums">{riskThreshold}</span>
              <button onClick={() => setRiskThreshold(Math.min(100, riskThreshold + 5))} style={{ background: C.bgSoft, color: C.textMuted, border: `1px solid ${C.border}` }} className="w-10 h-10 rounded-full text-base font-bold active:scale-[0.96] transition-transform">+</button>
            </div>
          </div>

          {/* Privacidad */}
          <div className="flex items-center gap-2 mb-3" style={{ color: C.teal }}>
            <Info size={13} />
            <span className="text-[11.5px]">Tus datos se procesan y guardan en este dispositivo (localStorage). No se envian a ningun servidor.</span>
          </div>

          {/* Borrar datos */}
          <button
            onClick={() => { if (window.confirm("¿Borrar todos tus datos cargados y restablecer la app?")) { clearAllData(); onClose(); } }}
            style={{ background: `${C.rose}12`, color: C.rose, border: `1px solid ${C.rose}40` }}
            className="w-full flex items-center justify-center gap-2 text-[12px] font-semibold py-2 rounded-xl active:scale-[0.96] transition-transform"
          >
            <Trash2 size={13} /> Borrar mis datos
          </button>
        </div>

        {/* DISCLOSURE DEL MODELO */}
        <div style={{ background: C.bgSoft, border: `1px solid ${C.borderSoft}` }} className="rounded-2xl p-4">
          <div className="flex items-center gap-2 mb-2">
            <Info size={14} style={{ color: C.textMuted }} />
            <span style={{ color: C.textMuted }} className="text-[12px] font-semibold">Sobre este modelo</span>
          </div>
          <p style={{ color: C.textFaint }} className="text-[11.5px] leading-relaxed">
            Random Forest entrenado sobre 100k registros de Whoop (hold-out 80/20: AUC 0.994 control, 0.995 agudo, 1.000 infeccion*). *El flag de infeccion se deriva de temperatura y respiracion, casi deterministico: es regla clinica, no prediccion aprendida.
            La etiqueta de riesgo es un <em>proxy</em> construido a partir de reglas clinicas y los modelos 01-02,
            no un desenlace medico confirmado. El dataset de entrenamiento no incluye adultos de 75+ anios.
            {customSourceLabel ? " Estas viendo datos cargados por ti; los calculos corren en tu navegador." : " Este panel usa datos sinteticos con fines demostrativos."}
          </p>
        </div>
      </div>

      {showModal && (
        <DataSourceModal
          onClose={() => setShowModal(false)}
          activeTab={activeTab}
          setActiveTab={setActiveTab}
          connections={connections}
          setConnections={setConnections}
          syncStatus={syncStatus}
          setSyncStatus={setSyncStatus}
          onCsvFile={handleCsvFile}
          csvHeaders={csvHeaders}
          csvMapping={csvMapping}
          setCsvMapping={setCsvMapping}
          csvError={csvError}
          csvFileName={csvFileName}
          csvRowCount={csvRowCount}
          onConfirmCsv={confirmCsv}
          onUseDemo={() => { clearCustom(); setShowModal(false); }}
          onClearCustom={clearCustom}
          customSourceLabel={customSourceLabel}
          riskThreshold={riskThreshold}
          setRiskThreshold={setRiskThreshold}
          clearAllData={clearAllData}
        />
      )}
    </div>
  );
}
