// ============================================================
// EnergyMap — "Curva de energia del dia" (Tecnico).
// Area suave (reusa buildSmoothPath) con degradado teal->purple sobre
// eje 8am..10pm, mas 3 chips accionables. Cero datos inventados: la
// curva se infiere desde metricas reales via computeEnergyMap().
// ============================================================
import React from "react";
import { C, buildSmoothPath } from "./ui.jsx";

export default function EnergyMap({ map }) {
  if (!map) return null;
  const samples = map.samples;
  const w = 320, h = 120, pad = 8;
  const minV = 0, maxV = 100;
  const pts = samples.map((s, i) => [
    pad + (i / (samples.length - 1)) * (w - pad * 2),
    h - pad - ((s.v - minV) / (maxV - minV)) * (h - pad * 2),
  ]);
  const line = buildSmoothPath(pts);
  const area = `${line} L ${pts[pts.length - 1][0]},${h - pad} L ${pts[0][0]},${h - pad} Z`;

  return (
    <div style={{ background: C.card, border: `1px solid ${C.border}` }} className="glass rounded-3xl p-4">
      <div className="flex items-center justify-between mb-1">
        <span style={{ color: C.text }} className="text-sm font-semibold">Curva de energía del día</span>
        <span style={{ color: C.textFaint }} className="text-[10px]">8:00 – 22:00</span>
      </div>
      <p style={{ color: C.textFaint }} className="text-[11px] mb-2">Inferencia desde tu recuperación, HRV, sueño y carga de hoy.</p>

      <svg viewBox={`0 0 ${w} ${h}`} width="100%" height={h} preserveAspectRatio="none" className="overflow-hidden">
        <defs>
          <linearGradient id="energyFill" x1="0" y1="0" x2="1" y2="0">
            <stop offset="0%" stopColor={C.teal} stopOpacity="0.45" />
            <stop offset="55%" stopColor={C.purple} stopOpacity="0.30" />
            <stop offset="100%" stopColor={C.rose} stopOpacity="0.18" />
          </linearGradient>
          <linearGradient id="energyLine" x1="0" y1="0" x2="1" y2="0">
            <stop offset="0%" stopColor={C.teal} />
            <stop offset="55%" stopColor={C.purple} />
            <stop offset="100%" stopColor={C.rose} />
          </linearGradient>
        </defs>
        <path d={area} fill="url(#energyFill)" />
        <path d={line} fill="none" stroke="url(#energyLine)" strokeWidth={2.5} strokeLinecap="round" vectorEffect="non-scaling-stroke" />
      </svg>

      <div className="grid grid-cols-3 gap-2 mt-3">
        {map.chips.map((c, i) => (
          <div key={i} style={{ background: C.bgSoft, border: `1px solid ${C.borderSoft}` }} className="rounded-xl px-2 py-2 text-center">
            <div className="text-base leading-none">{c.icon}</div>
            <div style={{ color: C.text }} className="text-[11px] font-semibold mt-1">{c.time}</div>
            <div style={{ color: C.textFaint }} className="text-[9.5px] leading-tight mt-0.5">{c.label}</div>
          </div>
        ))}
      </div>
    </div>
  );
}
