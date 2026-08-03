// ============================================================
// Coach — (B1) Botón flotante (FAB) SIEMPRE VISIBLE en las 5
// pantallas + bottom-sheet translúc. Conectado al CoachProvider
// (A2) para que el chat persista entre tabs. Respuesta por
// streaming (C2) y chips contextuales por pantalla (D2).
//
// Se monta UNA SOLA VEZ en App.jsx (hermano de TabBar), nunca
// dentro del contenido de tabs -> el historial nunca se pierde.
// ============================================================
import React, { useState, useEffect, useRef } from "react";
import { Sparkles, X, Send } from "lucide-react";
import { C } from "./ui.jsx";
import { useCoach, COACH_CHIPS } from "../coach/CoachContext.jsx";

const TAB_NAME = { dash: "Inicio", live: "Live (en vivo)", sleep: "Sueño", tech: "Técnico", config: "Ajustes" };

export default function Coach() {
  const { messages, open, openCoach, closeCoach, send, busy, notice, aiConnected, tab } = useCoach();
  const [input, setInput] = useState("");
  const messagesEndRef = useRef(null);
  const messagesBoxRef = useRef(null);
  const [chips, setChips] = useState(COACH_CHIPS[tab] || []);

  // Actualiza los chips según la pantalla activa (D2).
  useEffect(() => { setChips(COACH_CHIPS[tab] || []); }, [tab]);

  // Auto-scroll al final cuando llegan mensajes o mientras hace streaming.
  useEffect(() => {
    const box = messagesBoxRef.current;
    if (box) box.scrollTop = box.scrollHeight;
  }, [messages, busy, open]);

  const onSend = () => {
    const t = input.trim();
    if (!t || busy) return;
    send(t);
    setInput("");
  };

  const onChip = (c) => { if (!busy) send(c); };

  return (
    <>
      {/* FAB SIEMPRE VISIBLE */}
      <button
        onClick={openCoach}
        aria-label="Abrir Coach BioPulse"
        className="fixed z-40 active:scale-90 transition-transform"
        style={{
          right: "18px",
          bottom: "calc(86px + env(safe-area-inset-bottom))",
          width: "58px", height: "58px", borderRadius: "20px",
          background: `linear-gradient(150deg, ${C.teal}, #0fb3a6)`,
          color: "#04110f",
          boxShadow: `0 10px 30px ${C.teal}66`,
          border: "1px solid rgba(255,255,255,0.25)",
          display: open ? "none" : "flex", alignItems: "center", justifyContent: "center",
        }}
      >
        <span aria-hidden style={{ position: "absolute", inset: 0, borderRadius: "20px", border: `2px solid ${C.teal}`, animation: "coachPulse 2.4s infinite" }} />
        <Sparkles size={24} strokeWidth={2.2} />
      </button>

      {/* SCRIM */}
      <div
        onClick={closeCoach}
        className="fixed inset-0 z-40 bg-black/50 transition-opacity duration-300"
        style={{ opacity: open ? 1 : 0, pointerEvents: open ? "auto" : "none" }}
        aria-hidden={!open}
      />

      {/* BOTTOM-SHEET (glass iOS 26) */}
      <div
        role="dialog"
        aria-label="Coach BioPulse"
        className="fixed left-0 right-0 z-50 mx-auto glass"
        style={{
          bottom: 0, maxWidth: "28rem", height: "74%",
          borderTopLeftRadius: "28px", borderTopRightRadius: "28px",
          border: `1px solid rgba(255,255,255,0.14)`,
          background: `${C.bgSoft}F2`,
          transform: open ? "translateY(0)" : "translateY(102%)",
          transition: "transform 0.32s cubic-bezier(0.2,0.8,0.2,1)",
          display: "flex", flexDirection: "column", overflow: "hidden",
        }}
      >
        {/* Handle */}
        <div style={{ width: "38px", height: "4px", borderRadius: "999px", background: "rgba(255,255,255,0.25)", margin: "10px auto 4px" }} />

        {/* Header */}
        <div className="flex items-center gap-2.5 px-4 pb-2.5" style={{ borderBottom: `1px solid ${C.border}` }}>
          <div style={{ background: `${C.teal}1A`, color: C.teal }} className="w-8 h-8 rounded-xl flex items-center justify-center">
            <Sparkles size={16} />
          </div>
          <div className="min-w-0">
            <div style={{ color: C.text }} className="text-sm font-semibold leading-tight">Coach BioPulse</div>
            <div className="text-[10px] flex items-center gap-1" style={{ color: aiConnected ? C.teal : C.textFaint }}>
              <span style={{ width: 6, height: 6, borderRadius: 999, background: aiConnected ? C.teal : C.textFaint, display: "inline-block", boxShadow: aiConnected ? `0 0 8px ${C.teal}` : "none" }} />
              {aiConnected ? "IA conectada (Gemini · streaming)" : "Modo local · añade GOOGLE AI API key para IA"}
            </div>
          </div>
          <button onClick={closeCoach} aria-label="Cerrar" className="ml-auto" style={{ color: C.textFaint, padding: 6 }}>
            <X size={18} />
          </button>
        </div>

        {/* Contexto por pantalla (D2) */}
        <div className="text-center px-4 pt-2" style={{ color: C.textFaint, fontSize: "10px" }}>
          Contexto: pantalla {TAB_NAME[tab] || "Inicio"}
        </div>

        {/* Mensajes */}
        <div ref={messagesBoxRef} className="flex-1 overflow-y-auto px-4 py-3 flex flex-col gap-2">
          {messages.map((m, i) => (
            <div key={i} className={`flex ${m.role === "user" ? "justify-end" : "justify-start"}`}>
              <div
                style={{
                  background: m.role === "user" ? C.teal : C.bgSoft,
                  color: m.role === "user" ? C.bg : C.text,
                  border: `1px solid ${m.role === "user" ? C.teal : C.border}`,
                }}
                className="text-[12.5px] leading-snug rounded-2xl px-3 py-2 max-w-[85%] whitespace-pre-wrap"
              >
                {m.text}
                {busy && i === messages.length - 1 && m.role === "coach" && m.text.length > 0 && (
                  <span className="inline-block w-[2px] h-[14px] align-[-2px] ml-0.5" style={{ background: C.teal, animation: "coachCursor 0.8s steps(2) infinite" }} />
                )}
              </div>
            </div>
          ))}
          {busy && (!messages.length || messages[messages.length - 1].role === "user") && (
            <div className="flex justify-start">
              <div style={{ background: C.bgSoft, border: `1px solid ${C.border}`, color: C.textFaint }} className="text-[12px] rounded-2xl px-3 py-2 flex items-center gap-1">
                <span className="typing-dot" style={{ width: 6, height: 6, borderRadius: 999, background: C.textFaint, display: "inline-block" }} />
                <span className="typing-dot" style={{ width: 6, height: 6, borderRadius: 999, background: C.textFaint, display: "inline-block" }} />
                <span className="typing-dot" style={{ width: 6, height: 6, borderRadius: 999, background: C.textFaint, display: "inline-block" }} />
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Aviso */}
        {notice && (
          <div className="px-4 mb-1.5">
            <div style={{ background: `${C.amber}14`, border: `1px solid ${C.amber}40` }} className="rounded-xl px-3 py-2">
              <span style={{ color: C.amber }} className="text-[11.5px]">{notice}</span>
            </div>
          </div>
        )}

        {/* Chips contextuales (D2) */}
        <div className="flex gap-2 overflow-x-auto px-4" style={{ borderTop: `1px solid ${C.border}`, paddingTop: 8, paddingBottom: 8, scrollbarWidth: "none" }}>
          {chips.map((c, i) => (
            <button key={i} onClick={() => onChip(c)} disabled={busy}
              style={{ color: C.textMuted, background: C.bgSoft, border: `1px solid ${C.border}` }}
              className="text-[12px] rounded-full px-3 py-1.5 whitespace-nowrap active:scale-95 disabled:opacity-50">
              {c}
            </button>
          ))}
        </div>

        {/* Composer */}
        <div className="flex items-center gap-2 px-4 pb-4 pt-1">
          <input
            type="text" value={input} maxLength={280}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => { if (e.key === "Enter") onSend(); }}
            placeholder="Pregúntale sobre tus métricas…"
            style={{ background: C.bgSoft, border: `1px solid ${C.border}`, color: C.text }}
            className="flex-1 text-[13px] rounded-xl px-3 py-2.5 outline-none placeholder:text-[11px]"
          />
          <button onClick={onSend} disabled={busy || !input.trim()}
            style={{ background: C.teal, color: C.bg, opacity: (busy || !input.trim()) ? 0.5 : 1 }}
            className="w-10 h-10 rounded-xl flex items-center justify-center active:scale-95 transition-opacity shrink-0">
            <Send size={16} />
          </button>
        </div>

        <p className="text-center px-4 pb-3" style={{ color: C.textFaint, fontSize: "10px" }}>
          El coach interpreta tus métricas (HRV, sueño, recuperación…). No es consejo médico.
        </p>
      </div>

      {/* keyframes del coach (pulse + cursor) */}
      <style>{`
        @keyframes coachPulse { 0% { transform: scale(1); opacity: .6 } 70% { transform: scale(1.5); opacity: 0 } 100% { opacity: 0 } }
        @keyframes coachCursor { 50% { opacity: 0 } }
      `}</style>
    </>
  );
}
