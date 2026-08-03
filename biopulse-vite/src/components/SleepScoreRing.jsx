// ============================================================
// SleepScoreRing — hero de la pestaña Sueño.
// Anillo que muestra el Sleep Score de la noche seleccionada, con
// glow que cambia de color segun el nivel (verde BUENO -> rojo BAJO),
// igual filosofia que el BioScore del Inicio.
// ============================================================
import React from "react";
import { C } from "./ui.jsx";

// Color por nivel de sueño (verde bueno -> rojo malo).
export function sleepColor(level) {
  return level === "BAJO" ? C.rose : level === "MEDIO" ? C.amber : C.teal;
}

export default function SleepScoreRing({ night, scoreObj }) {
  const score = scoreObj?.score ?? Math.round(night.sleepScore ?? 0);
  const level = scoreObj?.level || (score >= 80 ? "BUENO" : score >= 60 ? "MEDIO" : "BAJO");
  const color = sleepColor(level);

  // Respiracion: mas calmada si sueño bueno.
  const dur = level === "BAJO" ? 2.6 : level === "MEDIO" ? 3.4 : 4.4;
  const breathe = `dt-breathe-${level === "BAJO" ? "ALTO" : level === "MEDIO" ? "MODERADO" : "BAJO"}`;

  const size = 184, stroke = 13, r = (size - stroke) / 2;
  const circumference = 2 * Math.PI * r;
  const offset = circumference - (score / 100) * circumference;

  return (
    <div className="flex flex-col items-center">
      <div className="relative" style={{ width: size, height: size }}>
        <span
          aria-hidden
          className={`absolute inset-[16%] rounded-full ${breathe}`}
          style={{ background: `radial-gradient(circle, ${color}22 0%, ${color}14 35%, transparent 60%)`, animationDuration: `${dur}s` }}
        />
        <svg width={size} height={size} style={{ transform: "rotate(-90deg)" }} role="img" aria-label={`Sleep Score: ${score} de 100, nivel ${level}`}>
          <defs>
            <radialGradient id="sleepBody" cx="50%" cy="50%" r="50%">
              <stop offset="0%" stopColor={color} stopOpacity="0.18" />
              <stop offset="60%" stopColor={color} stopOpacity="0.05" />
              <stop offset="100%" stopColor="transparent" />
            </radialGradient>
          </defs>
          <circle cx={size / 2} cy={size / 2} r={r} fill={color} opacity="0.04" />
          <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke={C.borderSoft} strokeWidth={stroke} />
          <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="url(#sleepBody)" strokeWidth={0} />
          <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke={color} strokeWidth={stroke} strokeLinecap="round"
            strokeDasharray={circumference} strokeDashoffset={offset}
            style={{ transition: "stroke-dashoffset 1.1s cubic-bezier(.4,0,.2,1), stroke 0.6s ease", filter: `drop-shadow(0 0 10px ${color}66)` }} />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span style={{ color: C.textFaint }} className="text-[10px] uppercase tracking-[0.2em] mb-1">Sleep Score</span>
          <span style={{ color: C.text, fontFamily: "'IBM Plex Mono', monospace" }} className="text-5xl font-semibold tabular-nums leading-none">{score}</span>
          <span style={{ color, fontFamily: "'IBM Plex Mono', monospace" }} className="text-[11px] font-semibold mt-1.5 tracking-wide">{level}</span>
        </div>
      </div>
    </div>
  );
}
