// ============================================================
// api/ingest.js — Ingestion de muestras biométricas DESDE un wearable
// (Open Wearables / app Flutter puente) hacia el backend de BioPulse.
//
// NO reemplaza el flujo CSV: es un canal ADICIONAL. El DataSourceModal
// (subida manual de .csv) sigue funcionando igual.
//
// Contrato:
//   POST  /api/ingest  (Bearer token)
//        body: { samples: [ { date, hrv, rhr, recovery, sleepHours,
//                            sleepEff, sleepPerf, dayStrain, resp, skinTemp, steps }, ... ] }
//        -> { ok:true, count }
//   GET   /api/ingest  (Bearer token) -> { samples: [...] }
//
// Las muestras se guardan en Upstash bajo la clave `wb:${email}`.
// El enriquecimiento (BioScore/Risk Score) ocurre en el cliente igual que con CSV.
// ============================================================
import { verifyToken } from "./_lib/auth.js";
import { putRaw, getRaw } from "./_lib/store.js";

export const config = { api: { bodyParser: true } };

function num(v) {
  const n = parseFloat(v);
  return isNaN(n) ? null : n;
}
function normSample(s) {
  let d;
  if (s.date) d = new Date(s.date);
  else if (s.timestamp) d = new Date(Number(s.timestamp) * 1000);
  else d = new Date();
  return {
    date: isNaN(d.getTime()) ? new Date() : d,
    hrv: num(s.hrv), rhr: num(s.rhr), recovery: num(s.recovery),
    sleepHours: num(s.sleepHours), sleepEff: num(s.sleepEff),
    sleepPerf: num(s.sleepPerf), dayStrain: num(s.dayStrain),
    resp: num(s.resp), skinTemp: num(s.skinTemp), steps: num(s.steps),
  };
}

export default async function handler(req, res) {
  const auth = req.headers.authorization || "";
  const token = auth.startsWith("Bearer ") ? auth.slice(7) : null;
  const claims = verifyToken(token);
  if (!claims) return res.status(401).json({ error: "Sesión inválida." });
  const email = claims.email;

  if (req.method === "GET") {
    const data = await getRaw(`wb:${email}`);
    return res.status(200).json({ samples: Array.isArray(data) ? data : [] });
  }
  if (req.method === "POST") {
    const raw = Array.isArray(req.body?.samples) ? req.body.samples : [];
    if (!raw.length) return res.status(400).json({ error: "No se enviaron muestras." });
    const norm = raw.slice(0, 5000).map(normSample).filter((s) => s.hrv != null || s.rhr != null);
    if (!norm.length) return res.status(400).json({ error: "Las muestras no tienen HRV/RHR válidos." });
    await putRaw(`wb:${email}`, norm);
    return res.status(200).json({ ok: true, count: norm.length });
  }
  return res.status(405).json({ error: "Method not allowed" });
}
