// ============================================================
// api/recovery-question.js — GET ?email=...  -> devuelve la pregunta
// de recuperacion (nunca la respuesta). 404 si el correo no existe.
// ============================================================
import { getRecoveryQuestion } from "./_lib/store.js";

export const config = { api: { bodyParser: true } };

export default async function handler(req, res) {
  if (req.method !== "GET") return res.status(405).json({ error: "Method not allowed" });
  try {
    const email = (req.query.email || "").toLowerCase();
    if (!email) return res.status(400).json({ error: "Correo requerido." });
    const q = await getRecoveryQuestion(email);
    if (!q) return res.status(404).json({ error: "No encontramos una cuenta con ese correo." });
    return res.status(200).json({ question: q });
  } catch (e) {
    return res.status(500).json({ error: "Error al buscar la cuenta." });
  }
}
