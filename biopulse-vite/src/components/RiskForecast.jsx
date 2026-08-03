// ============================================================
// RiskForecast — "Proyeccion de riesgo" (Tecnico).
// 3 mini-anillos (hoy / +1 / +3 dias) con color scoreColor, unidos por
// una linea de tendencia. Honesto: proyeccion por regresion lineal sobre
// los ultimos 7 dias, no prediccion medica.
// ============================================================
import React from "react";
import { C, scoreColor } from "./ui.jsx";

function MiniRing({ score, label, color }) {
  const size = 64, stroke = 7, r = (size - stroke) / 2;
  const circ = 2 * Math.PI * r;
  const offset = circ - (score / 100) * circ;
  return (
    <div className="flex flex-col items-center">
      <div className="relative" style={{ width: size, height: size }}>
        <svg width={size} height={size} style={{ transform: "rotate(-90deg)" }}>
          <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke={C.borderSoft} strokeWidth={stroke} />
          <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke={color} strokeWidth={stroke} strokeLinecap="round"
            strokeDasharray={circ} strokeDashoffset={offset} style={{ filter: `drop-shadow(0 0 5px ${color}66)`, transition: "stroke-dashoffset 0.8s ease" }} />
        </svg>
        <div className="absolute inset-0 flex items-center justify-center">
          <span style={{ color, fontFamily: "'IBM Plex Mono', monospace" }} className="text-[15px] font-semibold tabular-nums">{score}</span>
        </div>
      </div>
      <span style={{ color: C.textFaint }} className="text-[10px] mt-1">{label}</span>
    </div>
  );
}

export default function RiskForecast({ forecast }) {
  if (!forecast) return null;
  const { today, plus1, plus3, trendUp } = forecast;
  const colorToday = scoreColor(today, "lower");
  const color1 = scoreColor(plus1, "lower");
  const color3 = scoreColor(plus3, "lower");

  return (
    <div style={{ background: C.card, border: `1px solid ${C.border}` }} className="glass rounded-3xl p-4">
      <div className="flex items-center justify-between mb-1">
        <span style={{ color: C.text }} className="text-sm font-semibold">Proyección de riesgo</span>
        <span style={{ color: trendUp ? C.rose : C.teal, fontSize: 11, fontWeight: 600 }}>
          {trendUp ? "↗ subiendo" : "↘ estable/bajando"}
        </span>
      </div>
      <p style={{ color: C.textFaint }} className="text-[11px] mb-3">Tendencia de tus últimos 7 días (no es predicción médica).</p>

      <div className="flex items-center justify-between">
        <MiniRing score={today} label="Hoy" color={colorToday} />
        <div className="flex-1 h-px mx-1" style={{ background: `linear-gradient(90deg, ${colorToday}, ${color1})` }} />
        <MiniRing score={plus1} label="+1 día" color={color1} />
        <div className="flex-1 h-px mx-1" style={{ background: `linear-gradient(90deg, ${color1}, ${color3})` }} />
        <MiniRing score={plus3} label="+3 días" color={color3} />
      </div>

      {trendUp && plus3 >= 60 && (
        <div style={{ background: `${C.rose}12`, border: `1px solid ${C.rose}40` }} className="rounded-xl px-3 py-2 mt-3">
          <span style={{ color: C.rose }} className="text-[12px]">⚠️ Si sigues así, en 3 días tu riesgo podría llegar a {plus3}. Reduce la carga hoy.</span>
        </div>
      )}
    </div>
  );
}
