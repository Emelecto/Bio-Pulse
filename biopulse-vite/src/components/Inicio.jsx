// ============================================================
// TAB INICIO — hub principal. Orden fijo que pidió el usuario:
//   1) BioScore (arriba)
//   2) Risk Score (debajo)
//   3) Resto: alerta banderas, insight del día, racha, Sueño,
//      curva energía, predicción de riesgo, respiración, Técnico, Registrar.
// ============================================================
import React, { useState } from "react";
import { Moon, AlertTriangle, ChevronRight, Database, Sparkles, Activity, Wind, TrendingUp, Lightbulb, Flame } from "lucide-react";
import { C } from "./ui.jsx";
import BioScoreRing from "./BioScoreRing.jsx";
import RiskScoreRing from "./RiskScoreRing.jsx";
import RiskForecast from "./RiskForecast.jsx";
import EnergyMap from "./EnergyMap.jsx";
import { useCoach } from "../coach/CoachContext.jsx";
import { computeEnergyMap, forecastRisk, correlate, topInsights, computeStreaks, presetLabel } from "../lib/bioUtils.js";
import { SAFETY_FLAGS, POSITIVE_PRESETS, AVOID_PRESETS } from "../lib/logPresets.js";

const GOAL_LABELS = { rendimiento: "Rendimiento", salud: "Salud", longevidad: "Longevidad", recovery: "Recuperación", peso: "Peso" };

export default function Inicio({ data, today, riskThreshold, userProfile, logs, onOpenTech, onOpenDatos, onBreathe }) {
  const { openCoach } = useCoach();
  const riskHigh = (today?.riskScore ?? 0) >= (riskThreshold ?? 60);
  const riskColor = today?.riskLevel === "alto" ? "#ef4444" : today?.riskLevel === "moderado" ? "#f59e0b" : C.teal;

  const name = userProfile?.name;
  const goal = userProfile?.goal ? (GOAL_LABELS[userProfile.goal] || userProfile.goal) : null;
  const conditions = Array.isArray(userProfile?.conditions) ? userProfile.conditions : [];

  // Curva de energía y predicción de riesgo.
  const energy = computeEnergyMap(today, data);
  const forecast = forecastRisk(data);

  // Logs del día de hoy (para banderas de seguridad e insights).
  const logArr = logs?.logs || [];
  const todayKey = new Date().toISOString().slice(0, 10);
  const todayIds = logArr.filter((l) => (l.ts || "").slice(0, 10) === todayKey).map((l) => l.preset);
  const flags = SAFETY_FLAGS.filter((f) => f.when.every((id) => todayIds.includes(id)));

  // Insights automáticos (punto 2) y rachas (punto 5).
  const corr = correlate(logArr, data);
  const insights = topInsights(corr, { minDelta: 5, limit: 2 });
  const streaks = computeStreaks(logArr, { positiveIds: POSITIVE_PRESETS, avoidIds: AVOID_PRESETS });

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

      {/* 3a) BANDERAS DE SEGURIDAD (alerta primaria, punto 3) */}
      {flags.length > 0 && (
        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          {flags.map((f) => (
            <div key={f.id} style={{ background: f.level === "danger" ? "rgba(255,0,85,.12)" : f.level === "warn" ? "rgba(245,158,11,.12)" : "rgba(0,245,212,.10)", border: `1px solid ${f.level === "danger" ? C.rose : f.level === "warn" ? C.amber : C.teal}`, borderRadius: 16, padding: 14, display: "flex", gap: 10 }}>
              <AlertTriangle size={18} color={f.level === "danger" ? C.rose : f.level === "warn" ? C.amber : C.teal} style={{ flexShrink: 0, marginTop: 2 }} />
              <div style={{ flex: 1 }}>
                <div style={{ color: C.text, fontWeight: 700, fontSize: 13, marginBottom: 2 }}>Alerta de seguridad</div>
                <span style={{ color: C.text, fontSize: 12.5, lineHeight: 1.4 }}>{f.msg}</span>
              </div>
              <button onClick={onOpenDatos} style={{ background: "transparent", border: "none", color: C.teal, fontSize: 12, fontWeight: 600, cursor: "pointer", flexShrink: 0 }}>Ver</button>
            </div>
          ))}
        </div>
      )}

      {/* 3b) INSIGHT DEL DÍA (punto 2, proactivo) */}
      {insights.length > 0 && (
        <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 16, padding: 14 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8 }}>
            <Lightbulb size={18} color={C.teal} />
            <span style={{ color: C.text, fontWeight: 600, fontSize: 14 }}>Insight del día</span>
          </div>
          {insights.map((ins, i) => (
            <div key={i} style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: i < insights.length - 1 ? 8 : 0 }}>
              <span style={{ width: 7, height: 7, borderRadius: 999, background: ins.improved ? C.teal : C.rose, flexShrink: 0 }} />
              <span style={{ color: C.text, fontSize: 13 }}>
                <b style={{ color: C.teal }}>{presetLabel(ins.id)}</b> → {ins.label} {ins.deltaPct > 0 ? "subió" : "bajó"} {Math.abs(ins.deltaPct)}%
                {ins.improved ? " (¡bien!)" : ""}
              </span>
            </div>
          ))}
          <button onClick={() => openCoach("Explícame mi correlación de hoy")} style={{ marginTop: 8, background: "transparent", border: "none", color: C.teal, fontSize: 12.5, fontWeight: 600, padding: 0, cursor: "pointer" }}>
            Pregúntale al Coach →
          </button>
        </div>
      )}

      {/* 3c) RACHA DE HÁBITOS SALUDABLES (punto 5) */}
      {streaks.length > 0 && (
        <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 16, padding: 14 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8 }}>
            <Flame size={18} color={C.amber} />
            <span style={{ color: C.text, fontWeight: 600, fontSize: 14 }}>Tu racha</span>
          </div>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
            {streaks.slice(0, 4).map((s, i) => (
              <span key={i} style={{ background: C.bgSoft, border: `1px solid ${C.border}`, borderRadius: 999, padding: "4px 10px", display: "flex", alignItems: "center", gap: 6 }}>
                <span style={{ color: C.amber, fontWeight: 700, fontSize: 13 }}>{s.count}🔥</span>
                <span style={{ color: C.textMuted, fontSize: 12 }}>{presetLabel(s.presetId)}</span>
              </span>
            ))}
          </div>
        </div>
      )}

      {/* 3d) SUEÑO */}
      <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 16, padding: 14, display: "flex", alignItems: "center", gap: 12 }}>
        <div style={{ background: C.bgSoft, borderRadius: 12, padding: 10 }}><Moon size={20} color={C.teal} /></div>
        <div style={{ flex: 1 }}>
          <div style={{ color: C.text, fontWeight: 600, fontSize: 14 }}>Sueño {data?.some((d) => d.sleepEstimated) && <span style={{ color: C.purple, fontSize: 11, fontWeight: 500, marginLeft: 4 }}>≈ proxy</span>}</div>
          <div style={{ color: C.textMuted, fontSize: 12 }}>{today?.sleepHours} h · eficiencia {today?.sleepEfficiency}%</div>
        </div>
        <div style={{ color: C.teal, fontWeight: 700 }}>{today?.sleepScore}</div>
      </div>

      {/* 3e) BANNER DE RIESGO */}
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

      {/* 3f) CURVA DE ENERGÍA DEL DÍA (misma estética que Técnico) */}
      <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 16, padding: 14 }}>
        {energy ? (
          <EnergyMap map={energy} />
        ) : (
          <div style={{ color: C.textFaint, fontSize: 12 }}>Cargando curva de energía…</div>
        )}
      </div>

      {/* 3g) PREDICCIÓN DE RIESGO */}
      {forecast && <RiskForecast forecast={forecast} />}

      {/* 3h) RESPIRACIÓN Y MEDITACIÓN (popup) */}
      <button onClick={onBreathe} style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 16, padding: 14, display: "flex", alignItems: "center", gap: 12, cursor: "pointer", textAlign: "left" }}>
        <div style={{ background: C.bgSoft, borderRadius: 12, padding: 10 }}><Wind size={20} color={C.purple} /></div>
        <div style={{ flex: 1 }}>
          <div style={{ color: C.text, fontWeight: 600, fontSize: 14 }}>Respiración y meditación</div>
          <div style={{ color: C.textMuted, fontSize: 12 }}>Baja el estrés y estabiliza tu HRV</div>
        </div>
        <ChevronRight size={18} color={C.textMuted} />
      </button>

      {/* 3i) ANÁLISIS TÉCNICO */}
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

      {/* 3j) REGISTRAR HÁBITOS */}
      <button onClick={onOpenDatos} style={{ background: C.teal, color: "#050A10", border: "none", borderRadius: 16, padding: "13px 14px", fontSize: 14, fontWeight: 700, display: "flex", alignItems: "center", justifyContent: "center", gap: 8, cursor: "pointer" }}>
        <Database size={18} /> Registrar hábitos y sustancias
      </button>
    </div>
  );
}
