// ============================================================
// useLogs.js — estado de logs de hábitos/sustancias del usuario.
// Sincroniza con /api/log (Upstash) y respalda en localStorage.
// Mismo patrón que useAuth (perfil). No toca el flujo CSV.
// ============================================================
import { useCallback, useEffect, useRef, useState } from "react";
import { useAuth } from "./useAuth.js";

const LOGS_KEY = "biopulse-logs"; // respaldo local (misma clave que usa la app)

function api(path, opts = {}) {
  const res = Promise.resolve();
  return fetch(path, {
    headers: { "Content-Type": "application/json", ...(opts.headers || {}) },
    ...opts,
  }).then(async (r) => {
    const data = await r.json().catch(() => ({}));
    if (!r.ok) throw new Error(data.error || "Error de red");
    return data;
  });
}

export function useLogs() {
  const { token, status } = useAuth();
  const [logs, setLogs] = useState(() => {
    try { return JSON.parse(localStorage.getItem(LOGS_KEY) || "[]"); } catch { return []; }
  });
  const [loaded, setLoaded] = useState(false);
  const [syncing, setSyncing] = useState(false);
  const saveLocal = useRef((l) => { try { localStorage.setItem(LOGS_KEY, JSON.stringify(l)); } catch {} });

  const load = useCallback(async () => {
    if (!token) { setLoaded(true); return; }
    setSyncing(true);
    try {
      const data = await api("/api/log", { headers: { Authorization: `Bearer ${token}` } });
      const arr = Array.isArray(data.logs) ? data.logs : [];
      setLogs(arr);
      saveLocal.current(arr);
    } catch {
      // usa respaldo local si falla la red
    } finally { setSyncing(false); setLoaded(true); }
  }, [token]);

  // Cargar al montar / al loguearse
  useEffect(() => {
    if (status === "ready") load();
    // eslint-disable-next-line
  }, [status, token]);

  const persist = useCallback(async (next) => {
    setLogs(next);
    saveLocal.current(next);
    if (!token) return;
    try {
      await api("/api/log", {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
        body: JSON.stringify({ logs: next }),
      });
    } catch { /* respaldo local ya guardado */ }
  }, [token]);

  const addLog = useCallback(async (entry) => {
    const e = {
      id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      ts: entry.ts || new Date().toISOString(),
      preset: entry.preset || "custom",
      label: entry.label || entry.preset || "Personalizado",
      category: entry.category || "otro",
      unit: entry.unit || "",
      amount: Number.isFinite(+entry.amount) ? +entry.amount : 1,
      note: entry.note || "",
    };
    await persist([...logs, e]);
    return e;
  }, [logs, persist]);

  const removeLog = useCallback(async (id) => {
    await persist(logs.filter((l) => l.id !== id));
  }, [logs, persist]);

  const clearLogs = useCallback(async () => { await persist([]); }, [persist]);

  return { logs, addLog, removeLog, clearLogs, load, loaded, syncing };
}
