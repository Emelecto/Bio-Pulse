// ============================================================
// TAB DASHBOARD — bienvenida con medidor principal configurable,
// métricas secundarias y el COACH ASISTENTE DE IA.
// ============================================================
import React, { useMemo, useState, useEffect } from "react";
import { Moon, Footprints, Flame, Heart, Wind, BatteryMedium, Activity, AlertTriangle, Info, Settings2, Sparkles } from "lucide-react";
import { C, riskColor, RiskGauge, PulseRibbon, MetricCard, SectionHeader } from "./ui.jsx";
import { getCoachAdvice } from "../coach/coachEngine.js";

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

export default function Dashboard({ data, today, riskThreshold, onOpenSettings, onOpenCoachSettings }) {
  const [primary, setPrimary] = useState("riskScore");
  const [visibleSecondary, setVisibleSecondary] = useState(SECONDARY_METRICS.map((m) => m.key));

  // COACH: consejo coherente con métricas, rota al entrar, usa LLM si hay backend.
  const [advice, setAdvice] = useState(null);
  useEffect(() => {
    let alive = true;
    getCoachAdvice(today, {
      callLLM: async (t) => {
        try {
          const base = import.meta.env.VITE_COACH_API || "/api/coach";
          const res = await fetch(base, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ metrics: t }),
          });
          if (!res.ok) throw new Error("no llm");
          const j = await res.json();
          return j.advice;
        } catch { return null; }
      },
    }).then((a) => alive && setAdvice(a));
    return () => { alive = false; };
  }, [today]);

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
      {/* HERO: medidor principal configurable */}
      <div style={{ background: `linear-gradient(160deg, ${C.card}, ${C.bgSoft})`, border: `1px solid ${C.border}` }} className="rounded-3xl p-5 pt-4 relative overflow-hidden">
        <div className="absolute top-0 left-0 right-0 opacity-70">
          <PulseRibbon values={data.slice(-30).map((d) => d.hrv)} />
        </div>
        <div className="relative pt-4 flex items-center justify-between mb-1">
          <button onClick={onOpenSettings} style={{ color: C.textFaint }} className="flex items-center gap-1 text-[11px] uppercase tracking-wider font-medium">
            <Settings2 size={11} /> {primaryDef.label}
          </button>
          <span style={{ color: C.teal, background: `${C.teal}14`, border: `1px solid ${C.teal}40` }} className="text-[9px] font-semibold px-2 py-0.5 rounded-full flex items-center gap-1">
            <Info size={10} /> En tu dispositivo
          </span>
        </div>
        <div className="relative flex items-center gap-5">
          <RiskGauge score={primaryValue} level={primaryDef.key === "riskScore" ? today.riskLevel : (primaryValue > 66 ? "BAJO" : primaryValue > 33 ? "MODERADO" : "ALTO")} />
          <div className="flex-1 min-w-0">
            <span style={{ color: primaryDef.color, background: `${primaryDef.color}1A`, border: `1px solid ${primaryDef.color}44` }} className="inline-block text-xs font-semibold px-2.5 py-1 rounded-full mb-2">
              {primaryDef.label.toUpperCase()} {primaryValue}{primaryDef.unit}
            </span>
            <p style={{ color: C.textMuted }} className="text-[13px] leading-snug">
              {today.riskLevel === "BAJO" ? "Tus métricas están dentro de tu rango habitual." : "Detectamos señales fuera de tu rango habitual en los últimos días."}
            </p>
            {today.flags.length > 0 && (
              <div className="mt-2 space-y-1">
                {today.flags.map((fl, i) => (
                  <div key={i} className="flex items-start gap-1.5">
                    <AlertTriangle size={13} style={{ color: C.amber }} className="mt-0.5 shrink-0" />
                    <span style={{ color: C.amber }} className="text-[12px] leading-snug">{fl}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* COACH ASISTENTE DE IA */}
      <div style={{ background: C.card, border: `1px solid ${C.teal}55` }} className="rounded-3xl p-4">
        <div className="flex items-center gap-2 mb-2">
          <div style={{ background: `${C.teal}1A`, color: C.teal }} className="w-8 h-8 rounded-xl flex items-center justify-center">
            <Sparkles size={16} />
          </div>
          <div>
            <span style={{ color: C.text }} className="text-sm font-semibold block">Coach BioPulse</span>
            <span style={{ color: C.textFaint }} className="text-[10px]">{advice?.source === "llm" ? "IA (Gemini)" : "Asistente de bienestar"}</span>
          </div>
        </div>
        {advice && (
          <div className="flex items-start gap-2">
            <Info size={14} style={{ color: C.teal }} className="mt-0.5 shrink-0" />
            <div>
              <span style={{ color: C.teal }} className="text-[13px] font-semibold leading-snug block">{advice.title}</span>
              <span style={{ color: C.text }} className="text-[13px] leading-snug block">{advice.advice}</span>
            </div>
          </div>
        )}
      </div>

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
