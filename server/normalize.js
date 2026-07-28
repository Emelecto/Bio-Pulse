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
  resp: 15,
  skinTemp: 0,
  steps: 8000,
  wakeUps: 1,
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
   WHOOP (API v1)
   - recovery: records[].score.recovery_score, hrv_rmssd_milli,
               resting_heart_rate
   - sleep:    records[].score con stage_summary y
               sleep_performance_percentage, respiratory_rate
   - cycles:   records[].score.strain
   Las fechas se derivan del campo start/created_at de cada record.
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
    if (s.score.respiratory_rate != null) row.resp = +s.score.respiratory_rate.toFixed(1);
    if (st?.disturbance_count != null) row.wakeUps = st.disturbance_count;
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
