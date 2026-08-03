// ============================================================
// RiskScoreRing — anillo de Score de Riesgo (pequeño, centrado).
// Misma filosofia visual que BioScore/SleepScore pero mas compacto,
// porque es secundario al BioScore. Color por scoreColor(kind='lower'):
// mayor riesgo => mas rojo; menor riesgo => mas verde.
// ============================================================
import React from "react";
import { C, scoreColor } from "./ui.jsx";

export default function RiskScoreRing({ today }) {
  const score = Math.round(today.riskScore ?? 0);
  const level = today.riskLevel || "BAJO";
  const color = scoreColor(score, "lower");

  const dur = level === "ALTO" ? 2.4 : level === "MODERADO" ? 3.2 : 4.2;
  const breathe = `dt-breathe-${level === "ALTO" ? "ALTO" : level === "MODERADO" ? "MODERADO" : "BAJO"}`;

  const size = 140, stroke = 11, r = (size - stroke) / 2;
  const circumference = 2 * Math.PI * r;
  const offset = circumference - (score / 100) * circumference;

  return (
    <div className="flex flex-col items-center">
      <div className="relative" style={{ width: size, height: size }}>
        <span
          aria-hidden
          className={`absolute inset-[18%] rounded-full ${breathe}`}
          style={{ background: `radial-gradient(circle, ${color}22 0%, ${color}14 35%, transparent 60%)`, animationDuration: `${dur}s` }}
        />
        <svg width={size} height={size} style={{ transform: "rotate(-90deg)" }} role="img" aria-label={`Score de riesgo ${score} de 100, nivel ${level}`}>
          <circle cx={size / 2} cy={size / 2} r={r} fill={color} opacity="0.04" />
          <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke={C.borderSoft} strokeWidth={stroke} />
          <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke={color} strokeWidth={stroke} strokeLinecap="round"
            strokeDasharray={circumference} strokeDashoffset={offset}
            style={{ transition: "stroke-dashoffset 1.1s cubic-bezier(.4,0,.2,1), stroke 0.6s ease", filter: `drop-shadow(0 0 8px ${color}66)` }} />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span style={{ color, fontFamily: "'IBM Plex Mono', monospace" }} className="text-3xl font-semibold tabular-nums leading-none">{score}</span>
          <span style={{ color: C.textFaint }} className="text-[9px] uppercase tracking-[0.15em] mt-1">Riesgo</span>
        </div>
      </div>
    </div>
  );
}
