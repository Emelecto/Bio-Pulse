// ============================================================
// useAuth — estado de sesion (Camino A: backend Vercel).
// Persiste el token en localStorage. Recuerda si el usuario eligio
// "Usar datos demo" (flag biopulse-auth-skipped) para no volver a
// mostrar el onboarding en cada arranque.
// Expone: token, user{email}, profile, status('loading'|'ready'),
//         skipped, booted, login, register, logout, skip, saveProfile.
// ============================================================
import { useState, useEffect, useCallback } from "react";

const TOKEN_KEY = "biopulse-auth-token";
const SKIP_KEY = "biopulse-auth-skipped";
const PROFILE_KEY = "biopulse-profile"; // respaldo local del perfil (misma clave que useBiopulseData)

async function api(path, opts = {}) {
  const res = await fetch(path, {
    headers: { "Content-Type": "application/json", ...(opts.headers || {}) },
    ...opts,
  });
  let data = {};
  try { data = await res.json(); } catch {}
  if (!res.ok) throw new Error(data.error || "Error de red");
  return data;
}

export function useAuth() {
  const [token, setToken] = useState(null);
  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState(() => {
    try { return JSON.parse(localStorage.getItem(PROFILE_KEY) || "null"); } catch { return null; }
  });
  const [status, setStatus] = useState("loading");
  const [skipped, setSkipped] = useState(false);
  const [booted, setBooted] = useState(false);

  useEffect(() => {
    (async () => {
      const t = localStorage.getItem(TOKEN_KEY);
      if (t) {
        try {
          const data = await api("/api/profile", { headers: { Authorization: `Bearer ${t}` } });
          setToken(t);
          setUser({ email: emailFromToken(t) || "usuario" });
          // Usa el perfil del backend; si viene vacio, cae al respaldo local.
          const p = data.profile || JSON.parse(localStorage.getItem(PROFILE_KEY) || "null");
          setProfile(p);
          if (p) localStorage.setItem(PROFILE_KEY, JSON.stringify(p));
          setStatus("ready");
        } catch {
          localStorage.removeItem(TOKEN_KEY);
          setSkipped(!!localStorage.getItem(SKIP_KEY));
          setStatus("ready");
        }
      } else {
        setSkipped(!!localStorage.getItem(SKIP_KEY));
        setStatus("ready");
      }
      setBooted(true);
    })();
  }, []);

  const register = useCallback(async (email, password, prof, recovery) => {
    const data = await api("/api/register", {
      method: "POST",
      body: JSON.stringify({ email, password, profile: prof, recovery }),
    });
    localStorage.setItem(TOKEN_KEY, data.token);
    localStorage.removeItem(SKIP_KEY);
    setToken(data.token);
    setUser({ email: email.toLowerCase() });
    setProfile(data.profile || null);
    if (data.profile) localStorage.setItem(PROFILE_KEY, JSON.stringify(data.profile));
    setSkipped(false);
    return data;
  }, []);

  const login = useCallback(async (email, password) => {
    const data = await api("/api/login", {
      method: "POST",
      body: JSON.stringify({ email, password }),
    });
    localStorage.setItem(TOKEN_KEY, data.token);
    localStorage.removeItem(SKIP_KEY);
    setToken(data.token);
    setUser({ email: email.toLowerCase() });
    setProfile(data.profile || null);
    if (data.profile) localStorage.setItem(PROFILE_KEY, JSON.stringify(data.profile));
    setSkipped(false);
    return data;
  }, []);

  const saveProfile = useCallback(async (prof) => {
    if (prof) localStorage.setItem(PROFILE_KEY, JSON.stringify(prof));
    if (!token) { setProfile(prof); return; }
    try {
      const data = await api("/api/profile", {
        method: "PUT",
        headers: { Authorization: `Bearer ${token}` },
        body: JSON.stringify({ profile: prof }),
      });
      setProfile(data.profile || prof);
    } catch { setProfile(prof); }
  }, [token]);

  const logout = useCallback(() => {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(SKIP_KEY);
    localStorage.removeItem(PROFILE_KEY);
    setToken(null); setUser(null); setProfile(null); setSkipped(false);
  }, []);

  // "Usar datos demo": no hay cuenta; recordamos la eleccion para no poppear.
  const skip = useCallback(() => {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.setItem(SKIP_KEY, "1");
    localStorage.removeItem(PROFILE_KEY);
    setToken(null); setUser(null); setProfile(null); setSkipped(true);
  }, []);

  // --- Recuperacion de contrasena (pregunta de seguridad) ---
  const requestRecoveryQuestion = useCallback(async (email) => {
    const data = await api(`/api/recovery-question?email=${encodeURIComponent(email)}`);
    return data.question;
  }, []);
  const requestReset = useCallback(async (email, answer, code) => {
    const body = { email };
    if (code != null) body.code = code; else body.answer = answer;
    const data = await api("/api/reset-request", {
      method: "POST",
      body: JSON.stringify(body),
    });
    return data.resetToken; // token HMAC de 15 min para confirmar
  }, []);
  const confirmReset = useCallback(async (resetToken, newPassword) => {
    await api("/api/reset-confirm", {
      method: "POST",
      body: JSON.stringify({ resetToken, newPassword }),
    });
  }, []);

  return { token, user, profile, status, skipped, booted, login, register, logout, skip, saveProfile,
    requestRecoveryQuestion, requestReset, confirmReset };
}

function emailFromToken(t) {
  try {
    const data = t.split(".")[0];
    const json = JSON.parse(atob(data.replace(/-/g, "+").replace(/_/g, "/")));
    return json.email;
  } catch { return null; }
}
