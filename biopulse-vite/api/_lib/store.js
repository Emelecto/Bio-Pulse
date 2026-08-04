// ============================================================
// api/_lib/store.js — almacenamiento de usuarios para auth.
// Prioridad: Vercel KV (REST) si hay env KV_REST_API_URL+TOKEN.
// Fallback: archivo JSON en /tmp (demo local / serverless efimero).
// Interfaz: getByEmail, putUser, updateProfile. Los datos del perfil
// de salud viven ASOCIADOS al usuario (campo profile).
// ============================================================
const FS = await import("node:fs/promises");
const OS = await import("node:os");
const PATH = OS.tmpdir() + "/biopulse-users.json";

let kvAvailable = false;
// Acepta tanto Vercel KV como Upstash Redis (mismo API REST GET/SET).
// Vercel KV inyecta KV_REST_API_URL/TOKEN; Upstash inyecta
// UPSTASH_REDIS_REST_URL/TOKEN. Usamos el que exista.
const KV_URL = process.env.KV_REST_API_URL || process.env.UPSTASH_REDIS_REST_URL || process.env.UPSTASH_REDIS_URL;
const KV_TOKEN = process.env.KV_REST_API_TOKEN || process.env.UPSTASH_REDIS_REST_TOKEN || process.env.UPSTASH_REDIS_TOKEN;

export { kvAvailable, KV_URL };

async function kvGet(key) {
  const r = await fetch(`${KV_URL}/get/${encodeURIComponent(key)}`, { headers: { Authorization: `Bearer ${KV_TOKEN}` } });
  const j = await r.json();
  let v = j.result;
  // Upstash REST devuelve el valor como STRING; Vercel KV puede devolver
  // objeto. Parseamos si es string para unificar ambos backends.
  if (typeof v === "string") {
    try { v = JSON.parse(v); } catch { /* dejar como esta */ }
  }
  return v || null;
}
async function kvSet(key, value) {
  // Guardamos SIEMPRE como string JSON para compatibilidad KV/Upstash.
  await fetch(`${KV_URL}/set/${encodeURIComponent(key)}`, {
    method: "POST",
    headers: { Authorization: `Bearer ${KV_TOKEN}`, "Content-Type": "application/json" },
    body: JSON.stringify(value),
  });
}

async function fsGetAll() {
  try {
    const t = await FS.readFile(PATH, "utf8");
    return JSON.parse(t);
  } catch {
    return {};
  }
}
async function fsSetAll(obj) {
  await FS.writeFile(PATH, JSON.stringify(obj, null, 2));
}

function init() {
  kvAvailable = !!(KV_URL && KV_TOKEN);
}
init();

export async function getByEmail(email) {
  const key = `user:${email.toLowerCase()}`;
  if (kvAvailable) return await kvGet(key);
  const all = await fsGetAll();
  return all[key] || null;
}

export async function putUser(email, record) {
  const key = `user:${email.toLowerCase()}`;
  if (kvAvailable) {
    await kvSet(key, record);
    return;
  }
  const all = await fsGetAll();
  all[key] = record;
  await fsSetAll(all);
}

export async function updateProfile(email, profile) {
  const rec = await getByEmail(email);
  if (!rec) return null;
  rec.profile = profile;
  await putUser(email, rec);
  return rec;
}

// Devuelve solo la PREGUNTA de recuperacion (nunca la respuesta).
export async function getRecoveryQuestion(email) {
  const rec = await getByEmail(email);
  return rec && rec.recoveryQ ? rec.recoveryQ : null;
}

// Actualiza el hash de contrasena tras un reset valido.
export async function updatePassword(email, pwHash) {
  const rec = await getByEmail(email);
  if (!rec) return null;
  rec.pwHash = pwHash;
  await putUser(email, rec);
  return rec;
}
