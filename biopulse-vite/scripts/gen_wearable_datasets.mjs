// Generador de datasets de wearables realistas y compatibles con BioPulse.
// 10 perfiles x 30 dias, 1 fila/dia (formato que espera useBiopulseData /
// computePipeline). Columnas con sinonimos que la app auto-detecta.
// Determinista (seed por perfil) para reproducibilidad.
import { writeFileSync, mkdirSync } from "fs";
import { join } from "path";

const OUT = join(process.cwd(), "public", "datasets");
mkdirSync(OUT, { recursive: true });

// PRNG determinista (mulberry32)
function mulberry32(seed) {
  return function () {
    seed |= 0; seed = (seed + 0x6D2B79F5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
const clamp = (v, lo, hi) => Math.max(lo, Math.min(hi, v));
const gauss = (rnd, m, s) => m + (rnd() + rnd() + rnd() - 1.5) * s; // aprox normal
const r1 = (v) => Math.round(v * 10) / 10;
const ri = (v) => Math.round(v);

// Perfiles: cada uno define linea base + variacion por tipo de dia.
const PROFILES = [
  { id: "01_athlete_young", seed: 1011, hrvB: 72, rhrB: 48, recB: 82, strainB: 11, sleepB: 8.0, effB: 92, stepsB: 9500, wakeB: 0.6, label: "Atleta joven (20s)" },
  { id: "02_healthy_elderly", seed: 2022, hrvB: 41, rhrB: 60, recB: 68, strainB: 9, sleepB: 7.0, effB: 86, stepsB: 5200, wakeB: 1.4, label: "Adulto mayor sano (70s)" },
  { id: "03_sedentary", seed: 3033, hrvB: 31, rhrB: 72, recB: 52, strainB: 6, sleepB: 6.2, effB: 80, stepsB: 2800, wakeB: 2.2, label: "Sedentario (40s)" },
  { id: "04_illness_recovery", seed: 4044, hrvB: 55, rhrB: 62, recB: 70, strainB: 8, sleepB: 7.2, effB: 84, stepsB: 6000, wakeB: 1.5, label: "Recuperacion post-enfermedad" },
  { id: "05_chronic_stress", seed: 5055, hrvB: 33, rhrB: 70, recB: 46, strainB: 12, sleepB: 6.0, effB: 78, stepsB: 4500, wakeB: 2.8, label: "Estres cronico" },
  { id: "06_overtraining", seed: 6066, hrvB: 60, rhrB: 54, recB: 60, strainB: 14, sleepB: 7.4, effB: 88, stepsB: 8800, wakeB: 1.8, label: "Sobreentrenamiento" },
  { id: "07_shift_worker", seed: 7077, hrvB: 44, rhrB: 64, recB: 58, strainB: 10, sleepB: 6.4, effB: 79, stepsB: 5500, wakeB: 2.4, label: "Trabajador por turnos" },
  { id: "08_post_surgery", seed: 8088, hrvB: 38, rhrB: 74, recB: 35, strainB: 5, sleepB: 6.0, effB: 76, stepsB: 2200, wakeB: 2.6, label: "Post-operatorio" },
  { id: "09_teen_gamer", seed: 9099, hrvB: 47, rhrB: 68, recB: 55, strainB: 7, sleepB: 5.6, effB: 82, stepsB: 1800, wakeB: 2.0, label: "Adolescente gamer (nocturno)" },
  { id: "10_cardiovascular_risk", seed: 10100, hrvB: 26, rhrB: 82, recB: 40, strainB: 9, sleepB: 6.3, effB: 77, stepsB: 3200, wakeB: 2.6, label: "Riesgo cardiovascular" },
];

const DAYS = 30;
const today = new Date();
today.setHours(0, 0, 0, 0);

function buildRow(p, rnd, dayIdx, date) {
  // tipo de dia: entreno intenso / descanso / mala noche / evento especial
  const dow = date.getDay(); // 0 dom
  const isWeekend = dow === 0 || dow === 6;
  const isTrain = !isWeekend && (dayIdx % 3 === 0); // dias de entreno
  const isRest = !isTrain && !isWeekend;

  let hrv = p.hrvB + gauss(rnd, 0, 4);
  let rhr = p.rhrB + gauss(rnd, 0, 2.5);
  let rec = p.recB + gauss(rnd, 0, 6);
  let strain = p.strainB + gauss(rnd, 0, 2.5);
  let sleep = p.sleepB + gauss(rnd, 0, 0.5);
  let eff = p.effB + gauss(rnd, 0, 4);
  let steps = p.stepsB + gauss(rnd, 0, p.stepsB * 0.15);
  let wake = p.wakeB + gauss(rnd, 0, 0.8);
  let resp = 15 + gauss(rnd, 0, 0.6);
  let skin = gauss(rnd, 0, 0.2);

  // entreno intenso => strain alta, hrv baja ese dia, recovery baja al dia sig
  if (isTrain) { strain += 4; hrv -= 6; rec -= 8; }
  if (isRest) { strain -= 1.5; }
  if (isWeekend) { sleep += 0.6; eff += 3; steps -= p.stepsB * 0.2; }

  // eventos especificos por perfil
  if (p.id === "04_illness_recovery" && dayIdx < 8) { hrv -= 14; rec -= 25; rhr += 8; resp += 3; skin += 1.2; sleep -= 1; eff -= 8; wake += 2; }
  if (p.id === "04_illness_recovery" && dayIdx >= 8) { hrv += (dayIdx - 8) * 1.2; rec += (dayIdx - 8) * 1.5; }
  if (p.id === "05_chronic_stress") { hrv -= 4; rec -= 6; resp += 1.5; wake += 1; }
  if (p.id === "06_overtraining" && dayIdx > 18) { hrv -= 16; rec -= 22; rhr += 6; wake += 2; eff -= 6; }
  if (p.id === "07_shift_worker") { sleep -= (dow % 2) * 1.2; eff -= (dow % 2) * 6; hrv -= (dow % 2) * 4; }
  if (p.id === "08_post_surgery" && dayIdx < 10) { hrv -= 12; rec -= 18; rhr += 10; steps *= 0.4; wake += 2; }
  if (p.id === "08_post_surgery" && dayIdx >= 10) { hrv += (dayIdx - 10) * 1.0; rec += (dayIdx - 10) * 1.4; }
  if (p.id === "09_teen_gamer") { sleep -= 1.2; eff += 2; rec -= 5; wake += 1; }
  if (p.id === "10_cardiovascular_risk") { rhr += 4; hrv -= 5; rec -= 8; resp += 2.5; wake += 1.5; }

  hrv = clamp(hrv, 18, 110); rhr = clamp(rhr, 38, 110); rec = clamp(rec, 5, 99);
  strain = clamp(strain, 2, 21); sleep = clamp(sleep, 3, 10); eff = clamp(eff, 50, 99);
  steps = clamp(steps, 200, 22000); wake = clamp(wake, 0, 8); resp = clamp(resp, 10, 30);
  skin = clamp(skin, -1.5, 3);

  const iso = date.toISOString().slice(0, 10);
  return {
    date: iso, hrv: ri(hrv), rhr: ri(rhr), recovery: ri(rec),
    respiratory_rate: r1(resp), skin_temp_deviation: r1(skin),
    sleep_efficiency: ri(eff), sleep_performance: ri(clamp(eff - 2 + gauss(rnd,0,3), 50, 99)),
    sleep_hours: r1(sleep), day_strain: r1(strain), steps: ri(steps), wake_ups: ri(wake),
  };
}

const HEAD = "date,hrv,rhr,recovery,respiratory_rate,skin_temp_deviation,sleep_efficiency,sleep_performance,sleep_hours,day_strain,steps,wake_ups";

for (const p of PROFILES) {
  const rnd = mulberry32(p.seed);
  const rows = [];
  for (let i = 0; i < DAYS; i++) {
    const d = new Date(today); d.setDate(today.getDate() - (DAYS - 1 - i));
    rows.push(buildRow(p, rnd, i, d));
  }
  const csv = [HEAD, ...rows.map((r) => Object.values(r).join(","))].join("\n");
  const file = join(OUT, `biopulse_${p.id}.csv`);
  writeFileSync(file, csv);
  console.log(`✓ ${p.label.padEnd(28)} -> biopulse_${p.id}.csv (${DAYS} dias)`);
}
console.log(`\nGenerados ${PROFILES.length} datasets en public/datasets/`);
