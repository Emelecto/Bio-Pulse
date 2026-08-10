// ============================================================
// api/log.js — Registro de hábitos/sustancias del usuario.
//
// POST /api/log  (Bearer token) body: { logs: [ {id, ts, preset, label,
//                 category, unit, amount, note} ] }  -> { ok, count }
// GET  /api/log  (Bearer token) -> { logs: [...] }
//
// Clave aislada `log:${email}` en Upstash. No toca el registro ni CSV.
// ============================================================
import { verifyToken } from "./_lib/auth.js";
import { putLog, getLog } from "./_lib/store.js";

export const config = { api: { bodyParser: true } };

const MAX_LOGS = 5000;

export default async function handler(req, res) {
  const auth = req.headers.authorization || "";
  const token = auth.startsWith("Bearer ") ? auth.slice(7) : null;
  const claims = verifyToken(token);
  if (!claims) return res.status(401).json({ error: "Sesión inválida." });
  const email = claims.email;

  if (req.method === "GET") {
    const data = await getLog(email);
    return res.status(200).json({ logs: Array.isArray(data) ? data : [] });
  }
  if (req.method === "POST") {
    const raw = Array.isArray(req.body?.logs) ? req.body.logs : [];
    if (!raw.length) return res.status(400).json({ error: "No se enviaron logs." });
    const norm = raw.slice(0, MAX_LOGS).map((l) => ({
      id: l.id || `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      ts: l.ts ? new Date(l.ts).toISOString() : new Date().toISOString(),
      preset: String(l.preset || "custom"),
      label: String(l.label || l.preset || "Personalizado"),
      category: String(l.category || "otro"),
      unit: String(l.unit || ""),
      amount: Number.isFinite(+l.amount) ? +l.amount : 1,
      note: l.note ? String(l.note).slice(0, 280) : "",
    }));
    await putLog(email, norm);
    return res.status(200).json({ ok: true, count: norm.length });
  }
  return res.status(405).json({ error: "Method not allowed" });
}
