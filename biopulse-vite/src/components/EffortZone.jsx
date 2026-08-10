// ============================================================
// EffortZone.jsx — Zona de esfuerzo objetivo del día.
// Calcula Readiness y mapea a banda de intensidad ACOTADA (30..90%).
// ============================================================
import { useMemo } from "react";
import { computeReadiness, effortTarget } from "../lib/bioUtils.js";

export default function EffortZone({ metrics, C }) {
  const readiness = useMemo(() => computeReadiness(metrics), [metrics]);
  const t = useMemo(() => effortTarget(readiness), [readiness]);

  // Gauge: barra horizontal 0..100 con banda resaltada y marcador mid.
  const pct = (v) => `${v}%`;
  return (
    <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 12, padding: 14, color: C.text }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: 2 }}>
        <span style={{ fontWeight: 700, fontSize: 14 }}>Zona de esfuerzo ideal</span>
        <span style={{ fontSize: 12, color: C.teal, fontWeight: 600 }}>{t.label}</span>
      </div>
      <div style={{ fontSize: 11, color: C.textMuted, marginBottom: 10 }}>
        Readiness de hoy: <b style={{ color: C.text }}>{readiness}/100</b>
      </div>

      {/* Gauge */}
      <div style={{ position: "relative", height: 14, background: C.inputBg, borderRadius: 999, overflow: "hidden" }}>
        <div style={{
          position: "absolute", left: pct(t.lo), width: pct(t.hi - t.lo), top: 0, bottom: 0,
          background: "linear-gradient(90deg,#34d399,#38bdf8)", opacity: 0.55,
        }} />
        <div style={{
          position: "absolute", left: `calc(${pct(t.mid)} - 2px)`, width: 4, top: -3, bottom: -3,
          background: C.teal, borderRadius: 2,
        }} />
      </div>
      <div style={{ display: "flex", justifyContent: "space-between", fontSize: 10, color: C.textMuted, marginTop: 4 }}>
        <span>0%</span><span>{t.lo}–{t.hi}% esfuerzo</span><span>100%</span>
      </div>

      <p style={{ fontSize: 12, color: C.textMuted, margin: "10px 0 0", lineHeight: 1.4 }}>
        Empuja hasta el límite seguro: entrena en tu zona sin sobreesforzarte. Si tu riesgo sube, la zona baja sola.
      </p>
    </div>
  );
}
