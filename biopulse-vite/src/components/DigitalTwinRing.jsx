// ============================================================
// DigitalTwinRing — hero "gemelo digital" del Dashboard.
// Anillo circular que RESPIRA segun la recuperacion/riesgo del
// usuario (HRV + riskScore). Color por nivel de riesgo, glow que
// pulsa, micro-label de HRV en vivo. Es el diferenciador vs Whoop
// hecho UI: tu fisiologia predicha, no un medidor comun.
// ============================================================
import React from "react";
import { C, riskColor } from "./ui.jsx";

export default function DigitalTwinRing({ today }) {
  const score = Math.round(today.riskScore ?? 0);
  const level = today.riskLevel || "BAJO";
  const color = riskColor(level);

  // Respiracion: mas lenta y calma si riesgo bajo; mas rapida/tensa si alto.
  const dur = level === "ALTO" ? 2.1 : level === "MODERADO" ? 3.1 : 4.3;
  const breathe = `dt-breathe-${level}`;

  const size = 200, stroke = 14, r = (size - stroke) / 2;
  const circumference = 2 * Math.PI * r;
  const offset = circumference - (score / 100) * circumference;

  return (
    <div className="flex flex-col items-center">
      <div className="relative" style={{ width: size, height: size }}>
        {/* glow que pulsa con la respiracion */}
        <span
          aria-hidden
          className={`absolute inset-0 rounded-full ${breathe}`}
          style={{ background: `radial-gradient(circle, ${color}22 0%, transparent 70%)`, animationDuration: `${dur}s` }}
        />
        <svg width={size} height={size} style={{ transform: "rotate(-90deg)" }} role="img" aria-label={`BioScore: índice de riesgo ${score} de 100, nivel ${level}`}>
          <defs>
            <radialGradient id="twinBody" cx="50%" cy="50%" r="50%">
              <stop offset="0%" stopColor={color} stopOpacity="0.18" />
              <stop offset="60%" stopColor={color} stopOpacity="0.05" />
              <stop offset="100%" stopColor="transparent" />
            </radialGradient>
          </defs>
          <circle cx={size / 2} cy={size / 2} r={r} fill={color} opacity="0.04" />
          <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke={C.borderSoft} strokeWidth={stroke} />
          <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="url(#twinBody)" strokeWidth={0} />
          <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke={color} strokeWidth={stroke} strokeLinecap="round"
            strokeDasharray={circumference} strokeDashoffset={offset}
            style={{ transition: "stroke-dashoffset 1.1s cubic-bezier(.4,0,.2,1)", filter: `drop-shadow(0 0 10px ${color}66)` }} />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span style={{ color: C.textFaint }} className="text-[10px] uppercase tracking-[0.2em] mb-1">BioScore</span>
          <span style={{ color: C.text, fontFamily: "'IBM Plex Mono', monospace" }} className="text-5xl font-semibold tabular-nums leading-none">{score}</span>
          <span style={{ color, fontFamily: "'IBM Plex Mono', monospace" }} className="text-[11px] font-semibold mt-1.5 tracking-wide">{level}</span>
        </div>
      </div>
      <p style={{ color: C.textFaint }} className="text-[11px] text-center mt-2 max-w-[15rem]">
        Tu índice predice riesgo de fatiga/sobreentrenamiento a partir de tu fisiología.
      </p>
    </div>
  );
}
