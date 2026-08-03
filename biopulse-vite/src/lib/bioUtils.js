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
