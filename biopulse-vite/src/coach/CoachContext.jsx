// ============================================================
// CoachContext — (A2) Provider que mantiene el chat del coach
// VIVO Y PERSISTENTE entre todas las pestañas (no se desmonta).
// Montado una sola vez en App (hermano de TabBar), asi el historial
// y el estado open/close sobreviven al cambio de tab.
//
// Expone: { messages, open(), close(), toggle(), send(text), busy,
//           aiConnected, tab, setTab, notice }.
//
// Conecta con el backend Vercel (api/coach.js) vía streaming (C2):
// lee un stream SSE/NDJSON y va "escribiendo" la respuesta letra por
// letra. Si no hay API key (modo local) o falla, cae al motor local
// (coachEngine.js) sin romper la UX.
// ============================================================
import React, { createContext, useContext, useState, useRef, useCallback, useEffect } from "react";
import { getLocalAdvice, getLocalReply } from "./coachEngine.js";

const CoachCtx = createContext(null);
export const useCoach = () => {
  const ctx = useContext(CoachCtx);
  if (!ctx) throw new Error("useCoach debe usarse dentro de <CoachProvider>");
  return ctx;
};

// Tab -> contexto para el system prompt del backend (D2).
export const COACH_TAB_CTX = {
  inicio: "La pantalla actual es Inicio (Dashboard): el usuario ve su BioScore, Score de riesgo y métricas del día. Habla de su estado general y plan de hoy.",
  live: "La pantalla actual es Live (en vivo): el usuario ve frecuencia cardíaca, strain y respiración en tiempo real. Comenta la intensidad y cuándo ajustar.",
  datos: "La pantalla actual es Datos: el usuario registra hábitos/sustancias, ve su zona de esfuerzo, análisis de correlación y glosario.",
  sleep: "La pantalla actual es Sueño: el usuario ve su Sleep Score, horas, eficiencia y despertares. Ayúdalo a interpretar y mejorar su descanso.",
  tech: "La pantalla actual es Técnico: el usuario ve el modelo heurístico del índice (z-scores, ApEn, fatiga, infección). Explica el modelo en lenguaje claro.",
  config: "La pantalla actual es Ajustes: el usuario configura fuente de datos (Whoop/Apple/Garmin/CSV) y tema. Ayúdalo con conexión de dispositivos y privacidad.",
};

// Chips contextuales por pantalla (D2): atajos de preguntas coherentes.
export const COACH_CHIPS = {
  inicio: ["Interpreta mis métricas de hoy", "¿Qué significa mi riesgo?", "Dame un plan de hoy"],
  live: ["¿Qué dice mi FC ahora?", "¿Subo o bajo la intensidad?", "¿Cuánto falta para recuperar?"],
  datos: ["¿Cómo afecta el alcohol?", "Explícame mi zona de esfuerzo", "¿Qué me baja el HRV?"],
  sleep: ["Explica mi sueño de anoche", "¿Cómo mejoro el sueño profundo?", "¿Por qué me desperté?"],
  tech: ["Explica el modelo en simple", "¿Por qué no es diagnóstico?", "¿Qué es ApEn en mi HRV?"],
  config: ["¿Cómo conecto mi Whoop?", "¿Es seguro mis datos?", "¿Cómo subo un CSV?"],
};

const COACH_API = import.meta.env.VITE_COACH_API || "/api/coach";

// Saludo inicial del día (modo local, inmediato, sin esperar red).
function openingMessage(today) {
  const a = getLocalAdvice(today || {});
  return { role: "coach", text: (a.title ? a.title + ". " : "") + a.advice, source: a.source };
}

export function CoachProvider({ children, today, logs = [] }) {
  const [messages, setMessages] = useState(() => [openingMessage(today)]);
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const [notice, setNotice] = useState(null);
  const [aiConnected, setAiConnected] = useState(false);
  const [tab, setTabState] = useState("inicio");
  const [logsState, setLogsState] = useState(logs || []);
  useEffect(() => { if (logs && logs.length) setLogsState(logs); }, [logs]);
  const todayRef = useRef(today);
  todayRef.current = today;
  const logsRef = useRef(logs || []);
  logsRef.current = logs;

  // Mejora el saludo con Groq al montar (sin bloquear), igual que antes.
  useEffect(() => {
    let alive = true;
    const enhance = async () => {
      try {
        const ctrl = new AbortController();
        const to = setTimeout(() => ctrl.abort(), 4000);
        const res = await fetch(COACH_API, {
          method: "POST", headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ metrics: todayRef.current || {}, tab }), signal: ctrl.signal,
        });
        clearTimeout(to);
        if (!res.ok) return;
        const j = await res.json();
        if (j && j.advice && j.advice.length > 10 && alive) {
          const [title, ...rest] = j.advice.split("||");
          setMessages([{ role: "coach", text: (title ? title.trim() + ". " : "") + (rest.join("||") || j.advice).trim(), source: "llm" }]);
          setAiConnected(true);
        }
      } catch { /* queda el local */ }
    };
    enhance();
    return () => { alive = false; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const setTab = useCallback((t) => setTabState(t), []);
  const openCoach = useCallback(() => setOpen(true), []);
  const closeCoach = useCallback(() => setOpen(false), []);
  const toggleCoach = useCallback(() => setOpen((o) => !o), []);

  // Envía un mensaje: intenta streaming Groq; si falla, fallback local.
  const send = useCallback(async (rawText) => {
    const text = (rawText || "").toString().trim();
    if (!text || busy) return;
    if (text.length > 280) { setNotice("Mensaje demasiado largo (máx 280)."); return; }

    const history = messages.map((m) => ({ role: m.role === "user" ? "user" : "model", text: m.text }));
    setMessages((m) => [...m, { role: "user", text }]);
    setNotice(null);
    setBusy(true);

    // Placeholder de respuesta que se va llenando con el stream.
    let streamingId = Date.now();
    const appendCoach = (chunk) => {
      if (!chunk) return;
      setMessages((m) => {
        const copy = m.slice();
        const last = copy[copy.length - 1];
        // Anti-eco: si el modelo repite lo ya escrito (o lo tiene al final), ignorar.
        if (last && last.__streaming === streamingId && last.text.endsWith(chunk)) return m;
        if (last && last.__streaming === streamingId) {
          copy[copy.length - 1] = { role: "coach", text: last.text + chunk, __streaming: streamingId, source: "groq" };
        } else {
          copy.push({ role: "coach", text: chunk, __streaming: streamingId, source: "groq" });
        }
        return copy;
      });
    };

    const fallbackLocal = () => {
      const fb = getLocalReply(todayRef.current || {}, text, logsRef.current || []);
      // Reemplaza el placeholder vacío si el stream no produjo nada.
      setMessages((m) => {
        const copy = m.slice();
        const last = copy[copy.length - 1];
        if (last && last.__streaming === streamingId && last.text.length === 0) copy.pop();
        return [...copy, { role: "coach", text: fb, source: "local" }];
      });
      setAiConnected(false);
    };

    try {
      const ctrl = new AbortController();
      const to = setTimeout(() => ctrl.abort(), 15000);
      const res = await fetch(COACH_API, {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ metrics: todayRef.current || {}, message: text, history, tab, logs: logsRef.current || [] }),
        signal: ctrl.signal,
      });
      clearTimeout(to);

      if (res.status === 429) { setNotice("Demasiadas preguntas. Espera un momento."); setBusy(false); return; }
      if (res.status === 400) { const j = await res.json().catch(() => ({})); setNotice(j.error || "No pude procesar eso."); setBusy(false); return; }

      const ct = res.headers.get("Content-Type") || "";
      if (ct.includes("text/event-stream") && res.body) {
        // ----- STREAMING (C2): leemos SSE/NDJSON -----
        const reader = res.body.getReader();
        const decoder = new TextDecoder();
        let buf = "";
        let got = false;
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          buf += decoder.decode(value, { stream: true });
          // Líneas tipo "data: {json}" o JSON por línea.
          let idx;
          while ((idx = buf.indexOf("\n")) >= 0) {
            const line = buf.slice(0, idx).trim();
            buf = buf.slice(idx + 1);
            if (!line) continue;
            const payload = line.startsWith("data:") ? line.slice(5).trim() : line;
            try {
              const j = JSON.parse(payload);
              if (j.chunk) { appendCoach(j.chunk); got = true; }
              if (j.done) { /* fin */ }
            } catch { /* ignora lineas parciales */ }
          }
        }
        if (got) setAiConnected(true);
        else fallbackLocal();
      } else {
        // ----- FALLBACK JSON (backend sin streaming o sin API key) -----
        const j = await res.json().catch(() => ({}));
        if (j && j.reply && j.reply.length) {
          setMessages((m) => [...m, { role: "coach", text: j.reply, source: j.source }]);
          if (j.source === "groq") setAiConnected(true);
        } else {
          // Si el backend indica por qué cayó a local, lo mostramos (diagnóstico).
          if (j && j.reason) setNotice(j.reason + ". El Coach usa el motor local hasta configurarla.");
          fallbackLocal();
        }
      }
    } catch {
      fallbackLocal();
    } finally {
      setBusy(false);
    }
  }, [busy, messages]);

  const value = {
    messages: messages.map(({ __streaming, ...rest }) => rest),
    open, openCoach, closeCoach, toggleCoach,
    send, busy, notice, aiConnected, tab, setTab,
  };
  return <CoachCtx.Provider value={value}>{children}</CoachCtx.Provider>;
}
