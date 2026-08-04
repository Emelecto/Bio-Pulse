// ============================================================
// api/login.js — POST { email, password }
// Verifica credenciales y devuelve { token, profile }.
// ============================================================
import { verifyPassword, signToken } from "./_lib/auth.js";
import { getByEmail } from "./_lib/store.js";

export const config = { api: { bodyParser: true } };

export default async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });
  try {
    const { email, password } = req.body || {};
    if (!email || !password) return res.status(400).json({ error: "Correo y contraseña requeridos." });

    const record = await getByEmail(email);
    if (!record) return res.status(401).json({ error: "No existe una cuenta con ese correo." });
    const ok = await verifyPassword(password, record.pwHash);
    if (!ok) return res.status(401).json({ error: "Contraseña incorrecta." });

    const token = signToken({ email: record.email });
    return res.status(200).json({ token, profile: record.profile });
  } catch (e) {
    return res.status(500).json({ error: "No se pudo iniciar sesión." });
  }
}
