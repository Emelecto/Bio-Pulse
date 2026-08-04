// ============================================================
// api/reset-request.js — POST { email, answer? , code? }
// Valida la respuesta de recuperacion O el codigo de verificacion en pantalla.
// Devuelve resetToken (HMAC, 15 min) para confirmar el nuevo password.
// ============================================================
import { verifyPassword, signResetToken } from "./_lib/auth.js";
import { getByEmail, verifyResetCode } from "./_lib/store.js";

export const config = { api: { bodyParser: true } };

export default async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });
  try {
    const { email, answer, code } = req.body || {};
    if (!email) return res.status(400).json({ error: "Correo requerido." });
    const rec = await getByEmail(email);
    if (!rec) return res.status(404).json({ error: "No encontramos una cuenta con ese correo." });

    // Modo A: pregunta de recuperacion disponible.
    if (rec.recoveryA) {
      if (!answer || !(await verifyPassword(String(answer).trim(), rec.recoveryA))) {
        return res.status(401).json({ error: "La respuesta no es correcta." });
      }
      const resetToken = signResetToken(rec.email);
      return res.status(200).json({ resetToken });
    }
    // Modo B: sin pregunta -> codigo de verificacion en pantalla.
    if (!code || !(await verifyResetCode(rec.email, code))) {
      return res.status(401).json({ error: "El código de verificación no es correcto o expiró." });
    }
    const resetToken = signResetToken(rec.email);
    return res.status(200).json({ resetToken });
  } catch (e) {
    return res.status(500).json({ error: "No se pudo procesar la solicitud." });
  }
}
