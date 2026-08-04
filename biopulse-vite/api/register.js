// ============================================================
// api/register.js — POST { email, password, profile, recovery? }
// Crea cuenta (correo+clave hasheada) y asocia el perfil de salud.
// recovery opcional: { question, answer } -> guarda recoveryQ + recoveryA(hasheada)
// Devuelve { token, profile }.
// ============================================================
import { hashPassword, verifyPassword, signToken } from "./_lib/auth.js";
import { getByEmail, putUser } from "./_lib/store.js";

export const config = { api: { bodyParser: true } };

function isValidEmail(e) {
  return typeof e === "string" && /^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(e);
}

export default async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });
  try {
    const { email, password, profile, recovery } = req.body || {};
    if (!isValidEmail(email)) return res.status(400).json({ error: "Correo no válido." });
    if (typeof password !== "string" || password.length < 6)
      return res.status(400).json({ error: "La contraseña debe tener al menos 6 caracteres." });

    const existing = await getByEmail(email);
    if (existing) return res.status(409).json({ error: "Ese correo ya tiene una cuenta. Inicia sesión." });

    const pwHash = await hashPassword(password);
    const record = {
      email: email.toLowerCase(),
      pwHash,
      profile: profile || null,
      createdAt: new Date().toISOString(),
    };
    // Pregunta de recuperacion (si se envio): guarda pregunta en claro + respuesta hasheada.
    if (recovery && recovery.question && recovery.answer && String(recovery.answer).trim()) {
      record.recoveryQ = String(recovery.question);
      record.recoveryA = await hashPassword(String(recovery.answer).trim());
    }
    await putUser(email, record);

    const token = signToken({ email: record.email });
    return res.status(200).json({ token, profile: record.profile });
  } catch (e) {
    return res.status(500).json({ error: "No se pudo registrar. Intenta de nuevo." });
  }
}
