// ============================================================
// api/recovery-question.js — GET ?email=...
// Devuelve la pregunta de recuperacion si existe.
// Si el correo existe PERO no tiene pregunta (cuenta antigua), genera un
// codigo de verificacion de 6 digitos y lo devuelve para mostrar en pantalla
// (no hay email service). Asi el usuario puede reclamar la cuenta.
// 404 solo si el correo NO existe en absoluto.
// ============================================================
import { getRecoveryQuestion, getByEmail, saveResetCode } from "./_lib/store.js";

export const config = { api: { bodyParser: true } };

export default async function handler(req, res) {
  if (req.method !== "GET") return res.status(405).json({ error: "Method not allowed" });
  try {
    const email = (req.query.email || "").toLowerCase();
    if (!email) return res.status(400).json({ error: "Correo requerido." });
    const rec = await getByEmail(email);
    if (!rec) return res.status(404).json({ error: "No encontramos una cuenta con ese correo." });
    const q = await getRecoveryQuestion(email);
    if (q) return res.status(200).json({ question: q, hasRecovery: true });
    // Sin pregunta: generamos codigo de verificacion en pantalla.
    const code = String(Math.floor(100000 + Math.random() * 900000));
    await saveResetCode(email, code);
    return res.status(200).json({ question: null, hasRecovery: false, code });
  } catch (e) {
    return res.status(500).json({ error: "Error al buscar la cuenta." });
  }
}
