/* Test de normalización con fixtures que imitan la estructura
   EXACTA de las respuestas de Fitbit Web API y Whoop API v1.
   Ejecutar:  node server/test-normalize.js  */
import { normalizeFitbit, normalizeWhoop } from "./normalize.js";

let failures = 0;
function check(name, cond, detail = "") {
  console.log(`${cond ? "PASS" : "FAIL"}  ${name}${detail ? "  -> " + detail : ""}`);
  if (!cond) failures++;
}

/* ---------- FITBIT fixtures ---------- */
const fitbitFix = {
  hrv: { hrv: [
    { dateTime: "2026-07-25", value: { dailyRmssd: 62.3, deepRmssd: 70.1 } },
    { dateTime: "2026-07-26", value: { dailyRmssd: 58.9, deepRmssd: 66.0 } },
    { dateTime: "2026-07-27", value: { dailyRmssd: 44.2, deepRmssd: 51.7 } },
  ] },
  rhr: { "activities-heart": [
    { dateTime: "2026-07-25", value: { restingHeartRate: 55 } },
    { dateTime: "2026-07-26", value: { restingHeartRate: 57 } },
    { dateTime: "2026-07-27", value: { restingHeartRate: 63 } },
  ] },
  sleep: { sleep: [
    { dateOfSleep: "2026-07-25", duration: 27000000, efficiency: 92, levels: { summary: { wake: { count: 2 } } } },
    { dateOfSleep: "2026-07-26", duration: 23400000, efficiency: 85, levels: { summary: { wake: { count: 4 } } } },
    { dateOfSleep: "2026-07-27", duration: 19800000, efficiency: 78, levels: { summary: { wake: { count: 6 } } } },
  ] },
  resp: { br: [
    { dateTime: "2026-07-25", value: { breathingRate: 14.2 } },
    { dateTime: "2026-07-27", value: { breathingRate: 17.8 } },
  ] },
  temp: { tempSkin: [
    { dateTime: "2026-07-27", value: { nightlyRelative: 1.4 } },
  ] },
};

const f = normalizeFitbit(fitbitFix);
check("fitbit: 3 dias completos", f.length === 3, `got ${f.length}`);
check("fitbit: ordenado por fecha", f[0].date === "2026-07-25" && f[2].date === "2026-07-27");
check("fitbit: hrv redondeado", f[0].hrv === 62);
check("fitbit: rhr directo", f[2].rhr === 63);
check("fitbit: sleepHours de duration(ms)", f[0].sleepHours === 7.5, `got ${f[0].sleepHours}`);
check("fitbit: eficiencia -> sleepEff y sleepPerf", f[1].sleepEff === 85 && f[1].sleepPerf === 85);
check("fitbit: resp con decimal", f[2].resp === 17.8);
check("fitbit: skinTemp delta", f[2].skinTemp === 1.4);
check("fitbit: default resp cuando falta", f[1].resp === 15, `got ${f[1].resp}`);
check("fitbit: wakeUps del summary", f[2].wakeUps === 6);

/* dia sin rhr se descarta */
const f2 = normalizeFitbit({
  hrv: { hrv: [{ dateTime: "2026-07-20", value: { dailyRmssd: 50 } }] },
  rhr: { "activities-heart": [] },
  sleep: { sleep: [] }, resp: null, temp: null,
});
check("fitbit: descarta dia sin rhr", f2.length === 0, `got ${f2.length}`);

/* ---------- WHOOP fixtures ---------- */
const whoopFix = {
  recovery: { records: [
    { created_at: "2026-07-26T07:12:00.000Z", score: { recovery_score: 34, hrv_rmssd_milli: 41.8, resting_heart_rate: 61.2, skin_temp_celsius: 34.9 } },
    { created_at: "2026-07-27T06:58:00.000Z", score: { recovery_score: 71, hrv_rmssd_milli: 63.5, resting_heart_rate: 54.4 } },
  ] },
  sleep: { records: [
    { start: "2026-07-25T23:10:00.000Z", end: "2026-07-26T06:40:00.000Z",
      score: { stage_summary: { total_in_bed_time_milli: 27000000, disturbance_count: 5 },
               sleep_efficiency_percentage: 83.4, sleep_performance_percentage: 76.0, respiratory_rate: 16.61 } },
    { start: "2026-07-26T23:00:00.000Z", end: "2026-07-27T07:05:00.000Z",
      score: { stage_summary: { total_in_bed_time_milli: 29100000, disturbance_count: 2 },
               sleep_efficiency_percentage: 91.2, sleep_performance_percentage: 88.0, respiratory_rate: 14.9 } },
  ] },
  cycles: { records: [
    { start: "2026-07-26T04:00:00.000Z", score: { strain: 14.33 } },
    { start: "2026-07-27T04:00:00.000Z", score: { strain: 8.91 } },
  ] },
};

const w = normalizeWhoop(whoopFix);
check("whoop: 2 dias completos", w.length === 2, `got ${w.length}`);
check("whoop: hrv de rmssd_milli", w[0].hrv === 42, `got ${w[0].hrv}`);
check("whoop: rhr redondeado", w[0].rhr === 61);
check("whoop: recovery_score", w[1].recovery === 71);
check("whoop: skinTemp centrado en 33.5", w[0].skinTemp === 1.4, `got ${w[0].skinTemp}`);
check("whoop: sleepHours de in_bed_milli", w[0].sleepHours === 7.5, `got ${w[0].sleepHours}`);
check("whoop: eficiencia y performance", w[1].sleepEff === 91 && w[1].sleepPerf === 88);
check("whoop: resp con decimales", w[0].resp === 16.6);
check("whoop: strain del cycle", w[0].dayStrain === 14.3);
check("whoop: wakeUps de disturbance_count", w[1].wakeUps === 2);

/* record sin score no revienta */
const w2 = normalizeWhoop({ recovery: { records: [{ created_at: "2026-07-20T05:00:00Z", score: null }] }, sleep: { records: [] }, cycles: { records: [] } });
check("whoop: tolera score null", w2.length === 0);

console.log(failures === 0 ? "\nALL NORMALIZE TESTS PASSED" : `\n${failures} TEST(S) FAILED`);
process.exit(failures === 0 ? 0 : 1);
