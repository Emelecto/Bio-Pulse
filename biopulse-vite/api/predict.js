// ============================================================
// api/predict.js — Predicción de riesgo a +3 días (Punto 8).
//
// FASE 1 (ahora): predictor transparente y explicado basado en tendencia
// lineal + reglas de hábitos (mismo enfoque que forecastRisk en cliente).
// NO finge ML con datos sintéticos: devuelve la proyección con explicación.
//
// FASE 2 (cuando haya datos reales): entrenar scripts/train_predict.py y
// cargar el modelo exportado (model.json) para reemplazar la lógica aquí.
//
// POST /api/predict (Bearer token)
//   body: { today: {hrv,rhr,bioScore,sleepScore,riskScore,recovery},
//           logs: [{preset,...}] }
//   -> { ok, todayRisk, plus1, plus3, trend, drivers: [...] }
// ============================================================
import { verifyToken } from "./_lib/auth.js";

export const config = { api: { bodyParser: true } };

// Pesos explicables de cada hábito sobre el riesgo (lo que tu profe pide:
// variables/features para ML). Positivo = sube riesgo; negativo = lo baja.
const HABIT_RISK = {
  alcohol: 6, cigarrillo: 9, vape: 7, cannabis: 5, energetica: 4, azucar: 3,
  fuerza: -2, cardio: -3, hiit: -1, yoga: -3, meditacion: -3,
  sauna: -2, banofrio: -2, hidratacion: -1, siesta: -1,
};

function linreg(series) {
  const n = series.length;
  if (n < 3) return null;
  let sx = 0, sy = 0, sxy = 0, sxx = 0;
  series.forEach((y, i) => { sx += i; sy += y; sxy += i * y; sxx += i * i; });
  const denom = n * sxx - sx * sx;
  if (!denom) return null;
  const slope = (n * sxy - sx * sy) / denom;
  const intercept = (sy - slope * sx) / n;
  return { slope, predict: (x) => intercept + slope * x };
}

export default async function handler(req, res) {
  const auth = req.headers.authorization || "";
  const token = auth.startsWith("Bearer ") ? auth.slice(7) : null;
  const claims = verifyToken(token);
  if (!claims) return res.status(401).json({ error: "Sesión inválida." });

  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });
  try {
    const today = req.body?.today || {};
    const hist = Array.isArray(req.body?.history) ? req.body.history : [];
    const logs = Array.isArray(req.body?.logs) ? req.body.logs : [];

    const todayRisk = Number(today.riskScore ?? 0);

    // Tendencia de riesgo histórico (window de hasta 14 días).
    const series = hist.slice(-14).map((d) => Number(d.riskScore ?? 0)).filter((v) => v > 0);
    const reg = linreg(series);
    const slope = reg ? reg.slope : 0;

    // Ajuste por hábitos de hoy.
    const habitAdj = logs.reduce((s, l) => s + (HABIT_RISK[l.preset] || 0), 0);

    const clamp = (v) => Math.max(0, Math.min(100, Math.round(v)));
    const plus1 = clamp(todayRisk + slope * 1 + habitAdj * 0.5);
    const plus3 = clamp(todayRisk + slope * 3 + habitAdj);

    const drivers = [];
    if (Math.abs(slope) >= 0.5) drivers.push(`Tendencia de riesgo ${slope > 0 ? "subiendo" : "bajando"} (${slope.toFixed(1)}/día)`);
    for (const l of logs) {
      const w = HABIT_RISK[l.preset];
      if (w) drivers.push(`${l.label || l.preset}: ${w > 0 ? "+" : ""}${w} pts de riesgo`);
    }
    if (!drivers.length) drivers.push("Sin señales recientes; riesgo estable.");

    return res.status(200).json({
      ok: true,
      model: "explanatory-linear-v1",
      todayRisk,
      plus1,
      plus3,
      trend: slope > 0.5 ? "up" : slope < -0.5 ? "down" : "flat",
      drivers,
      note: "Predictor transparente. Entrena scripts/train_predict.py con datos reales para un modelo ML.",
    });
  } catch (e) {
    return res.status(500).json({ error: "No se pudo predecir." });
  }
}
