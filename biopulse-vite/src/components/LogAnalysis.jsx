// ============================================================
// LogAnalysis.jsx — Correlación exploratoria de logs vs métricas.
// Compara días CON vs SIN cada hábito y muestra deltas (correlación,
// no causalidad). Incluye Insights automáticos.
// ============================================================
import { useMemo } from "react";
import { correlate } from "../lib/bioUtils.js";
import { LOG_PRESET_BY_ID } from "../lib/logPresets.js";

const METRIC_LABELS = {
  hrv: "HRV", rhr: "RHR", bioScore: "BioScore", sleepScore: "Sueño",
  riskScore: "Riesgo", recovery: "Recuperación",
};
// Signo de "mejor" por métrica: true = más alto es mejor.
const HIGHER_BETTER = { hrv: true, rhr: false, bioScore: true, sleepScore: true, riskScore: false, recovery: true };

export default function LogAnalysis({ logs, data, C }) {
  const corr = useMemo(() => correlate(logs, data), [logs, data]);

  const insights = useMemo(() => {
    const out = [];
    for (const row of corr) {
      for (const m of Object.keys(HIGHER_BETTER)) {
        const d = row.metrics[m]?.deltaPct;
        if (d == null || Math.abs(d) < 5) continue;
        const helps = HIGHER_BETTER[m] ? d > 0 : d < 0;
        const label = LOG_PRESET_BY_ID[row.id]?.label || row.id;
        out.push({
          id: `${row.id}-${m}`,
          text: `${label}: tu ${METRIC_LABELS[m]} ${helps ? "mejora" : "empeora"} ~${Math.abs(d)}% en promedio los días que lo registras (${row.countWith} días).`,
          helps,
        });
      }
    }
    // Ordenar: los más relevantes (mayor |delta|) primero y solo top 6
    return out.sort((a, b) => Math.abs(b.text.match(/\d+/)?.[0] || 0) - Math.abs(a.text.match(/\d+/)?.[0] || 0)).slice(0, 6);
  }, [corr]);

  if (corr.length === 0) {
    return (
      <div style={{ padding: 16, color: C.textMuted, fontSize: 13 }}>
        Registra un hábito al menos 2 veces y espera unos días de datos para ver correlaciones.
      </div>
    );
  }

  return (
    <div style={{ padding: 14, color: C.text, fontSize: 13 }}>
      <h3 style={{ fontSize: 15, fontWeight: 700, margin: "0 0 4px" }}>Análisis de correlación</h3>
      <p style={{ color: C.textMuted, fontSize: 11, margin: "0 0 10px" }}>
        Comparativa días CON vs SIN el hábito. Correlación exploratoria, no causalidad.
      </p>

      {/* Insights automáticos */}
      {insights.length > 0 && (
        <div style={{ marginBottom: 14 }}>
          <div style={{ fontWeight: 600, marginBottom: 6, fontSize: 13 }}>💡 Insights automáticos</div>
          {insights.map((i) => (
            <div key={i.id} style={{
              background: i.helps ? "rgba(52,211,153,.12)" : "rgba(239,68,68,.12)",
              border: `1px solid ${i.helps ? "#34d399" : "#ef4444"}`,
              borderRadius: 8, padding: "7px 9px", marginBottom: 5, fontSize: 12,
            }}>{i.text}</div>
          ))}
        </div>
      )}

      {/* Tabla por hábito */}
      {corr.map((row) => {
        const label = LOG_PRESET_BY_ID[row.id]?.label || row.id;
        return (
          <div key={row.id} style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 10, padding: 10, marginBottom: 10 }}>
            <div style={{ fontWeight: 600, marginBottom: 6 }}>{label} <span style={{ color: C.textMuted, fontWeight: 400, fontSize: 11 }}>({row.countWith} días con / {row.countWithout} sin)</span></div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr 1fr", gap: 4 }}>
              {Object.keys(METRIC_LABELS).map((m) => {
                const d = row.metrics[m]?.deltaPct ?? 0;
                const color = Math.abs(d) < 3 ? C.textMuted : (HIGHER_BETTER[m] ? (d > 0 ? "#34d399" : "#ef4444") : (d < 0 ? "#34d399" : "#ef4444"));
                return (
                  <div key={m} style={{ textAlign: "center", background: C.inputBg, borderRadius: 6, padding: "4px 2px" }}>
                    <div style={{ fontSize: 10, color: C.textMuted }}>{METRIC_LABELS[m]}</div>
                    <div style={{ fontSize: 12, fontWeight: 600, color }}>{d > 0 ? "+" : ""}{d}%</div>
                  </div>
                );
              })}
            </div>
          </div>
        );
      })}
    </div>
  );
}
