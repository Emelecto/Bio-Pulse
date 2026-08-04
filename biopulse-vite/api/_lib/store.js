// ============================================================
// api/_lib/store.js — almacenamiento de usuarios para auth.
// Prioridad: Vercel KV (REST) si hay env KV_REST_API_URL+TOKEN.
// Fallback: archivo JSON en /tmp (demo local / serverless efimero).
// Interfaz: getByEmail, putUser, updateProfile. Los datos del perfil
// de salud viven ASOCIADOS al usuario (campo profile).
// ============================================================
const FS = await import("node:fs/promises");
const PATH = "/tmp/biopulse-users.json";

let kvAvailable = false;
const KV_URL = process.env.KV_REST_API_URL;
const KV_TOKEN = process.env.KV_REST_API_TOKEN;

async function kvGet(key) {
  const r = await fetch(`${KV_URL}/get/${encodeURIComponent(key)}`, { headers: { Authorization: `Bearer ${KV_TOKEN}` } });
  const j = await r.json();
  return j.result; // null si no existe
}
async function kvSet(key, value) {
  await fetch(`${KV_URL}/set/${encodeURIComponent(key)}`, {
    method: "POST",
    headers: { Authorization: `Bearer ${KV_TOKEN}`, "Content-Type": "application/json" },
    body: JSON.stringify({ value }),
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
