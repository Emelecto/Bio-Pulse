// ============================================================
// TAB DATOS — Registro de hábitos/sustancias + Zona de esfuerzo +
// Análisis de correlación + Glosario + Indicadores para ML.
// Sub-tabs: Registrar | Zona | Análisis | Glosario. FAB para registrar.
// ============================================================
import React, { useState } from "react";
import { Plus, Database, Gauge, BarChart3, BookOpen, FlaskConical } from "lucide-react";
import { C } from "./ui.jsx";
import Logger from "./Logger.jsx";
import EffortZone from "./EffortZone.jsx";
import LogAnalysis from "./LogAnalysis.jsx";
import Glossary from "./Glossary.jsx";
import { computeReadiness, effortTarget } from "../lib/bioUtils.js";

const SUB = [
  { id: "registrar", label: "Registrar", icon: Database },
  { id: "zona", label: "Zona", icon: Gauge },
  { id: "analisis", label: "Análisis", icon: BarChart3 },
  { id: "glosario", label: "Glosario", icon: BookOpen },
];

export default function Datos({ logs, data, C: Ctx, onOpenTech, onBreathe }) {
  const [sub, setSub] = useState("registrar");
  const today = data[data.length - 1];
  const readiness = computeReadiness({
    recovery: today.recovery, hrv: today.hrv, hrvBaseline: data[0]?.hrv || today.hrv,
    riskScore: today.riskScore, sleepScore: today.sleepScore, fatigue: today.fatigueScore,
  });
  const effort = effortTarget(readiness);

  // Indicadores que alimentan el modelo ML (documentación del proyecto).
  const mlFeatures = [
    { k: "HRV", d: "Variabilidad cardíaca (ms)" },
    { k: "RHR", d: "Frecuencia en reposo (bpm)" },
    { k: "Recuperación", d: "% recuperado" },
    { k: "Sueño", d: "Horas y eficiencia" },
    { k: "Risk Score", d: "Anomalías/fatiga" },
    { k: "Logs", d: "Hábitos/sustancias etiquetados" },
  ];

  return (
    <div style={{ paddingBottom: 8 }}>
      {/* Sub-tabs */}
      <div style={{ display: "flex", gap: 6, marginBottom: 12 }}>
        {SUB.map((s) => (
          <button key={s.id} onClick={() => setSub(s.id)}
            style={{
              flex: 1, background: sub === s.id ? C.accent : C.card,
              color: sub === s.id ? "#fff" : C.textMuted,
              border: `1px solid ${sub === s.id ? C.accent : C.border}`,
              borderRadius: 12, padding: "8px 4px", fontSize: 12, fontWeight: 600,
              display: "flex", flexDirection: "column", alignItems: "center", gap: 3, cursor: "pointer",
            }}>
            <s.icon size={18} />
            {s.label}
          </button>
        ))}
      </div>

      {sub === "registrar" && <Logger logs={logs.logs} addLog={logs.addLog} removeLog={logs.removeLog} C={C} />}
      {sub === "zona" && <div style={{ display: "flex", flexDirection: "column", gap: 12 }}><EffortZone metrics={{ recovery: today.recovery, hrv: today.hrv, hrvBaseline: data[0]?.hrv || today.hrv, riskScore: today.riskScore, sleepScore: today.sleepScore, fatigue: today.fatigueScore }} C={C} /></div>}
      {sub === "analisis" && <LogAnalysis logs={logs.logs} data={data} C={C} />}
      {sub === "glosario" && <Glossary C={C} />}

      {/* Panel Indicadores para ML (siempre visible al final de cada sub-tab) */}
      <div style={{ marginTop: 16, background: C.card, border: `1px dashed ${C.border}`, borderRadius: 14, padding: 12 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 6 }}>
          <FlaskConical size={16} color={C.purple} />
          <span style={{ color: C.text, fontWeight: 600, fontSize: 13 }}>Indicadores para el modelo ML</span>
        </div>
        <p style={{ color: C.textMuted, fontSize: 11, margin: "0 0 8px", lineHeight: 1.4 }}>
          Estas variables son las <b>features</b> que alimentarán la predicción de riesgo/recuperación en los siguientes sprints.
        </p>
        <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
          {mlFeatures.map((f) => (
            <span key={f.k} title={f.d} style={{ background: C.bgSoft, border: `1px solid ${C.border}`, borderRadius: 999, padding: "3px 9px", fontSize: 11, color: C.text }}>{f.k}</span>
          ))}
        </div>
      </div>

      {/* FAB registrar */}
      <button onClick={() => { setSub("registrar"); }}
        aria-label="Registrar"
        style={{
          position: "fixed", right: "max(16px, calc(50% - 192px + 16px))", bottom: 84,
          width: 52, height: 52, borderRadius: "50%",
          background: C.accent, color: "#fff", border: "none",
          boxShadow: "0 8px 24px rgba(0,0,0,.35)", fontSize: 24, cursor: "pointer", zIndex: 45,
        }}>
        <Plus size={24} />
      </button>
    </div>
  );
}
