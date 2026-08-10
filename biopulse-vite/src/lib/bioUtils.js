// ============================================================
// BIO UTILS — helpers numericos y pipeline compartido.
// Extraido de App.jsx para reutilizar en toda la app (tabs).
// ============================================================
export function mulberry32(seed) {
  return function () {
    seed |= 0;
    seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
export function gaussian(rand, mean, std) {
  const u1 = Math.max(rand(), 1e-6);
  const u2 = rand();
  const z = Math.sqrt(-2 * Math.log(u1)) * Math.cos(2 * Math.PI * u2);
  return mean + z * std;
}
export const clamp = (v, lo, hi) => Math.min(hi, Math.max(lo, v));

export function approximateEntropy(series, m = 2, rFactor = 0.2) {
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

// ---- Datos demo sinteticos (mismo seed que antes, reproducibles) ----
export function generateSyntheticRawDays() {
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

// ---- Modelo de Sleep Score (prediccion desde metricas reales de la noche) ----
// No se inventan datos: sueño profundo y RHR-en-sueño se INFEREN a partir
// de las metricas reales que ya existen (hrvDev, rhrDev, recovery, sleepEff,
// wakeUps, rhr). Igual que sleepScore = 0.5*sleepEff + 0.5*sleepPerf ya existia.
// Todas las componentes se normalizan 0..100 y se ponderan.

// Fraccion de sueño profundo (0..1) inferida desde signos de buena recuperacion.
// Biologicamente: mas HRV, menos RHR, mas recuperacion, mas eficiencia, menos
// despertadas => mas sueño profundo. Se acota a un rango fisiologico 0.10..0.30.
export function inferDeepSleepFrac(night) {
  const hrvBonus = clamp((night.hrvDev || 0) / 12, -1, 1);      // HRV arriba del baseline
  const rhrBonus = clamp(-(night.rhrDev || 0) / 8, -1, 1);       // RHR abajo del baseline
  const recBonus = clamp((night.recovery - 66) / 30, -1, 1);      // recuperacion alta
  const effBonus = clamp((night.sleepEff - 86) / 13, -1, 1);     // eficiencia alta
  const wakePenalty = clamp(-(night.wakeUps || 0) / 4, -1, 0);   // despertadas bajan profundo
  const s = 0.20 + 0.06 * (hrvBonus + rhrBonus + recBonus + effBonus) / 4 + 0.04 * wakePenalty;
  return clamp(s, 0.10, 0.30);
}

// RHR durante el sueño (bpm) inferido: en descanso baja ~5-10 del RHR diurno,
// modulado por recuperacion/HRV (mejor recuperacion => mas caida nocturna).
export function inferSleepRhr(night) {
  const drop = 5 + 5 * clamp((night.recovery - 50) / 50, 0, 1) + 2 * clamp((night.hrvDev || 0) / 12, -1, 1);
  return Math.round(clamp(night.rhr - drop, 38, night.rhr));
}

// Sleep Score 0..100 desde las metricas reales de la noche.
export function computeSleepScore(night) {
  const hours = night.sleepHours || 0;
  // Horas: optimo 7-9h => 100; decae fuera de rango.
  const hc = clamp(100 - Math.abs(hours - 8) * 22, 0, 100);
  // Eficiencia: ya es % 50-99.
  const ec = clamp(night.sleepEff, 0, 100);
  // Despertadas: 0-1 => 100, cae con mas.
  const wc = clamp(100 - (night.wakeUps || 0) * 22, 0, 100);
  // Sueño profundo: fraccion 0.10..0.30 => mapea a 0..100 (optimo ~0.22+).
  const dsFrac = inferDeepSleepFrac(night);
  const dc = clamp(((dsFrac - 0.10) / 0.20) * 100, 0, 100);
  // RHR en sueño: menor = mejor. Rango tipico 40-60 => normalizado.
  const sr = inferSleepRhr(night);
  const sc = clamp(100 - (sr - 42) * 3, 0, 100);
  // Recuperacion y HRV como refuerzo.
  const rc = clamp(night.recovery, 0, 100);
  const hc2 = clamp(50 + (night.hrvDev || 0) * 2.5, 0, 100);

  const score = Math.round(
    0.28 * hc + 0.20 * ec + 0.15 * wc + 0.15 * dc + 0.10 * sc + 0.07 * rc + 0.05 * hc2
  );
  const level = score >= 80 ? "BUENO" : score >= 60 ? "MEDIO" : "BAJO";
  return { score: clamp(score, 0, 100), level, deepSleepFrac: dsFrac, sleepRhr: sr };
}

// ---- Pipeline: rawDays -> dias enriquecidos con scores y flags ----
export function computePipeline(rawDaysInput) {
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
      ...d, i, fromEnd,
      label: fromEnd === 0 ? "Hoy" : `${String(d.date.getDate()).padStart(2, "0")} ${["ene","feb","mar","abr","may","jun","jul","ago","sep","oct","nov","dic"][d.date.getMonth()]}`,
      hrvDev: +hrvDev.toFixed(1), rhrDev: +rhrDev.toFixed(1),
      sleepScore, stressScore, fatigueScore,
    };
  });

  const RISK_METRICS = [
    { key: "hrv", highBad: false }, { key: "rhr", highBad: true },
    { key: "recovery", highBad: false }, { key: "resp", highBad: true },
    { key: "skinTemp", highBad: true }, { key: "sleepEff", highBad: false },
  ];
  for (let i = 0; i < N; i++) {
    const win = raw.slice(Math.max(0, i - 6), i + 1);
    let anomalyCount = 0;
    const zscores = {};
    RISK_METRICS.forEach(({ key, highBad }) => {
      if (win.length < 3) { zscores[key] = 0; return; }
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

  const apenHrvSeries = [], apenRhrSeries = [];
  for (let i = 0; i < N; i++) {
    if (i >= 13) {
      const winHrv = raw.slice(i - 13, i + 1).map((d) => d.hrv);
      const winRhr = raw.slice(i - 13, i + 1).map((d) => d.rhr);
      raw[i].apenHrv = approximateEntropy(winHrv);
      raw[i].apenRhr = approximateEntropy(winRhr);
      if (raw[i].apenHrv != null) apenHrvSeries.push(raw[i].apenHrv);
      if (raw[i].apenRhr != null) apenRhrSeries.push(raw[i].apenRhr);
    } else { raw[i].apenHrv = null; raw[i].apenRhr = null; }
  }
  const avgApenHrv = apenHrvSeries.length ? apenHrvSeries.reduce((a, b) => a + b, 0) / apenHrvSeries.length : null;
  const avgApenRhr = apenRhrSeries.length ? apenRhrSeries.reduce((a, b) => a + b, 0) / apenRhrSeries.length : null;
  for (let i = 0; i < N; i++) {
    if (raw[i].apenHrv == null || !avgApenHrv) { raw[i].apenContribution = 0; continue; }
    const dropHrv = clamp((avgApenHrv - raw[i].apenHrv) / avgApenHrv, 0, 1);
    const dropRhr = avgApenRhr ? clamp((avgApenRhr - raw[i].apenRhr) / avgApenRhr, 0, 1) : 0;
    raw[i].apenContribution = ((dropHrv + dropRhr) / 2) * 25;
  }

  for (let i = 0; i < N; i++) {
    const d = raw[i];
    const acute = d.recovery < 40 && d.hrvDev < -5 && d.rhrDev > 3;
    const fever = d.skinTemp > 1.0 && d.resp > 16;
    d.acuteFlag = acute; d.feverFlag = fever;
    d.acuteContribution = acute ? 25 : 0;
    d.feverContribution = fever ? 25 : 0;
    d.riskScore = Math.round(d.controlContribution + d.apenContribution + d.acuteContribution + d.feverContribution);
    d.riskLevel = d.riskScore >= 60 ? "ALTO" : d.riskScore >= 30 ? "MODERADO" : "BAJO";

    // BioScore: indice de BIENESTAR/RENDIMIENTO (mayor = mejor), derivado de
    // metricas de wearable. Es distinto al Risk Score (que mide anomalias/fatiga).
    const hrvComp = clamp(50 + (d.hrvDev || 0) * 2.5, 0, 100);
    const rhrComp = clamp(100 - (d.rhr - (rhrBaseline - 10)) * 3, 0, 100);
    const recComp = clamp(d.recovery, 0, 100);
    const sleepComp = clamp((d.sleepEff * 0.5) + ((d.sleepHours / 9) * 100 * 0.5), 0, 100);
    const bio = Math.round(0.30 * hrvComp + 0.20 * rhrComp + 0.25 * recComp + 0.25 * sleepComp);
    d.bioScore = clamp(bio, 0, 100);
    d.bioLevel = d.bioScore >= 80 ? "BUENO" : d.bioScore >= 60 ? "MEDIO" : "BAJO";
    const flags = [];
    if (acute) flags.push("Patron de fatiga aguda: recuperación + HRV bajos, RHR elevado");
    if (fever) flags.push("Posible proceso infeccioso: temperatura y frec. respiratoria elevadas");
    if (d.anomalyCount >= 2) flags.push(`${d.anomalyCount} metricas fuera de tu rango habitual (control estadistico)`);
    if (d.apenContribution >= 15) flags.push("Perdida de variabilidad fisiologica (complejidad ApEn baja)");
    d.flags = flags;
  }
  return raw;
}

// ============================================================
// Mapa de energia del dia (Tecnico): infiere un perfil de energia a
// lo largo del dia desde metricas reales de la noche/dia (sin datos
// horarios inventados). Devuelve 15 muestras 8am..10pm (0..100) y 3 chips.
// ============================================================
export function computeEnergyMap(today, history) {
  if (!today) return null;
  const rec = today.recovery || 50;
  const hrvDev = today.hrvDev || 0;
  const sleep = today.sleepScore || 50;
  const strain = today.dayStrain || 10;
  const rhrDev = today.rhrDev || 0;

  // Bases reales del dia.
  const morningBase = clamp(40 + (rec - 50) * 0.6 + (sleep - 50) * 0.3 + hrvDev * 1.2, 0, 100);
  const eveningBoost = clamp((hrvDev > 0 ? 18 : -6) + (strain > 8 ? -10 : 6) + (rhrDev < 0 ? 8 : -4), -25, 30);
  const midDip = clamp((strain > 14 || rec < 45 ? 22 : 8), 0, 35);

  // 15 franjas de 8:00 a 22:00 (cada 1h).
  const samples = [];
  for (let h = 8; h <= 22; h++) {
    let v;
    if (h <= 11) v = morningBase - (11 - h) * 2;            // amaneces y bajas un poco hasta el mediodia
    else if (h <= 15) v = morningBase - midDip + (h - 11) * 3; // valle a las ~15h
    else if (h <= 18) v = morningBase - midDip + 12 - (h - 15) * 2; // rebote tarde
    else v = morningBase + eveningBoost - (h - 18) * 4;       // segundo aire que baja al anochecer
    samples.push({ h, v: Math.round(clamp(v, 5, 100)) });
  }
  const peak = samples.reduce((a, b) => (b.v > a.v ? b : a), samples[0]);
  const valley = samples.reduce((a, b) => (b.v < a.v ? b : a), samples[0]);
  const fmt = (h) => `${String(h).padStart(2, "0")}:00`;
  return {
    samples,
    chips: [
      { icon: "💪", label: "Mejor entrenar", time: fmt(peak.h) },
      { icon: "🧠", label: "Reuniones clave", time: fmt(samples.reduce((a, b) => (b.v > a.v && b.h < 13 ? b : a), samples[0]).h) },
      { icon: "😴", label: "Valle de energía", time: fmt(valley.h) },
    ],
  };
}

// ============================================================
// Proyeccion de riesgo a 3 dias (Tecnico): regresion lineal sobre los
// ultimos 7 dias de riskScore, proyecta +1 y +3 dias (clamp 0..100).
// Honesto: etiquetado como proyeccion de tendencia, no prediccion medica.
// ============================================================
export function forecastRisk(history) {
  if (!history || history.length < 3) return null;
  const series = history.slice(-7).map((d) => d.riskScore ?? 0);
  const n = series.length;
  const xs = series.map((_, i) => i);
  const meanX = xs.reduce((a, b) => a + b, 0) / n;
  const meanY = series.reduce((a, b) => a + b, 0) / n;
  let num = 0, den = 0;
  for (let i = 0; i < n; i++) { num += (xs[i] - meanX) * (series[i] - meanY); den += (xs[i] - meanX) ** 2; }
  const slope = den ? num / den : 0;
  const todayScore = series[n - 1];
  const project = (days) => Math.round(clamp(todayScore + slope * days, 0, 100));
  return {
    today: todayScore,
    plus1: project(1),
    plus3: project(3),
    trendUp: slope > 1.5,
  };
}

// ============================================================
// REGISTRO: Readiness + Zona de esfuerzo objetivo + Correlación.
// ============================================================

// Readiness 0..100 combinando métricas del día (acotado).
// Entradas: { recovery, hrv, hrvBaseline, riskScore, sleepScore, fatigue }
export function computeReadiness(m) {
  const recovery = clamp(+(m.recovery ?? 50), 0, 100);
  const risk = clamp(+(m.riskScore ?? 0), 0, 100);
  const sleep = clamp(+(m.sleepScore ?? 50), 0, 100);
  const fatigue = clamp(+(m.fatigue ?? 50), 0, 100);
  // HRV z-score contra el baseline del usuario (0..100)
  const hrv = +m.hrv;
  const base = +m.hrvBaseline || hrv || 40;
  const hrvZ = clamp(50 + (hrv - base) * 3, 0, 100);
  const readiness =
    0.32 * recovery +
    0.22 * hrvZ +
    0.20 * (100 - risk) +
    0.18 * sleep +
    0.08 * (100 - fatigue);
  return Math.round(clamp(readiness, 0, 100));
}

// Zona de esfuerzo objetivo (intensidad % y strain) derivada de readiness.
// SIEMPRE acotada: nunca muy baja (>=30%) ni muy alta (<=90%) para evitar
// sobreesfuerzo ni pérdida de forma.
export function effortTarget(readiness) {
  const r = clamp(readiness, 0, 100);
  let lo, hi, label;
  if (r >= 80) { lo = 75; hi = 90; label = "Alto pero seguro"; }
  else if (r >= 60) { lo = 60; hi = 75; label = "Moderado-alto"; }
  else if (r >= 45) { lo = 45; hi = 62; label = "Moderado"; }
  else if (r >= 30) { lo = 35; hi = 50; label = "Suave"; }
  else { lo = 25; hi = 40; label = "Recuperación"; }
  // Clamp estricto de seguridad
  lo = clamp(lo, 30, 80);
  hi = clamp(hi, 45, 90);
  const mid = Math.round((lo + hi) / 2);
  return { lo, hi, mid, label, readiness: r };
}

// Agrupa logs por fecha (YYYY-MM-DD).
export function logsByDay(logs) {
  const map = {};
  for (const l of logs || []) {
    const d = new Date(l.ts).toISOString().slice(0, 10);
    (map[d] = map[d] || []).push(l);
  }
  return map;
}

// Correlación exploratoria: para cada preset, compara métricas de días CON
// log vs días SIN log. data = array de días {date, hrv, rhr, bioScore, sleepScore, riskScore, recovery}.
// Devuelve lista de {id,label,countWith,countWithout,metrics:{hrv:{with,without,deltaPct},...}}
export function correlate(logs, data) {
  if (!logs || !logs.length || !data || data.length < 4) return [];
  const presets = {};
  for (const l of logs) {
    (presets[l.preset] = presets[l.preset] || new Set()).add(new Date(l.ts).toISOString().slice(0, 10));
  }
  const metrics = ["hrv", "rhr", "bioScore", "sleepScore", "riskScore", "recovery"];
  const out = [];
  for (const id of Object.keys(presets)) {
    const withSet = new Set([...presets[id]]);
    const withRows = data.filter((d) => withSet.has(String(d.date).slice(0, 10)));
    const withoutRows = data.filter((d) => !withSet.has(String(d.date).slice(0, 10)));
    if (withRows.length < 2 || withoutRows.length < 2) continue;
    const row = { id, label: id, countWith: withRows.length, countWithout: withoutRows.length, metrics: {} };
    for (const m of metrics) {
      const avg = (rows) => rows.reduce((s, r) => s + (+r[m] || 0), 0) / rows.length;
      const w = avg(withRows), wo = avg(withoutRows);
      const delta = wo ? ((w - wo) / wo) * 100 : 0;
      row.metrics[m] = { with: Math.round(w * 10) / 10, without: Math.round(wo * 10) / 10, deltaPct: Math.round(delta) };
    }
    out.push(row);
  }
  return out;
}

