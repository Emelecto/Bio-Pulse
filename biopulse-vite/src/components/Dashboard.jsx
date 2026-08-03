// ============================================================
// TAB DASHBOARD — bienvenida con medidor principal configurable,
// métricas secundarias y el COACH ASISTENTE DE IA.
// ============================================================
import React, { useState } from "react";
import { Moon, Footprints, Flame, Heart, Wind, BatteryMedium, Activity, AlertTriangle, Info, Settings2, Sparkles } from "lucide-react";
import { C, riskColor, MetricCard, SectionHeader } from "./ui.jsx";
import BioScoreRing from "./BioScoreRing.jsx";
import RiskScoreRing from "./RiskScoreRing.jsx";
import { getActionPlan } from "../coach/coachEngine.js";
import { useCoach } from "../coach/CoachContext.jsx";

// Métricas que el usuario puede poner en el medidor principal.
const PRIMARY_OPTIONS = [
  { key: "riskScore", label: "Riesgo", icon: Activity, color: C.rose, get: (t) => t.riskScore, unit: "/100", fmt: (v) => v },
  { key: "sleepScore", label: "Sueño", icon: Moon, color: C.teal, get: (t) => t.sleepScore, unit: "/100", fmt: (v) => v },
  { key: "fatigueScore", label: "Fatiga", icon: Flame, color: C.amber, get: (t) => t.fatigueScore, unit: "/100", fmt: (v) => v },
  { key: "recovery", label: "Recuperación", icon: BatteryMedium, color: C.teal, get: (t) => t.recovery, unit: "%", fmt: (v) => v },
  { key: "stressScore", label: "Estrés", icon: Wind, color: C.purple, get: (t) => t.stressScore, unit: "/100", fmt: (v) => v },
];

const SECONDARY_METRICS = [
  { key: "hrv", label: "HRV", icon: Heart, unit: "ms", color: C.teal },
  { key: "rhr", label: "RHR", icon: Activity, unit: "bpm", color: C.purple },
  { key: "vo2max", label: "VO2 max", icon: Flame, unit: "ml/kg", color: C.amber, get: (t) => Math.round(42 + (t.recovery - 60) * 0.3 + (t.hrv - 42) * 0.2) },
  { key: "resp", label: "Frec. respiratoria", icon: Wind, unit: "rpm", color: C.purple },
  { key: "steps", label: "Pasos", icon: Footprints, unit: "", color: C.purple },
  { key: "sleepHours", label: "Horas sueño", icon: Moon, unit: "h", color: C.teal },
];

export default function Dashboard({ data, today, riskThreshold, onOpenSettings, onOpenCoachSettings, onBreathe }) {
  const { openCoach } = useCoach();
  const [primary, setPrimary] = useState("riskScore");
  const [visibleSecondary, setVisibleSecondary] = useState(SECONDARY_METRICS.map((m) => m.key));

  const primaryDef = PRIMARY_OPTIONS.find((p) => p.key === primary) || PRIMARY_OPTIONS[0];
  const primaryValue = primaryDef.get(today);
  const rColor = riskColor(today.riskLevel);

  const toggleSecondary = (k) => {
    setVisibleSecondary((cur) =>
      cur.includes(k) ? cur.filter((x) => x !== k) : [...cur, k]
    );
  };

  return (
    <div className="flex flex-col gap-5">
      {/* HERO: BioScore (bienestar, mayor = mejor) */}
      <div style={{ background: `linear-gradient(160deg, ${C.card}, ${C.bgSoft})`, border: `1px solid ${C.border}` }} className="rounded-3xl p-5 pt-4 relative overflow-hidden tab-fade-in">
        <div className="relative flex items-center justify-between mb-1">
          <span style={{ color: C.textFaint }} className="flex items-center gap-1 text-[11px] uppercase tracking-wider font-medium">
            <Sparkles size={11} /> BioScore
          </span>
        </div>
        <div className="relative flex flex-col items-center gap-2 pt-2">
          <BioScoreRing today={today} onBreathe={onBreathe} />
          {onBreathe && (
            <button
              onClick={onBreathe}
              style={{ background: "transparent", color: C.teal, border: `1px solid ${C.teal}44` }}
              className="text-[12px] font-semibold px-3.5 py-1.5 rounded-full active:scale-95 transition-transform flex items-center gap-1.5"
              aria-label="Iniciar respiración guiada"
            >
              <span style={{ fontSize: 13, lineHeight: 1 }}>◐</span> Respirar 2 min
            </button>
          )}
          <p style={{ color: C.textMuted }} className="text-[13px] leading-snug max-w-[18rem] text-center">
            {today.bioLevel === "BUENO" ? "Tu bienestar está alto. Mantén tus hábitos actuales." : today.bioLevel === "MEDIO" ? "Bienestar aceptable. Hay margen para mejorar tu recuperación." : "Bienestar bajo: prioriza descanso y sueño hoy."}
          </p>
        </div>
      </div>

      {/* SECCION RIESGO: score de riesgo (anomalias/fatiga), mas pequeña pero detallada */}
      <div style={{ background: C.card, border: `1px solid ${C.border}` }} className="glass rounded-3xl p-4 tab-fade-in">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            <div style={{ background: `${rColor}1A`, color: rColor }} className="w-8 h-8 rounded-xl flex items-center justify-center">
              <AlertTriangle size={16} />
            </div>
            <div>
              <span style={{ color: C.text }} className="text-sm font-semibold block">Score de riesgo</span>
              <span style={{ color: C.textFaint }} className="text-[10px]">Fatiga / anomalías fisiológicas</span>
            </div>
          </div>
          <span style={{ color: rColor, background: `${rColor}1A`, border: `1px solid ${rColor}44` }} className="text-[11px] font-bold px-2.5 py-1 rounded-full tabular-nums">
            {today.riskLevel}
          </span>
        </div>
        {/* Ring pequeño y centrado */}
        <div className="flex justify-center py-2">
          <RiskScoreRing today={today} />
        </div>
        <p style={{ color: C.textMuted }} className="text-[12px] leading-snug mt-1 text-center">
          {today.riskLevel === "BAJO" ? "Sin señales de riesgo fuera de tu rango habitual." : "Detectamos señales fuera de tu rango habitual en los últimos días."}
        </p>
        {today.flags.length > 0 && (
          <div className="w-full mt-2 space-y-1">
            {today.flags.map((fl, i) => (
              <div key={i} className="flex items-start gap-1.5">
                <AlertTriangle size={13} style={{ color: C.amber }} className="mt-0.5 shrink-0" />
                <span style={{ color: C.amber }} className="text-[12px] leading-snug">{fl}</span>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* PLAN DE HOY: alerta accionable de 3 pasos (Coach) cuando el riesgo != BAJO */}
      {(() => {
        const plan = getActionPlan(today);
        if (!plan) return null;
        const accent = plan.level === "ALTO" ? C.rose : C.amber;
        return (
          <div style={{ background: `${accent}12`, border: `1px solid ${accent}44` }} className="glass rounded-3xl p-4 tab-fade-in">
            <div className="flex items-center gap-2 mb-2">
              <div style={{ background: `${accent}1A`, color: accent }} className="w-8 h-8 rounded-xl flex items-center justify-center">
                <AlertTriangle size={16} />
              </div>
              <div>
                <span style={{ color: C.text }} className="text-sm font-semibold block">Plan de hoy</span>
                <span style={{ color: C.textFaint }} className="text-[10px]">{plan.title} · riesgo {plan.level}</span>
              </div>
            </div>
            <ol className="space-y-1.5 mt-1">
              {plan.steps.map((s, i) => (
                <li key={i} className="flex items-start gap-2">
                  <span style={{ background: accent, color: C.bg }} className="shrink-0 w-5 h-5 rounded-full flex items-center justify-center text-[11px] font-bold mt-0.5">{i + 1}</span>
                  <span style={{ color: C.text }} className="text-[12.5px] leading-snug">{s}</span>
                </li>
              ))}
            </ol>
          </div>
        );
      })()}

      {/* CTA COACH: abre el asistente flotante (el chat vive en <Coach/>) */}
      <button
        onClick={openCoach}
        style={{ background: C.card, border: `1px solid ${C.teal}55` }}
        className="glass rounded-3xl p-4 tab-fade-in w-full flex items-center gap-3 active:scale-[0.99] transition-transform text-left"
      >
        <div style={{ background: `${C.teal}1A`, color: C.teal }} className="w-9 h-9 rounded-xl flex items-center justify-center">
          <Sparkles size={18} />
        </div>
        <div className="min-w-0">
          <span style={{ color: C.text }} className="text-sm font-semibold block">Coach BioPulse</span>
          <span style={{ color: C.textMuted }} className="text-[11px]">Toca el ícono ◆ para preguntarle sobre tus métricas.</span>
        </div>
      </button>

      {/* SECUNDARIAS */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <span style={{ color: C.textFaint }} className="text-[11px] uppercase tracking-wider font-medium">Métricas de hoy</span>
          <button onClick={onOpenSettings} style={{ color: C.textMuted }} className="text-[11px] flex items-center gap-1">
            <Settings2 size={11} /> Editar
          </button>
        </div>
        <div className="grid grid-cols-2 gap-3">
          {SECONDARY_METRICS.filter((m) => visibleSecondary.includes(m.key)).map((m) => {
            const val = m.get ? m.get(today) : today[m.key];
            return (
              <MetricCard key={m.key} icon={m.icon} label={m.label} value={val} unit={m.unit} accent={m.color}
                sparkData={data.slice(-7).map((d) => (m.get ? m.get(d) : d[m.key]))}
                delta={data.length > 8 ? (val - (m.get ? m.get(data[data.length - 8]) : data[data.length - 8][m.key])) : undefined} />
            );
          })}
        </div>
      </div>

      {/* Settings rápido de layout (medidor + secundarias) */}
      {onOpenCoachSettings && null}
    </div>
  );
}
