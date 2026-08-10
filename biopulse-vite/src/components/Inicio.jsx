// ============================================================
// TAB INICIO — hub principal: saludo con perfil, BioScore, Risk, Sueño,
// banner de riesgo, acceso a Análisis técnico y a Datos (registrar).
// ============================================================
import React, { useState } from "react";
import { Moon, Heart, AlertTriangle, ChevronRight, Database, Sparkles } from "lucide-react";
import { C } from "./ui.jsx";
import BioScoreRing from "./BioScoreRing.jsx";
import RiskScoreRing from "./RiskScoreRing.jsx";
import { useCoach } from "../coach/CoachContext.jsx";

export default function Inicio({ data, today, riskThreshold, userProfile, onOpenTech, onOpenDatos, onBreathe }) {
  const { openCoach } = useCoach();
  const [sleepOpen, setSleepOpen] = useState(false);
  void sleepOpen; void setSleepOpen;

  const name = userProfile?.name;
  const riskHigh = today.riskScore >= riskThreshold;
  const riskColor = today.riskLevel === "alto" ? "#ef4444" : today.riskLevel === "medio" ? "#f59e0b" : "#34d399";

  // Resumen del perfil
  const chips = [];
  if (userProfile) {
    if (userProfile.age) chips.push(`${userProfile.age} años`);
    const goalLabel = { salud: "Salud", rendimiento: "Rendimiento", sueno: "Mejor sueño", recuperacion: "Recuperación", estres: "Menos estrés", energia: "Más energía", longevidad: "Longevidad", preparacion: "Prep. física" }[userProfile.goal];
    if (goalLabel) chips.push(goalLabel);
  }

  return (
    <div className="flex flex-col gap-4">
      {/* SALUDO */}
      <div>
        <div style={{ color: C.textMuted, fontSize: 13 }}>Hola{name ? `, ${name}` : ""} 👋</div>
        <div style={{ color: C.text, fontSize: 20, fontWeight: 700, fontFamily: "'Space Grotesk', sans-serif" }}>Tu resumen de hoy</div>
        {chips.length > 0 && (
          <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginTop: 6 }}>
            {chips.map((c, i) => (
              <span key={i} style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 999, padding: "2px 9px", fontSize: 11, color: C.textMuted }}>{c}</span>
            ))}
          </div>
        )}
      </div>

      {/* BIO + RIESGO */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
        <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 18, padding: 14, display: "flex", flexDirection: "column", alignItems: "center" }}>
          <BioScoreRing score={today.bioScore} />
          <div style={{ color: C.textMuted, fontSize: 12, marginTop: 4 }}>BioScore</div>
        </div>
        <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 18, padding: 14, display: "flex", flexDirection: "column", alignItems: "center" }}>
          <RiskScoreRing score={today.riskScore} level={today.riskLevel} />
          <div style={{ color: C.textMuted, fontSize: 12, marginTop: 4 }}>Riesgo</div>
        </div>
      </div>

      {/* SUEÑO */}
      <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 16, padding: 14, display: "flex", alignItems: "center", gap: 12 }}>
        <div style={{ background: C.bgSoft, borderRadius: 12, padding: 10 }}>
          <Moon size={20} color={C.teal} />
        </div>
        <div style={{ flex: 1 }}>
          <div style={{ color: C.text, fontWeight: 600, fontSize: 14 }}>Sueño</div>
          <div style={{ color: C.textMuted, fontSize: 12 }}>{today.sleepHours} h · eficiencia {today.sleepEfficiency}%</div>
        </div>
        <div style={{ color: C.teal, fontWeight: 700 }}>{today.sleepScore}</div>
      </div>

      {/* BANNER RIESGO */}
      {riskHigh && (
        <div style={{ background: "rgba(239,68,68,.12)", border: `1px solid ${riskColor}`, borderRadius: 16, padding: 14 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4 }}>
            <AlertTriangle size={18} color={riskColor} />
            <span style={{ color: riskColor, fontWeight: 700, fontSize: 14 }}>Alerta de riesgo</span>
          </div>
          <p style={{ color: C.text, fontSize: 13, lineHeight: 1.4, margin: "0 0 8px" }}>
            Tus señales hoy sugieren mayor riesgo. Reduce la intensidad y prioriza recuperación.
          </p>
          <button onClick={onBreathe} style={{ background: riskColor, color: "#fff", border: "none", borderRadius: 10, padding: "8px 12px", fontSize: 13, fontWeight: 600 }}>
            Respiración guiada
          </button>
        </div>
      )}

      {/* TARJETA ANÁLISIS TÉCNICO */}
      <button onClick={onOpenTech} style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 16, padding: 14, display: "flex", alignItems: "center", justifyContent: "space-between", cursor: "pointer", textAlign: "left" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <div style={{ background: C.bgSoft, borderRadius: 12, padding: 10 }}><Sparkles size={20} color={C.purple} /></div>
          <div>
            <div style={{ color: C.text, fontWeight: 600, fontSize: 14 }}>Análisis técnico</div>
            <div style={{ color: C.textMuted, fontSize: 12 }}>HRV, RHR, proyección de riesgo</div>
          </div>
        </div>
        <ChevronRight size={18} color={C.textMuted} />
      </button>

      {/* BOTÓN REGISTRAR */}
      <button onClick={onOpenDatos} style={{ background: C.accent, color: "#fff", border: "none", borderRadius: 16, padding: "13px 14px", fontSize: 14, fontWeight: 700, display: "flex", alignItems: "center", justifyContent: "center", gap: 8, cursor: "pointer" }}>
        <Database size={18} /> Registrar hábitos y sustancias
      </button>
    </div>
  );
}
