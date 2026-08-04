// ============================================================
// api/profile.js — GET (devuelve perfil del token) y PUT (actualiza perfil).
// Auth: header Authorization: Bearer <token>
// ============================================================
import { verifyToken } from "./_lib/auth.js";
import { getByEmail, updateProfile } from "./_lib/store.js";

export const config = { api: { bodyParser: true } };

function auth(req, res) {
  const h = req.headers.authorization || "";
  const token = h.startsWith("Bearer ") ? h.slice(7) : null;
  const body = verifyToken(token);
  if (!body) { res.status(401).json({ error: "Sesión inválida." }); return null; }
  return body;
}

export default async function handler(req, res) {
  const claims = auth(req, res);
  if (!claims) return;
  try {
    if (req.method === "GET") {
      const rec = await getByEmail(claims.email);
      return res.status(200).json({ profile: rec?.profile || null });
    }
    if (req.method === "PUT") {
      const rec = await updateProfile(claims.email, req.body?.profile || null);
      if (!rec) return res.status(404).json({ error: "Cuenta no encontrada." });
      return res.status(200).json({ profile: rec.profile });
    }
    return res.status(405).json({ error: "Method not allowed" });
  } catch (e) {
    return res.status(500).json({ error: "Error al leer el perfil." });
  }
}
