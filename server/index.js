/* ============================================================
   BIOPULSE BACKEND PROXY — Fase 5 del roadmap
   ------------------------------------------------------------
   Resuelve los dos bloqueos que impiden llamar a las APIs de
   wearables directamente desde el navegador:
     1. CORS: Fitbit/Whoop no aceptan peticiones desde localhost.
     2. OAuth: el intercambio de codigo->token requiere el
        client_secret, que NUNCA debe vivir en el frontend.

   Endpoints:
     GET  /api/health                    -> ping
     GET  /api/:provider/auth-url        -> URL de autorizacion OAuth
     POST /api/:provider/token           -> intercambia code por token
     GET  /api/:provider/daily?days=30   -> datos diarios normalizados

   El frontend consume SIEMPRE el mismo esquema normalizado:
     { date, hrv, rhr, recovery, sleepHours, sleepEff, resp, ... }
   asi el pipeline de 3 modelos no cambia sin importar la fuente.
   ============================================================ */
import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import { normalizeFitbit, normalizeWhoop, normalizeGoogle } from "./normalize.js";

dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());

const PORT = process.env.PORT || 4000;

// --- Config por proveedor (credenciales en .env, nunca en codigo) ---
const PROVIDERS = {
  fitbit: {
    clientId: process.env.FITBIT_CLIENT_ID,
    clientSecret: process.env.FITBIT_CLIENT_SECRET,
    redirectUri: process.env.FITBIT_REDIRECT_URI || "http://localhost:5174/callback/fitbit",
    authUrl: "https://www.fitbit.com/oauth2/authorize",
    tokenUrl: "https://api.fitbit.com/oauth2/token",
    scope: "heartrate sleep activity respiratory_rate temperature",
    apiBase: "https://api.fitbit.com",
  },
  whoop: {
    clientId: process.env.WHOOP_CLIENT_ID,
    clientSecret: process.env.WHOOP_CLIENT_SECRET,
    redirectUri: process.env.WHOOP_REDIRECT_URI || "http://localhost:5174/callback/whoop",
    authUrl: "https://api.prod.whoop.com/oauth/oauth2/auth",
    tokenUrl: "https://api.prod.whoop.com/oauth/oauth2/token",
    scope: "read:recovery read:sleep read:cycles read:body_measurement",
    apiBase: "https://api.prod.whoop.com/developer",
  },
  // NOTA: Google Fit REST API esta en proceso de cierre/migracion a Health
  // Connect (solo Android). Este proveedor es best-effort: usa los endpoints
  // que aun responden. Si Google los apaga, /api/google/daily devolvera 4xx.
  // El client_id debe ser de tipo "web" en Google Cloud Console y la API
  // "Fitness API" debe estar habilitada en el proyecto.
  google: {
    clientId: process.env.GOOGLE_CLIENT_ID,
    clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    redirectUri: process.env.GOOGLE_REDIRECT_URI || "https://bio-pulse-six.vercel.app/callback/google",
    authUrl: "https://accounts.google.com/o/oauth2/v2/auth",
    tokenUrl: "https://oauth2.googleapis.com/token",
    scope: "https://www.googleapis.com/auth/fitness.heart_rate.read https://www.googleapis.com/auth/fitness.sleep.read https://www.googleapis.com/auth/fitness.respiratory.read",
    apiBase: "https://www.googleapis.com/fitness/v1",
  },
};

function getProvider(req, res) {
  const p = PROVIDERS[req.params.provider];
  if (!p) {
    res.status(404).json({ error: `Proveedor desconocido: ${req.params.provider}` });
    return null;
  }
  return p;
}

// --- Health check ---
app.get("/api/health", (_req, res) => {
  res.json({
    ok: true,
    service: "biopulse-proxy",
    providers: Object.fromEntries(
      Object.entries(PROVIDERS).map(([k, v]) => [k, { configured: Boolean(v.clientId && v.clientSecret) }])
    ),
  });
});

// --- 1. URL de autorizacion OAuth (el usuario la abre en el navegador) ---
app.get("/api/:provider/auth-url", (req, res) => {
  const p = getProvider(req, res);
  if (!p) return;
  if (!p.clientId) {
    return res.status(400).json({ error: "Faltan credenciales: define CLIENT_ID en server/.env (ver README)" });
  }
  const url = new URL(p.authUrl);
  url.searchParams.set("client_id", p.clientId);
  url.searchParams.set("response_type", "code");
  url.searchParams.set("redirect_uri", p.redirectUri);
  url.searchParams.set("scope", p.scope);
  res.json({ url: url.toString() });
});

// --- 2. Intercambio codigo -> access token (usa el client_secret) ---
app.post("/api/:provider/token", async (req, res) => {
  const p = getProvider(req, res);
  if (!p) return;
  const { code } = req.body;
  if (!code) return res.status(400).json({ error: "Falta 'code' en el body" });
  if (!p.clientId || !p.clientSecret) {
    return res.status(400).json({ error: "Faltan credenciales en server/.env" });
  }
  try {
    const body = new URLSearchParams({
      grant_type: "authorization_code",
      code,
      redirect_uri: p.redirectUri,
      client_id: p.clientId,
    });
    const headers = { "Content-Type": "application/x-www-form-urlencoded" };
    if (req.params.provider === "fitbit") {
      headers.Authorization = "Basic " + Buffer.from(`${p.clientId}:${p.clientSecret}`).toString("base64");
    } else {
      body.set("client_secret", p.clientSecret);
    }
    const r = await fetch(p.tokenUrl, { method: "POST", headers, body });
    const data = await r.json();
    if (!r.ok) return res.status(r.status).json(data);
    res.json(data); // { access_token, refresh_token, expires_in, ... }
  } catch (err) {
    res.status(502).json({ error: err.message });
  }
});

// --- 3. Datos diarios normalizados al esquema del pipeline ---
app.get("/api/:provider/daily", async (req, res) => {
  const p = getProvider(req, res);
  if (!p) return;
  const token = req.headers.authorization?.replace(/^Bearer\s+/i, "");
  if (!token) return res.status(401).json({ error: "Falta header Authorization: Bearer <token>" });
  const days = Math.min(90, Math.max(1, parseInt(req.query.days, 10) || 30));

  try {
    let rows;
    if (req.params.provider === "fitbit") {
      rows = await fetchFitbitDaily(p, token, days);
    } else if (req.params.provider === "google") {
      rows = await fetchGoogleDaily(p, token, days);
    } else {
      rows = await fetchWhoopDaily(p, token, days);
    }
    res.json({ provider: req.params.provider, days: rows.length, rows });
  } catch (err) {
    const status = err.status || 502;
    res.status(status).json({ error: err.message });
  }
});

// --- Fetchers por proveedor (crudo -> normalizado) ---
async function apiGet(url, token) {
  const r = await fetch(url, { headers: { Authorization: `Bearer ${token}` } });
  if (!r.ok) {
    const e = new Error(`${url} -> HTTP ${r.status}`);
    e.status = r.status;
    throw e;
  }
  return r.json();
}

function isoDaysAgo(n) {
  const d = new Date();
  d.setDate(d.getDate() - n);
  return d.toISOString().slice(0, 10);
}

async function fetchFitbitDaily(p, token, days) {
  const start = isoDaysAgo(days);
  const end = isoDaysAgo(0);
  // Endpoints diarios de Fitbit (Web API 1.2)
  const [hrv, rhr, sleep, resp, temp] = await Promise.all([
    apiGet(`${p.apiBase}/1/user/-/hrv/date/${start}/${end}.json`, token),
    apiGet(`${p.apiBase}/1/user/-/activities/heart/date/${start}/${end}.json`, token),
    apiGet(`${p.apiBase}/1.2/user/-/sleep/date/${start}/${end}.json`, token),
    apiGet(`${p.apiBase}/1/user/-/br/date/${start}/${end}.json`, token).catch(() => null),
    apiGet(`${p.apiBase}/1/user/-/temp/skin/date/${start}/${end}.json`, token).catch(() => null),
  ]);
  return normalizeFitbit({ hrv, rhr, sleep, resp, temp });
}

async function fetchWhoopDaily(p, token, days) {
  const start = new Date(Date.now() - days * 864e5).toISOString();
  const collect = async (path, key) => {
    let out = [];
    let next = undefined;
    do {
      const url = new URL(`${p.apiBase}${path}`);
      if (next) url.searchParams.set("nextToken", next);
      else { url.searchParams.set("start", start); url.searchParams.set("limit", "25"); }
      const page = await apiGet(url.toString(), token);
      out = out.concat(page.records || []);
      next = page.next_token;
    } while (next);
    return out;
  };
  const [recovery, sleep, cycles] = await Promise.all([
    collect("/v2/recovery", "records"),
    collect("/v2/activity/sleep", "records"),
    collect("/v2/cycle", "records"),
  ]);
  return normalizeWhoop({ recovery: { records: recovery }, sleep: { records: sleep }, cycles: { records: cycles } });
}

// Google Fit REST API (best-effort, en proceso de cierre).
// Los datos de frecuencia cardiaca/sueño/respiracion se leen como "data sources"
// + "dataset" con timestamps en nanosegundos. Se mapea al esquema canonico.
async function fetchGoogleDaily(p, token, days) {
  const endNs = Date.now() * 1e6;
  const startNs = (Date.now() - days * 864e5) * 1e6;
  const ds = (dataType) =>
    `${p.apiBase}/users/me/dataSources?dataTypeName=${encodeURIComponent(dataType)}`;
  const dataset = (srcId, agg) =>
    `${p.apiBase}/users/me/dataSources/${encodeURIComponent(srcId)}/datasets/${startNs}-${endNs}` +
    (agg ? `?limit=1&aggregateBy=${encodeURIComponent(JSON.stringify([{ dataTypeName: agg }]))}&bucketByTime=1d` : "");

  // Descubrir data sources disponibles por tipo
  const types = {
    hrv: "com.google.heart_rate.variability.rmssd",
    rhr: "com.google.heart_rate.bpm",
    sleep: "com.google.sleep.segment",
    resp: "com.google.respiratory.rate",
  };
  const sources = {};
  for (const [k, t] of Object.entries(types)) {
    try {
      const j = await apiGet(ds(t), token);
      sources[k] = j.dataSource || [];
    } catch { sources[k] = []; }
  }
  // Google Fit no expone HRV/RHR/sueño como series diarias listas; esto es
  // best-effort y puede devolver vacio si la API fue desactivada.
  return normalizeGoogle({ sources, token, p, startNs, endNs, dataset });
}

app.listen(PORT, () => {
  console.log(`[biopulse-proxy] escuchando en http://localhost:${PORT}`);
  console.log(`[biopulse-proxy] salud: http://localhost:${PORT}/api/health`);
});
