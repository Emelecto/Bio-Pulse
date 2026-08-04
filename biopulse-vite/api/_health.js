// Endpoint de diagnostico (no expone secretos): dice si el storage
// persistente (KV/Upstash) esta conectado en este deploy.
import { KV_URL, kvAvailable } from "./_lib/store.js";

export const config = { api: { bodyParser: true } };

export default async function handler(req, res) {
  return res.status(200).json({
    storage: kvAvailable ? "persistent" : "tmp-fallback",
    hasUrl: !!KV_URL,
    note: kvAvailable
      ? "Upstash/KV conectado: los usuarios persisten."
      : "Falta KV_REST_API_* o UPSTASH_REDIS_REST_* en env vars de Vercel.",
  });
}
