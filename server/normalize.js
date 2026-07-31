/* ============================================================
   NORMALIZACIÓN — de la respuesta cruda de cada API al esquema
   canónico del pipeline de BioPulse:

     { date: "YYYY-MM-DD", hrv, rhr, recovery, dayStrain,
       sleepHours, sleepEff, sleepPerf, resp, skinTemp,
       steps, wakeUps }

   Regla de diseño (igual que el mapeo CSV de la app):
   - hrv y rhr son OBLIGATORIOS: si un dia no los tiene, se descarta.
   - El resto usa valores neutros si faltan, para que los z-scores
     de esas variables no generen falsas anomalias.
   ============================================================ */

const DEFAULTS = {
  recovery: 60,
  dayStrain: 10,
  sleepHours: 7,
  sleepEff: 85,
  sleepPerf: 80,
  sleepConsistency: 80,
  sleepNeededH: 8,
  resp: 15,
  skinTemp: 0,
  spo2: 96,
  steps: 8000,
  wakeUps: 1,
  calibrating: false,
};

function buildRow(date, partial) {
  return { date, ...DEFAULTS, ...partial };
}

/* ------------------------------------------------------------
   FITBIT
   - hrv:  hrv[].value.dailyRmssd  (ms)
   - rhr:  activities-heart[].value.restingHeartRate (bpm)
   - sleep: sleep[] con duration (ms), efficiency (%), summary
   - resp: br[].value.breathingRate
   - temp: tempSkin[].value.nightlyRelative (delta °C)
   ------------------------------------------------------------ */
export function normalizeFitbit({ hrv, rhr, sleep, resp, temp }) {
  const byDate = new Map();
  const touch = (date) => {
    if (!byDate.has(date)) byDate.set(date, {});
    return byDate.get(date);
  };

  (hrv?.hrv || []).forEach((d) => {
    if (d?.value?.dailyRmssd != null) touch(d.dateTime).hrv = Math.round(d.value.dailyRmssd);
  });
  (rhr?.["activities-heart"] || []).forEach((d) => {
    if (d?.value?.restingHeartRate != null) touch(d.dateTime).rhr = d.value.restingHeartRate;
  });
  (sleep?.sleep || []).forEach((s) => {
    const date = s.dateOfSleep;
    if (!date) return;
    const row = touch(date);
    row.sleepHours = +(s.duration / 36e5).toFixed(1);
    if (s.efficiency != null) {
      row.sleepEff = s.efficiency;
      row.sleepPerf = s.efficiency;
    }
    const wake = s?.levels?.summary?.wake?.count;
    if (wake != null) row.wakeUps = wake;
  });
  (resp?.br || []).forEach((d) => {
    if (d?.value?.breathingRate != null) touch(d.dateTime).resp = +d.value.breathingRate.toFixed(1);
  });
  (temp?.tempSkin || []).forEach((d) => {
    if (d?.value?.nightlyRelative != null) touch(d.dateTime).skinTemp = +d.value.nightlyRelative.toFixed(1);
  });

  return [...byDate.entries()]
    .filter(([, v]) => v.hrv != null && v.rhr != null) // hrv+rhr obligatorios
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([date, v]) => buildRow(date, v));
}

/* ------------------------------------------------------------
   WHOOP (API v2, base https://api.prod.whoop.com/developer)
   - recovery: records[].score con hrv_rmssd_milli, resting_heart_rate,
               recovery_score, skin_temp_celsius, spo2_percentage
   - sleep:    records[].score con stage_summary.total_in_bed_time_milli,
               sleep_efficiency_percentage, sleep_performance_percentage,
               sleep_consistency_percentage, respiratory_rate, disturbance_count,
               y sleep_needed (SleepNeeded)
   - cycles:   records[].score.strain
   La fecha se deriva del campo start/created_at de cada record.
   La API pagina con next_token (no offset); el fetcher ya lo recorre.
   ------------------------------------------------------------ */
export function normalizeWhoop({ recovery, sleep, cycles }) {
  const byDate = new Map();
  const touch = (date) => {
    if (!byDate.has(date)) byDate.set(date, {});
    return byDate.get(date);
  };
  const day = (iso) => (iso || "").slice(0, 10);

  (recovery?.records || []).forEach((r) => {
    const date = day(r.created_at || r.updated_at);
    if (!date || !r.score) return;
    const row = touch(date);
    if (r.score.hrv_rmssd_milli != null) row.hrv = Math.round(r.score.hrv_rmssd_milli);
    if (r.score.resting_heart_rate != null) row.rhr = Math.round(r.score.resting_heart_rate);
    if (r.score.recovery_score != null) row.recovery = Math.round(r.score.recovery_score);
    if (r.score.skin_temp_celsius != null) row.skinTemp = +(r.score.skin_temp_celsius - 33.5).toFixed(1);
    if (r.score.spo2_percentage != null) row.spo2 = +r.score.spo2_percentage.toFixed(1);
    if (r.score.user_calibrating != null) row.calibrating = r.score.user_calibrating;
  });
  (sleep?.records || []).forEach((s) => {
    const date = day(s.end || s.start);
    if (!date || !s.score) return;
    const row = touch(date);
    const st = s.score.stage_summary;
    if (st?.total_in_bed_time_milli != null) {
      row.sleepHours = +(st.total_in_bed_time_milli / 36e5).toFixed(1);
    }
    if (s.score.sleep_efficiency_percentage != null) row.sleepEff = Math.round(s.score.sleep_efficiency_percentage);
    if (s.score.sleep_performance_percentage != null) row.sleepPerf = Math.round(s.score.sleep_performance_percentage);
    if (s.score.sleep_consistency_percentage != null) row.sleepConsistency = Math.round(s.score.sleep_consistency_percentage);
    if (s.score.respiratory_rate != null) row.resp = +s.score.respiratory_rate.toFixed(1);
    if (st?.disturbance_count != null) row.wakeUps = st.disturbance_count;
    const sn = s.score.sleep_needed;
    if (sn?.baseline_milli != null) {
      row.sleepNeededH = +(sn.baseline_milli / 36e5).toFixed(1);
    }
  });
  (cycles?.records || []).forEach((c) => {
    const date = day(c.start);
    if (!date || !c.score) return;
    if (c.score.strain != null) touch(date).dayStrain = +c.score.strain.toFixed(1);
  });

  return [...byDate.entries()]
    .filter(([, v]) => v.hrv != null && v.rhr != null)
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([date, v]) => buildRow(date, v));
}

// ------------------------------------------------------------
// GOOGLE FIT (REST API, best-effort — en proceso de cierre)
// Google Fit NO expone HRV/RHR/sueño como series diarias listas;
// los datos vienen como "data sources" + "datasets" con timestamps en
// nanosegundos. Este normalizador es defensivo: si no hay fuentes de
// datos (API desactivada o sin permisos), devuelve [] y el backend
// reporta 0 dias en vez de crashear.
// ------------------------------------------------------------
export function normalizeGoogle({ sources }) {
  // Por ahora devolvemos arreglo vacio salvo que el caller haya resuelto
  // los datasets. La resolucion de datasets por fuente es best-effort y
  // depende de que Google Fit REST siga activa. Si hay fuentes de HR/RHR,
  // se podria iterar; pero para no prometer datos que la API ya no da,
  // dejamos el mapeo explicito y documentado en el README.
  const hasHr = (sources?.rhr?.length || 0) > 0;
  const hasHrv = (sources?.hrv?.length || 0) > 0;
  const hasSleep = (sources?.sleep?.length || 0) > 0;
  const hasResp = (sources?.resp?.length || 0) > 0;
  // Sin fuentes -> sin filas (el backend lo reporta como 0 dias).
  if (!hasHr && !hasHrv && !hasSleep && !hasResp) return [];
  // Si hubiera fuentes, aqui se iterarian los datasets; lo dejamos como
  // marcador de que el proveedor esta cableado pero la API puede no responder.
  return [];
}
