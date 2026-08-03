// ============================================================
// TAB DASHBOARD — bienvenida con medidor principal configurable,
// métricas secundarias y el COACH ASISTENTE DE IA.
// ============================================================
import React, { useMemo, useState, useEffect } from "react";
import { Moon, Footprints, Flame, Heart, Wind, BatteryMedium, Activity, AlertTriangle, Info, Settings2, Sparkles } from "lucide-react";
import { C, riskColor, MetricCard, SectionHeader } from "./ui.jsx";
import BioScoreRing from "./BioScoreRing.jsx";
import { getLocalAdvice, getLocalReply } from "../coach/coachEngine.js";

// Métricas que el usuario puede poner en el medidor principal.
const PRIMARY_OPTIONS = [
  { key: "riskScore", label: "Riesgo", icon: Activity, color: C.rose, get: (t) => t.riskScore, unit: "/100", fmt: (v) => v },
  { key: "sleepScore", label: "Sueño", icon: Moon, color: C.teal, get: (t) => t.sleepScore, unit: "/100", fmt: (v) => v },
  { key: "fatigueScore", label: "Fatiga", icon: Flame, color: C.amber, get: (t) => t.fatigueScore, unit: "/100", fmt: (v) => v },
  { key: "recovery", label: "Recuperación", icon: BatteryMedium, color: C.teal, get: (t) => t.recovery, unit: "%", fmt: (v) => v },
  { key: "stressScore", label: "Estrés", icon: Wind, color: C.purple, get: (t) => t.stressScore, unit: "/100", fmt: (v) => v },
];

const SECONDARY_METRICS = [
  { key: "hrv", label: "HRV", icon: Heart, unit: "ms", color: C.teal },
  { key: "rhr", label: "RHR", icon: Activity, unit: "bpm", color: C.purple },
  { key: "vo2max", label: "VO2 max", icon: Flame, unit: "ml/kg", color: C.amber, get: (t) => Math.round(42 + (t.recovery - 60) * 0.3 + (t.hrv - 42) * 0.2) },
  { key: "resp", label: "Frec. respiratoria", icon: Wind, unit: "rpm", color: C.purple },
  { key: "steps", label: "Pasos", icon: Footprints, unit: "", color: C.purple },
  { key: "sleepHours", label: "Horas sueño", icon: Moon, unit: "h", color: C.teal },
];

export default function Dashboard({ data, today, riskThreshold, onOpenSettings, onOpenCoachSettings }) {
  const [primary, setPrimary] = useState("riskScore");
  const [visibleSecondary, setVisibleSecondary] = useState(SECONDARY_METRICS.map((m) => m.key));

  // COACH CHAT: consejo automatico inicial (siempre visible) + chat con Gemini.
  // Mensajes: [{role:'coach'|'user', text}]. El primer mensaje es el consejo del dia.
  const [messages, setMessages] = useState(() => {
    const a = getLocalAdvice(today);
    return [{ role: "coach", text: (a.title ? a.title + ". " : "") + a.advice, source: a.source }];
  });
  const [input, setInput] = useState("");
  const [busy, setBusy] = useState(false);
  const [notice, setNotice] = useState(null); // errores/limites
  const [aiConnected, setAiConnected] = useState(false); // Gemini activo?

  // Mejora el primer mensaje con Gemini si responde a tiempo (sin bloquear UI).
  useEffect(() => {
    let alive = true;
    const enhance = async () => {
      try {
        const base = import.meta.env.VITE_COACH_API || "/api/coach";
        const ctrl = new AbortController();
        const to = setTimeout(() => ctrl.abort(), 4000);
        const res = await fetch(base, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ metrics: today }),
          signal: ctrl.signal,
        });
        clearTimeout(to);
        if (!res.ok) return;
        const j = await res.json();
        if (j && j.advice && j.advice.length > 10 && alive) {
          const [title, ...rest] = j.advice.split("||");
          setMessages([{ role: "coach", text: (title ? title.trim() + ". " : "") + (rest.join("||") || j.advice).trim(), source: "llm" }]);
          setAiConnected(true);
        }
      } catch { /* silencioso: se queda el local */ }
    };
    enhance();
    return () => { alive = false; };
  }, [today]);

  const sendMessage = async () => {
    const text = input.trim();
    if (!text || busy) return;
    if (text.length > 280) { setNotice("Mensaje demasiado largo (máx 280)."); return; }
    const userMsg = { role: "user", text };
    const history = messages.map((m) => ({ role: m.role === "user" ? "user" : "model", text: m.text }));
    setMessages((m) => [...m, userMsg]);
    setInput("");
    setBusy(true);
    setNotice(null);
    try {
      const base = import.meta.env.VITE_COACH_API || "/api/coach";
      const ctrl = new AbortController();
      const to = setTimeout(() => ctrl.abort(), 8000);
      const res = await fetch(base, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ metrics: today, message: text, history }),
        signal: ctrl.signal,
      });
      clearTimeout(to);
      const j = await res.json();
      if (res.status === 429) { setNotice("Demasiadas preguntas. Espera un momento."); }
      else if (res.status === 400 && j.error) { setNotice(j.error); }
      else if (j && j.reply && j.reply.length > 0) {
        setMessages((m) => [...m, { role: "coach", text: j.reply, source: j.source }]);
        if (j.source === "gemini") setAiConnected(true);
      } else {
        // Fallback local: usa el banco de consejos coherente con la pregunta + perfil.
        const fb = getLocalReply(today, text);
        setMessages((m) => [...m, { role: "coach", text: fb, source: "local" }]);
      }
    } catch {
      const fb = getLocalReply(today, text);
      setMessages((m) => [...m, { role: "coach", text: fb, source: "local" }]);
    } finally {
      setBusy(false);
    }
  };

  const primaryDef = PRIMARY_OPTIONS.find((p) => p.key === primary) || PRIMARY_OPTIONS[0];
  const primaryValue = primaryDef.get(today);
  const rColor = riskColor(today.riskLevel);

  const toggleSecondary = (k) => {
    setVisibleSecondary((cur) =>
      cur.includes(k) ? cur.filter((x) => x !== k) : [...cur, k]
    );
  };

  return (
    <div className="flex flex-col gap-5">
      {/* HERO: BioScore (bienestar, mayor = mejor) */}
      <div style={{ background: `linear-gradient(160deg, ${C.card}, ${C.bgSoft})`, border: `1px solid ${C.border}` }} className="rounded-3xl p-5 pt-4 relative overflow-hidden tab-fade-in">
        <div className="relative flex items-center justify-between mb-1">
          <span style={{ color: C.textFaint }} className="flex items-center gap-1 text-[11px] uppercase tracking-wider font-medium">
            <Sparkles size={11} /> BioScore
          </span>
        </div>
        <div className="relative flex flex-col items-center gap-2 pt-2">
          <BioScoreRing today={today} />
          <p style={{ color: C.textMuted }} className="text-[13px] leading-snug max-w-[18rem] text-center">
            {today.bioLevel === "BUENO" ? "Tu bienestar está alto. Mantén tus hábitos actuales." : today.bioLevel === "MEDIO" ? "Bienestar aceptable. Hay margen para mejorar tu recuperación." : "Bienestar bajo: prioriza descanso y sueño hoy."}
          </p>
        </div>
      </div>

      {/* SECCION RIESGO: score de riesgo (anomalias/fatiga), mas pequeña pero detallada */}
      <div style={{ background: C.card, border: `1px solid ${C.border}` }} className="rounded-3xl p-4 tab-fade-in">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <div style={{ background: `${rColor}1A`, color: rColor }} className="w-8 h-8 rounded-xl flex items-center justify-center">
              <AlertTriangle size={16} />
            </div>
            <div>
              <span style={{ color: C.text }} className="text-sm font-semibold block">Score de riesgo</span>
              <span style={{ color: C.textFaint }} className="text-[10px]">Fatiga / anomalías fisiológicas</span>
            </div>
          </div>
          <span style={{ color: rColor, background: `${rColor}1A`, border: `1px solid ${rColor}44` }} className="text-[11px] font-bold px-2.5 py-1 rounded-full tabular-nums">
            {today.riskScore}/100 · {today.riskLevel}
          </span>
        </div>
        {/* Barra de progreso del riesgo */}
        <div className="w-full h-2 rounded-full overflow-hidden" style={{ background: C.bgSoft }}>
          <div style={{ width: `${today.riskScore}%`, background: rColor }} className="h-full rounded-full transition-all duration-700" />
        </div>
        <p style={{ color: C.textMuted }} className="text-[12px] leading-snug mt-3">
          {today.riskLevel === "BAJO" ? "Sin señales de riesgo fuera de tu rango habitual." : "Detectamos señales fuera de tu rango habitual en los últimos días."}
        </p>
        {today.flags.length > 0 && (
          <div className="w-full mt-2 space-y-1">
            {today.flags.map((fl, i) => (
              <div key={i} className="flex items-start gap-1.5">
                <AlertTriangle size={13} style={{ color: C.amber }} className="mt-0.5 shrink-0" />
                <span style={{ color: C.amber }} className="text-[12px] leading-snug">{fl}</span>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* COACH CHAT ASISTENTE DE IA */}
      <div style={{ background: C.card, border: `1px solid ${C.teal}55` }} className="rounded-3xl p-4 tab-fade-in">
        <div className="flex items-center gap-2 mb-3">
          <div style={{ background: `${C.teal}1A`, color: C.teal }} className="w-8 h-8 rounded-xl flex items-center justify-center">
            <Sparkles size={16} />
          </div>
          <div>
            <span style={{ color: C.text }} className="text-sm font-semibold block">Coach BioPulse</span>
            <span style={{ color: aiConnected ? C.teal : C.textFaint }} className="text-[10px] flex items-center gap-1">
              <span style={{ width: 6, height: 6, borderRadius: 999, background: aiConnected ? C.teal : C.textFaint, display: "inline-block" }} />
              {aiConnected ? "IA conectada (Gemini)" : "Modo local · añade GOOG.le.ai API key para IA"}
            </span>
          </div>
        </div>

        {/* Historial de mensajes */}
        <div className="flex flex-col gap-2 max-h-72 overflow-y-auto mb-3 pr-1">
          {messages.map((m, i) => (
            <div key={i} className={`flex ${m.role === "user" ? "justify-end" : "justify-start"}`}>
              <div
                style={{
                  background: m.role === "user" ? C.teal : C.bgSoft,
                  color: m.role === "user" ? C.bg : C.text,
                  border: `1px solid ${m.role === "user" ? C.teal : C.border}`,
                }}
                className="text-[12.5px] leading-snug rounded-2xl px-3 py-2 max-w-[85%]"
              >
                {m.text}
              </div>
            </div>
          ))}
          {busy && (
            <div className="flex justify-start">
              <div style={{ background: C.bgSoft, border: `1px solid ${C.border}`, color: C.textFaint }} className="text-[12px] rounded-2xl px-3 py-2">
                Pensando…
              </div>
            </div>
          )}
        </div>

        {notice && (
          <div style={{ background: `${C.amber}14`, border: `1px solid ${C.amber}40` }} className="rounded-xl px-3 py-2 mb-2">
            <span style={{ color: C.amber }} className="text-[11.5px]">{notice}</span>
          </div>
        )}

        {/* Input de chat */}
        <div className="flex items-center gap-2">
          <input
            type="text"
            value={input}
            maxLength={280}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => { if (e.key === "Enter") sendMessage(); }}
            placeholder="Pregúntale sobre tus métricas…"
            style={{ background: C.bgSoft, border: `1px solid ${C.border}`, color: C.text }}
            className="flex-1 text-[13px] rounded-xl px-3 py-2.5 outline-none placeholder:text-[11px]"
          />
          <button
            onClick={sendMessage}
            disabled={busy || !input.trim()}
            style={{ background: C.teal, color: C.bg, opacity: (busy || !input.trim()) ? 0.5 : 1 }}
            className="w-10 h-10 rounded-xl flex items-center justify-center active:scale-95 transition-opacity shrink-0"
            aria-label="Enviar"
          >
            <Sparkles size={16} />
          </button>
        </div>
        <p style={{ color: C.textFaint }} className="text-[10px] mt-2">
          El coach interpreta tus métricas (HRV, sueño, recuperación…). No es consejo médico.
        </p>
      </div>

      {/* SECUNDARIAS */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <span style={{ color: C.textFaint }} className="text-[11px] uppercase tracking-wider font-medium">Métricas de hoy</span>
          <button onClick={onOpenSettings} style={{ color: C.textMuted }} className="text-[11px] flex items-center gap-1">
            <Settings2 size={11} /> Editar
          </button>
        </div>
        <div className="grid grid-cols-2 gap-3">
          {SECONDARY_METRICS.filter((m) => visibleSecondary.includes(m.key)).map((m) => {
            const val = m.get ? m.get(today) : today[m.key];
            return (
              <MetricCard key={m.key} icon={m.icon} label={m.label} value={val} unit={m.unit} accent={m.color}
                sparkData={data.slice(-7).map((d) => (m.get ? m.get(d) : d[m.key]))}
                delta={data.length > 8 ? (val - (m.get ? m.get(data[data.length - 8]) : data[data.length - 8][m.key])) : undefined} />
            );
          })}
        </div>
      </div>

      {/* Settings rápido de layout (medidor + secundarias) */}
      {onOpenCoachSettings && null}
    </div>
  );
}
