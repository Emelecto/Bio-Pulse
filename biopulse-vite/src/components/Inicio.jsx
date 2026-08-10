// ============================================================
// TAB INICIO — hub principal. Orden fijo que pidió el usuario:
//   1) BioScore (arriba)
//   2) Risk Score (debajo)
//   3) Resto: Sueño, banner riesgo, curva energía del día,
//      predicción de riesgo, respiración/meditación, Técnico, Registrar.
// ============================================================
import React, { useState } from "react";
import { Moon, AlertTriangle, ChevronRight, Database, Sparkles, Activity, Wind, TrendingUp } from "lucide-react";
import { C } from "./ui.jsx";
import BioScoreRing from "./BioScoreRing.jsx";
import RiskScoreRing from "./RiskScoreRing.jsx";
import { Sparkline } from "./ui.jsx";
import RiskForecast from "./RiskForecast.jsx";
import { useCoach } from "../coach/CoachContext.jsx";
import { computeEnergyMap, forecastRisk } from "../lib/bioUtils.js";

const GOAL_LABELS = { rendimiento: "Rendimiento", salud: "Salud", longevidad: "Longevidad", recovery: "Recuperación", peso: "Peso" };

export default function Inicio({ data, today, riskThreshold, userProfile, onOpenTech, onOpenDatos, onBreathe }) {
  const { openCoach } = useCoach();
  const riskHigh = (today?.riskScore ?? 0) >= (riskThreshold ?? 60);
  const riskColor = today?.riskLevel === "alto" ? "#ef4444" : today?.riskLevel === "moderado" ? "#f59e0b" : C.teal;

  const name = userProfile?.name;
  const goal = userProfile?.goal ? (GOAL_LABELS[userProfile.goal] || userProfile.goal) : null;
  const conditions = Array.isArray(userProfile?.conditions) ? userProfile.conditions : [];

  // Curva de energía del día y predicción de riesgo.
  const energy = computeEnergyMap(today, data);
  const energySeries = energy ? energy.samples.map((s) => s.v) : [];
  const forecast = forecastRisk(data);

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
      {/* SALUDO */}
      <div>
        <div style={{ color: C.textFaint, fontSize: 12, letterSpacing: "0.04em" }}>
          {name ? `Hola, ${name}` : "Hola"}
          {goal && <span style={{ color: C.teal }}> · {goal}</span>}
        </div>
        {conditions.length > 0 && (
          <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginTop: 6 }}>
            {conditions.map((c, i) => (
              <span key={i} style={{ background: C.bgSoft, border: `1px solid ${C.border}`, color: C.textMuted, fontSize: 11, padding: "2px 8px", borderRadius: 999 }}>
                {c}
              </span>
            ))}
          </div>
        )}
      </div>

      {/* 1) BIOSCORE (arriba, hero) */}
      <div style={{ background: `linear-gradient(160deg, ${C.card}, ${C.bgSoft})`, border: `1px solid ${C.border}`, borderRadius: 22, padding: 18, display: "flex", flexDirection: "column", alignItems: "center" }}>
        <BioScoreRing today={today} />
        <div style={{ color: C.textMuted, fontSize: 12, marginTop: 4 }}>Índice de bienestar y rendimiento</div>
      </div>

      {/* 2) RISK SCORE (debajo) */}
      <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 22, padding: 16, display: "flex", alignItems: "center", gap: 16 }}>
        <RiskScoreRing today={today} />
        <div style={{ flex: 1 }}>
          <div style={{ color: C.text, fontWeight: 700, fontSize: 15 }}>Score de riesgo</div>
          <div style={{ color: C.textMuted, fontSize: 12.5, marginTop: 2, lineHeight: 1.35 }}>
            Combinación de control de señales, fatiga y señales tempranas.{" "}
            <span style={{ color: riskColor, fontWeight: 600 }}>{today?.riskLevel || "BAJO"}</span>.
          </div>
          <button onClick={() => openCoach("¿Qué significa mi riesgo?")} style={{ marginTop: 8, background: "transparent", border: "none", color: C.teal, fontSize: 12.5, fontWeight: 600, padding: 0, cursor: "pointer" }}>
            Pregúntale al Coach →
          </button>
        </div>
      </div>

      {/* 3a) SUEÑO */}
      <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 16, padding: 14, display: "flex", alignItems: "center", gap: 12 }}>
        <div style={{ background: C.bgSoft, borderRadius: 12, padding: 10 }}><Moon size={20} color={C.teal} /></div>
        <div style={{ flex: 1 }}>
          <div style={{ color: C.text, fontWeight: 600, fontSize: 14 }}>Sueño</div>
          <div style={{ color: C.textMuted, fontSize: 12 }}>{today?.sleepHours} h · eficiencia {today?.sleepEfficiency}%</div>
        </div>
        <div style={{ color: C.teal, fontWeight: 700 }}>{today?.sleepScore}</div>
      </div>

      {/* 3b) BANNER DE RIESGO */}
      {riskHigh && (
        <div style={{ background: "rgba(239,68,68,.12)", border: `1px solid ${riskColor}`, borderRadius: 16, padding: 14 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4 }}>
            <AlertTriangle size={18} color={riskColor} />
            <span style={{ color: riskColor, fontWeight: 700, fontSize: 14 }}>Alerta de riesgo</span>
          </div>
          <p style={{ color: C.text, fontSize: 13, lineHeight: 1.4, margin: "0 0 8px" }}>
            Tus señales hoy sugieren mayor riesgo. Reduce la intensidad y prioriza recuperación.
          </p>
          <button onClick={() => openCoach("Dame un plan de hoy")} style={{ background: riskColor, color: "#fff", border: "none", borderRadius: 10, padding: "8px 12px", fontSize: 13, fontWeight: 600 }}>
            Ver plan con el Coach
          </button>
        </div>
      )}

      {/* 3c) CURVA DE ENERGÍA DEL DÍA */}
      <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 16, padding: 14 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8 }}>
          <Activity size={18} color={C.teal} />
          <span style={{ color: C.text, fontWeight: 600, fontSize: 14 }}>Curva de energía del día</span>
        </div>
        {energySeries.length >= 2 ? (
          <>
            <div style={{ background: C.bgSoft, borderRadius: 12, padding: "6px 4px" }}>
              <Sparkline data={energySeries} color={C.teal} height={56} />
            </div>
            <div style={{ display: "flex", justifyContent: "space-between", marginTop: 6 }}>
              <span style={{ color: C.textFaint, fontSize: 10.5 }}>08:00</span>
              <span style={{ color: C.textFaint, fontSize: 10.5 }}>15:00</span>
              <span style={{ color: C.textFaint, fontSize: 10.5 }}>22:00</span>
            </div>
            {energy?.chips?.length > 0 && (
              <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginTop: 8 }}>
                {energy.chips.map((c, i) => (
                  <span key={i} style={{ background: C.bgSoft, border: `1px solid ${C.border}`, color: C.textMuted, fontSize: 11, padding: "3px 8px", borderRadius: 999 }}>
                    {c.icon} {c.label} · {c.time}
                  </span>
                ))}
              </div>
            )}
          </>
        ) : (
          <div style={{ color: C.textFaint, fontSize: 12 }}>Cargando curva de energía…</div>
        )}
      </div>

      {/* 3d) PREDICCIÓN DE RIESGO */}
      {forecast && <RiskForecast forecast={forecast} />}

      {/* 3e) RESPIRACIÓN Y MEDITACIÓN (popup) */}
      <button onClick={onBreathe} style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 16, padding: 14, display: "flex", alignItems: "center", gap: 12, cursor: "pointer", textAlign: "left" }}>
        <div style={{ background: C.bgSoft, borderRadius: 12, padding: 10 }}><Wind size={20} color={C.purple} /></div>
        <div style={{ flex: 1 }}>
          <div style={{ color: C.text, fontWeight: 600, fontSize: 14 }}>Respiración y meditación</div>
          <div style={{ color: C.textMuted, fontSize: 12 }}>Baja el estrés y estabiliza tu HRV</div>
        </div>
        <ChevronRight size={18} color={C.textMuted} />
      </button>

      {/* 3f) ANÁLISIS TÉCNICO */}
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

      {/* 3g) REGISTRAR HÁBITOS */}
      <button onClick={onOpenDatos} style={{ background: C.teal, color: "#050A10", border: "none", borderRadius: 16, padding: "13px 14px", fontSize: 14, fontWeight: 700, display: "flex", alignItems: "center", justifyContent: "center", gap: 8, cursor: "pointer" }}>
        <Database size={18} /> Registrar hábitos y sustancias
      </button>
    </div>
  );
}
