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
  const [profile, setProfile] = useState(null);
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
          setProfile(data.profile || null);
          setStatus("ready");
        } catch {
          localStorage.removeItem(TOKEN_KEY);
          // sin token valido: si habia elegido demo, no poppea; sino muestra onboarding
          setSkipped(!!localStorage.getItem(SKIP_KEY));
          setStatus("ready");
        } finally {
          setBooted(true);
        }
        return;
      }
      // sin token: ¿eligio demo antes?
      setSkipped(!!localStorage.getItem(SKIP_KEY));
      setStatus("ready");
      setBooted(true);
    })();
  }, []);

  const register = useCallback(async (email, password, prof) => {
    const data = await api("/api/register", {
      method: "POST",
      body: JSON.stringify({ email, password, profile: prof }),
    });
    localStorage.setItem(TOKEN_KEY, data.token);
    localStorage.removeItem(SKIP_KEY);
    setToken(data.token);
    setUser({ email: email.toLowerCase() });
    setProfile(data.profile || null);
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
    setSkipped(false);
    return data;
  }, []);

  const saveProfile = useCallback(async (prof) => {
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
    setToken(null); setUser(null); setProfile(null);
  }, []);

  // "Usar datos demo": no hay cuenta; recordamos la eleccion para no poppear.
  const skip = useCallback(() => {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.setItem(SKIP_KEY, "1");
    setToken(null); setUser(null); setProfile(null); setSkipped(true);
  }, []);

  return { token, user, profile, status, skipped, booted, login, register, logout, skip, saveProfile };
}

function emailFromToken(t) {
  try {
    const data = t.split(".")[0];
    const json = JSON.parse(atob(data.replace(/-/g, "+").replace(/_/g, "/")));
    return json.email;
  } catch { return null; }
}
