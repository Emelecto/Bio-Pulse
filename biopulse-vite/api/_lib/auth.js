// ============================================================
// api/_lib/auth.js — helpers de autenticacion (Node 20+, sin deps).
// Password: PBKDF2-SHA256 (Web Crypto, nativo). Token: HMAC-SHA256 firmado.
// NO depende de servicios externos; usa AUTH_SECRET de env vars.
// ============================================================
const AUTH_SECRET = process.env.AUTH_SECRET || "dev-only-insecure-secret-change-me";

function b64url(buf) {
  return Buffer.from(buf).toString("base64").replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}
function b64urlStr(s) {
  return Buffer.from(s, "utf8").toString("base64").replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}
function fromB64url(s) {
  s = s.replace(/-/g, "+").replace(/_/g, "/");
  while (s.length % 4) s += "=";
  return Buffer.from(s, "base64");
}

// PBKDF2 con sal aleatoria -> "pbkdf2$iter$salt$hash"
export async function hashPassword(password) {
  const enc = new TextEncoder();
  const salt = crypto.getRandomValues(new Uint8Array(16));
  const iter = 100000;
  const key = await crypto.subtle.deriveKey(
    { name: "PBKDF2", salt, iterations: iter, hash: "SHA-256" },
    await crypto.subtle.importKey("raw", enc.encode(password), "raw", false, ["deriveKey"]),
    { name: "HMAC", hash: "SHA-256", length: 256 },
    false,
    ["sign"]
  );
  const raw = await crypto.subtle.exportKey("raw", key);
  return `pbkdf2$${iter}$${b64url(salt)}$${b64url(raw)}`;
}

export async function verifyPassword(password, stored) {
  try {
    const [scheme, iterStr, saltB64, hashB64] = stored.split("$");
    if (scheme !== "pbkdf2") return false;
    const enc = new TextEncoder();
    const salt = fromB64url(saltB64);
    const key = await crypto.subtle.deriveKey(
      { name: "PBKDF2", salt, iterations: Number(iterStr), hash: "SHA-256" },
      await crypto.subtle.importKey("raw", enc.encode(password), "raw", false, ["deriveKey"]),
      { name: "HMAC", hash: "SHA-256", length: 256 },
      false,
      ["sign"]
    );
    const raw = await crypto.subtle.exportKey("raw", key);
    const got = b64url(raw);
    // comparacion constante (timing-safe)
    const a = fromB64url(got), b = fromB64url(hashB64);
    if (a.length !== b.length) return false;
    let diff = 0;
    for (let i = 0; i < a.length; i++) diff |= a[i] ^ b[i];
    return diff === 0;
  } catch {
    return false;
  }
}

// Token: payload(JSON) + "." + firmaHMAC(payload, AUTH_SECRET)
export function signToken(payload, ttlSeconds = 60 * 60 * 24 * 30) {
  const body = { ...payload, exp: Math.floor(Date.now() / 1000) + ttlSeconds };
  const data = b64urlStr(JSON.stringify(body));
  const sig = b64url(crypto.createHmac("sha256", AUTH_SECRET).update(data).digest());
  return `${data}.${sig}`;
}

export function verifyToken(token) {
  if (!token || typeof token !== "string" || !token.includes(".")) return null;
  const [data, sig] = token.split(".");
  const expected = b64url(crypto.createHmac("sha256", AUTH_SECRET).update(data).digest());
  if (sig !== expected) return null;
  try {
    const body = JSON.parse(fromB64url(data).toString("utf8"));
    if (body.exp && body.exp < Math.floor(Date.now() / 1000)) return null;
    return body;
  } catch {
    return null;
  }
}
