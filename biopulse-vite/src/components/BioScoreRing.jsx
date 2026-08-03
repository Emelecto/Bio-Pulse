// ============================================================
// BioScoreRing — hero del Dashboard. Indice de BIENESTAR/RENDIMIENTO
// (mayor = mejor), distinto al Risk Score. Glow verde cuando el score
// es alto, amarillo/media, rojo cuando bajo. Reusa la filosofia visual
// del anillo respirante, pero con semantica invertida a riesgo.
// ============================================================
import React from "react";
import { C, scoreColor, BRAND_TEAL } from "./ui.jsx";

// Color por nivel de BioScore: usa scoreColor (escala teal->verde->amarillo->rojo).
export function bioColor(level) {
  return level === "BAJO" ? C.rose : level === "MEDIO" ? C.amber : BRAND_TEAL;
}

export default function BioScoreRing({ today }) {
  const score = Math.round(today.bioScore ?? 0);
  const level = today.bioLevel || "BUENO";
  const color = scoreColor(score, "higher");

  const dur = level === "BAJO" ? 4.3 : level === "MEDIO" ? 3.3 : 2.3; // mas calmado si esta bien
  const breathe = `dt-breathe-${level === "BAJO" ? "ALTO" : level === "MEDIO" ? "MODERADO" : "BAJO"}`;

  const size = 200, stroke = 14, r = (size - stroke) / 2;
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
        <svg width={size} height={size} style={{ transform: "rotate(-90deg)" }} role="img" aria-label={`BioScore: índice de bienestar ${score} de 100, nivel ${level}`}>
          <defs>
            <radialGradient id="bioBody" cx="50%" cy="50%" r="50%">
              <stop offset="0%" stopColor={color} stopOpacity="0.18" />
              <stop offset="60%" stopColor={color} stopOpacity="0.05" />
              <stop offset="100%" stopColor="transparent" />
            </radialGradient>
          </defs>
          <circle cx={size / 2} cy={size / 2} r={r} fill={color} opacity="0.04" />
          <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke={C.borderSoft} strokeWidth={stroke} />
          <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="url(#bioBody)" strokeWidth={0} />
          <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke={color} strokeWidth={stroke} strokeLinecap="round"
            strokeDasharray={circumference} strokeDashoffset={offset}
            style={{ transition: "stroke-dashoffset 1.1s cubic-bezier(.4,0,.2,1), stroke 0.6s ease", filter: `drop-shadow(0 0 10px ${color}66)` }} />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span style={{ color: C.textFaint }} className="text-[10px] uppercase tracking-[0.2em] mb-1">BioScore</span>
          <span style={{ color: C.text, fontFamily: "'IBM Plex Mono', monospace" }} className="text-5xl font-semibold tabular-nums leading-none">{score}</span>
          <span style={{ color, fontFamily: "'IBM Plex Mono', monospace" }} className="text-[11px] font-semibold mt-1.5 tracking-wide">{level}</span>
        </div>
      </div>
      <p style={{ color: C.textFaint }} className="text-[11px] text-center mt-2 max-w-[15rem]">
        Tu índice de bienestar y rendimiento a partir de HRV, RHR, recuperación y sueño.
      </p>
    </div>
  );
}
