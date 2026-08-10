// ============================================================
// BreathSession — overlay global de respiración guiada.
// Soporta 3 rutinas (basica / 4-7-8 / box breathing) definidas en
// breathRoutines.js. El anillo EMPIEZA PEQUEÑO y crece al inhalar /
// se contrae al exhalar para que la animación se note desde el inicio.
// El usuario elige la rutina en un selector antes de iniciar.
// ============================================================
import React, { useState, useEffect, useRef } from "react";
import { C } from "./ui.jsx";
import { BREATH_ROUTINES, getRoutine } from "../lib/breathRoutines.js";

// Estado de la sesión: 'select' (elegir rutina) | 'running' (respirando).
export default function BreathSession({ open, onClose, today }) {
  const [routineId, setRoutineId] = useState("basica");
  const [phaseIdx, setPhaseIdx] = useState(() => getRoutine("basica").pattern.length - 1); // arranca contraído (pequeño)
  const [secondsLeft, setSecondsLeft] = useState(120);
  const [running, setRunning] = useState(false);
  const [started, setStarted] = useState(false);
  const phaseRef = useRef(null);
  const tickRef = useRef(null);

  const routine = getRoutine(routineId);

  // Al abrir: reset a selector y arranca contraído (pequeño) para que
  // la primera transición (hacia Inhala) se vea crecer desde el inicio.
  useEffect(() => {
    if (open) {
      setStarted(false);
      setRunning(false);
      setPhaseIdx(routine.pattern.length - 1);
      setSecondsLeft(120);
    }
  }, [open]);

  // Bucle de fases según el patrón de la rutina.
  useEffect(() => {
    if (!running) return;
    const phase = routine.pattern[phaseIdx];
    phaseRef.current = setTimeout(() => {
      setPhaseIdx((i) => (i + 1) % routine.pattern.length);
    }, phase.secs * 1000);
    return () => clearTimeout(phaseRef.current);
  }, [running, phaseIdx, routine]);

  // Cuenta regresiva.
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

  const phase = routine.pattern[phaseIdx];
  const isInhale = phase.label === "Inhala";
  const isHold = phase.label === "Sostén";
  // Arranca pequeño (0.62) y crece al inhalar; se contrae al exhalar/sostener.
  const scale = isInhale ? 1.12 : isHold ? (routine.pattern[phaseIdx - 1]?.label === "Inhala" ? 1.12 : 0.7) : 0.66;
  const dur = phase.secs;

  const mm = String(Math.floor(secondsLeft / 60)).padStart(2, "0");
  const ss = String(secondsLeft % 60).padStart(2, "0");

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center px-6" style={{ background: "rgba(2,6,12,0.74)", backdropFilter: "blur(10px)" }}>
      <div className="relative flex flex-col items-center rounded-[28px] p-7 w-full max-w-sm" style={{ background: C.card, border: `1px solid ${C.border}` }}>

        {/* SELECTOR DE RUTINA */}
        {!started ? (
          <>
            <span style={{ color: C.textFaint }} className="text-[11px] uppercase tracking-[0.25em] mb-4">Elige tu respiración</span>
            <div className="flex flex-col gap-2.5 w-full">
              {BREATH_ROUTINES.map((r) => (
                <button
                  key={r.id}
                  onClick={() => setRoutineId(r.id)}
                  className="text-left rounded-2xl px-4 py-3 active:scale-[0.98] transition-transform"
                  style={{ background: routineId === r.id ? `${r.color}1A` : C.bgSoft, border: `1px solid ${routineId === r.id ? r.color : C.border}` }}
                >
                  <div className="flex items-center justify-between">
                    <span style={{ color: C.text }} className="text-[14px] font-semibold">{r.name}</span>
                    <span style={{ color: r.color, fontSize: 11, fontWeight: 700 }}>{r.tag}</span>
                  </div>
                  <div style={{ color: C.textMuted }} className="text-[11.5px] mt-0.5">{r.subtitle}</div>
                  <div style={{ color: C.textFaint }} className="text-[11px] mt-1 leading-snug">{r.benefit}</div>
                </button>
              ))}
            </div>
            <button
              onClick={() => { setPhaseIdx(routine.pattern.length - 1); setStarted(true); setRunning(true); }}
              className="mt-5 w-full text-[14px] font-semibold py-3 rounded-2xl active:scale-[0.98] transition-transform"
              style={{ background: routine.color, color: "#050A10" }}
            >
              Comenzar · {routine.name}
            </button>
            <button onClick={onClose} className="mt-3 text-[12px]" style={{ color: C.textMuted }}>Cancelar</button>
          </>
        ) : (
          <>
            <button onClick={onClose} aria-label="Cerrar" className="absolute top-4 right-4 w-9 h-9 rounded-full flex items-center justify-center active:scale-95 transition-transform" style={{ background: C.bgSoft, color: C.textMuted }}>
              ✕
            </button>

            <span style={{ color: routine.color }} className="text-[11px] font-semibold uppercase tracking-[0.2em] mb-1">{routine.name}</span>
            <span style={{ color: C.textFaint }} className="text-[11px] mb-5">{routine.subtitle}</span>

            <div className="relative" style={{ width: 260, height: 260, overflow: "visible" }}>
              <span
                aria-hidden
                className="absolute inset-[12%] rounded-full"
                style={{ background: `radial-gradient(circle, ${routine.color}2A 0%, ${routine.color}14 40%, transparent 65%)`, transition: `transform ${dur}s ease-in-out`, transform: `scale(${scale})`, overflow: "visible" }}
              />
              <svg width={260} height={260} style={{ transform: "rotate(-90deg)", overflow: "visible" }} className="relative">
                <g style={{ transition: `transform ${dur}s ease-in-out`, transform: `scale(${scale})`, transformOrigin: "center", transformBox: "fill-box" }}>
                  <circle cx={130} cy={130} r={114} fill="none" stroke={C.borderSoft} strokeWidth={16} />
                  <circle cx={130} cy={130} r={114} fill="none" stroke={routine.color} strokeWidth={16} strokeLinecap="round" style={{ filter: `drop-shadow(0 0 12px ${routine.color}66)` }} />
                </g>
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <span style={{ color: routine.color }} className="text-3xl font-semibold tracking-wide" style={{ transition: "opacity 0.4s" }}>{phase.label}</span>
                <span style={{ color: C.textMuted, fontFamily: "'IBM Plex Mono', monospace" }} className="text-sm mt-2 tabular-nums">{mm}:{ss}</span>
              </div>
            </div>

            <p style={{ color: C.textFaint }} className="text-[12px] text-center mt-6 max-w-[16rem] leading-relaxed">
              {routine.benefit}
            </p>

            <button onClick={onClose} className="mt-5 text-[12px]" style={{ color: C.textMuted }}>Terminar</button>
          </>
        )}
      </div>
    </div>
  );
}
