// ============================================================
// BreathSession — overlay global de respiracion guiada (2 min).
// Reusa la estetica del anillo BioScore (glow respirante) pero con
// ritmo 4s inhala / 4s exhala controlado por estado para sincronizar
// el texto "Inhala / Exhala". Cero datos nuevos: solo CSS + timers.
// ============================================================
import React, { useState, useEffect, useRef } from "react";
import { C, scoreColor } from "./ui.jsx";

const PHASE_MS = 4000; // 4s inhala, 4s exhala

export default function BreathSession({ open, onClose, today }) {
  const [phase, setPhase] = useState("inhala"); // 'inhala' | 'exhala'
  const [secondsLeft, setSecondsLeft] = useState(120);
  const [running, setRunning] = useState(false);
  const phaseRef = useRef(null);
  const tickRef = useRef(null);

  // Reinicia al abrir
  useEffect(() => {
    if (open) {
      setSecondsLeft(120);
      setPhase("inhala");
      setRunning(true);
    } else {
      setRunning(false);
    }
  }, [open]);

  // Bucle de fases (inhala <-> exhala) cada 4s
  useEffect(() => {
    if (!running) return;
    phaseRef.current = setInterval(() => {
      setPhase((p) => (p === "inhala" ? "exhala" : "inhala"));
    }, PHASE_MS);
    return () => clearInterval(phaseRef.current);
  }, [running]);

  // Cuenta regresiva de 2 min
  useEffect(() => {
    if (!running) return;
    tickRef.current = setInterval(() => {
      setSecondsLeft((s) => {
        if (s <= 1) {
          clearInterval(tickRef.current);
          setRunning(false);
          return 0;
        }
        return s - 1;
      });
    }, 1000);
    return () => clearInterval(tickRef.current);
  }, [running]);

  if (!open) return null;

  const score = Math.round(today?.bioScore ?? 70);
  const color = scoreColor(score, "higher");
  const size = 260, stroke = 16, r = (size - stroke) / 2;
  const scale = phase === "inhala" ? 1.08 : 0.86;

  const mm = String(Math.floor(secondsLeft / 60)).padStart(2, "0");
  const ss = String(secondsLeft % 60).padStart(2, "0");

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center px-6" style={{ background: "rgba(2,6,12,0.72)", backdropFilter: "blur(8px)" }}>
      <div className="relative flex flex-col items-center glass rounded-[28px] p-7 w-full max-w-sm" style={{ background: C.card, border: `1px solid ${C.border}` }}>
        <button onClick={onClose} aria-label="Cerrar" className="absolute top-4 right-4 w-9 h-9 rounded-full flex items-center justify-center active:scale-95 transition-transform" style={{ background: C.bgSoft, color: C.textMuted }}>
          ✕
        </button>

        <span style={{ color: C.textFaint }} className="text-[11px] uppercase tracking-[0.25em] mb-5">Respiración guiada</span>

        <div className="relative" style={{ width: size, height: size }}>
          <span
            aria-hidden
            className="absolute inset-[14%] rounded-full"
            style={{ background: `radial-gradient(circle, ${color}2A 0%, ${color}14 40%, transparent 65%)`, transition: "transform 4s ease-in-out", transform: `scale(${scale})` }}
          />
          <svg width={size} height={size} style={{ transform: "rotate(-90deg)" }} className="relative">
            <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke={C.borderSoft} strokeWidth={stroke} />
            <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke={color} strokeWidth={stroke} strokeLinecap="round"
              style={{ transition: "transform 4s ease-in-out", transform: `scale(${scale})`, transformOrigin: "center", filter: `drop-shadow(0 0 12px ${color}66)` }} />
          </svg>
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <span style={{ color }} className="text-2xl font-semibold tracking-wide" style={{ transition: "opacity 0.4s" }}>{phase === "inhala" ? "Inhala" : "Exhala"}</span>
            <span style={{ color: C.textMuted, fontFamily: "'IBM Plex Mono', monospace" }} className="text-sm mt-2 tabular-nums">{mm}:{ss}</span>
          </div>
        </div>

        <p style={{ color: C.textFaint }} className="text-[12px] text-center mt-6 max-w-[16rem] leading-relaxed">
          Sigue el anillo: crece al inhalar, baja al exhalar. Respira así 2 minutos para calmar tu sistema nervioso.
        </p>

        {secondsLeft === 0 && (
          <div className="mt-4 flex flex-col items-center gap-2">
            <span style={{ color: C.teal }} className="text-sm font-semibold">✓ Te tomaste un momento. Bien hecho.</span>
            <button onClick={onClose} style={{ background: C.teal, color: C.bg }} className="text-[13px] font-semibold px-5 py-2.5 rounded-xl active:scale-95 transition-transform">
              Cerrar
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
