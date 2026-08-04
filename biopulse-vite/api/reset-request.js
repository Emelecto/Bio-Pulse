// ============================================================
// api/reset-request.js — POST { email, answer }
// Valida la respuesta de recuperacion (hasheada) contra la guardada.
// Si es correcta, devuelve un resetToken (HMAC, 15 min) para confirmar.
// Nunca revela si el correo existe hasta validar la respuesta.
// ============================================================
import { verifyPassword, signResetToken } from "./_lib/auth.js";
import { getByEmail } from "./_lib/store.js";

export const config = { api: { bodyParser: true } };

export default async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });
  try {
    const { email, answer } = req.body || {};
    if (!email || !answer) return res.status(400).json({ error: "Correo y respuesta requeridos." });
    const rec = await getByEmail(email);
    // Respuesta incorrecta o cuenta sin recuperacion -> error generico.
    if (!rec || !rec.recoveryA || !(await verifyPassword(String(answer).trim(), rec.recoveryA))) {
      return res.status(401).json({ error: "La respuesta no es correcta." });
    }
    const resetToken = signResetToken(rec.email);
    return res.status(200).json({ resetToken });
  } catch (e) {
    return res.status(500).json({ error: "No se pudo procesar la solicitud." });
  }
}
