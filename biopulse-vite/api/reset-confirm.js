// ============================================================
// api/reset-confirm.js — POST { resetToken, newPassword }
// Valida el resetToken (HMAC, 15 min) y actualiza el hash de la cuenta.
// ============================================================
import { verifyResetToken, hashPassword } from "./_lib/auth.js";
import { updatePassword } from "./_lib/store.js";

export const config = { api: { bodyParser: true } };

export default async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });
  try {
    const { resetToken, newPassword } = req.body || {};
    if (!resetToken || !newPassword) return res.status(400).json({ error: "Faltan datos." });
    if (typeof newPassword !== "string" || newPassword.length < 6)
      return res.status(400).json({ error: "La nueva contraseña debe tener al menos 6 caracteres." });
    const claims = verifyResetToken(resetToken);
    if (!claims) return res.status(401).json({ error: "El enlace de restablecimiento expiró o no es válido. Solicítalo de nuevo." });
    await updatePassword(claims.email, await hashPassword(newPassword));
    return res.status(200).json({ ok: true });
  } catch (e) {
    return res.status(500).json({ error: "No se pudo restablecer la contraseña." });
  }
}
