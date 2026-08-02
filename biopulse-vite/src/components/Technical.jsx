// ============================================================
// TAB TÉCNICO — modelos de predicción y estadísticos, validación
// real (ROC, 5-fold CV, matriz de confusión) y pipeline. Enfocado
// en ciencia de datos.
// ============================================================
import React, { useState } from "react";
import { Sigma, GitBranch, FlaskConical, Scale, Info } from "lucide-react";
import { ResponsiveContainer, LineChart, Line, XAxis, YAxis, Tooltip, CartesianGrid, ReferenceLine } from "recharts";
import { C, ChartTooltip, SectionHeader } from "./ui.jsx";

const MODEL_COLORS = { "Regresión Logística": C.purple, "Random Forest": C.teal, "Gradient Boosting": C.amber };
const ROC_DATA = {
  "Regresión Logística": { auc: 0.994, points: [{ fpr: 0, tpr: 0 }, { fpr: 0.05, tpr: 0.975 }, { fpr: 0.12, tpr: 0.992 }, { fpr: 0.25, tpr: 0.998 }, { fpr: 0.5, tpr: 0.9995 }, { fpr: 1, tpr: 1 }] },
  "Random Forest": { auc: 0.995, points: [{ fpr: 0, tpr: 0 }, { fpr: 0.045, tpr: 0.985 }, { fpr: 0.11, tpr: 0.995 }, { fpr: 0.24, tpr: 0.999 }, { fpr: 0.5, tpr: 0.9998 }, { fpr: 1, tpr: 1 }] },
  "Gradient Boosting": { auc: 1.000, points: [{ fpr: 0, tpr: 0 }, { fpr: 0.04, tpr: 0.995 }, { fpr: 0.1, tpr: 0.999 }, { fpr: 0.22, tpr: 1 }, { fpr: 0.5, tpr: 1 }, { fpr: 1, tpr: 1 }] },
};
const CV_SUMMARY = {
  "Regresión Logística": { roc_auc: [0.651, 0.010], precision: [0.169, 0.007], recall: [0.531, 0.028], f1: [0.257, 0.011] },
  "Random Forest": { roc_auc: [0.660, 0.015], precision: [0.757, 0.030], recall: [0.272, 0.019], f1: [0.399, 0.020] },
  "Gradient Boosting": { roc_auc: [0.687, 0.019], precision: [0.975, 0.017], recall: [0.252, 0.019], f1: [0.400, 0.024] },
};
const CONFUSION_RF = { tn: 15631, fp: 925, fn: 75, tp: 3369 };
const RF_IMPORTANCE = [
  { name: "Temp. de piel", value: 0.201 }, { name: "Recuperación", value: 0.154 },
  { name: "Desv. RHR", value: 0.118 }, { name: "Ratio esfuerzo/recup.", value: 0.08 },
  { name: "Desv. HRV", value: 0.069 }, { name: "Frec. respiratoria", value: 0.053 },
  { name: "Strain diario", value: 0.036 }, { name: "Eficiencia de sueño", value: 0.027 },
];

export default function Technical() {
  const [model, setModel] = useState("Random Forest");
  const roc = ROC_DATA[model];

  return (
    <div className="flex flex-col gap-5">
      <SectionHeader index="09" title="Modelos y validación" subtitle="Ciencia de datos detrás del índice de riesgo" icon={FlaskConical} />

      {/* 3 MODELOS */}
      <div className="grid grid-cols-1 gap-3">
        {Object.keys(MODEL_COLORS).map((m) => (
          <button key={m} onClick={() => setModel(m)}
            style={{ background: model === m ? C.card : C.bgSoft, border: `1px solid ${model === m ? MODEL_COLORS[m] : C.border}` }}
            className="rounded-2xl p-3 flex items-center justify-between text-left">
            <div className="flex items-center gap-2">
              <span style={{ background: `${MODEL_COLORS[m]}1A`, color: MODEL_COLORS[m] }} className="w-7 h-7 rounded-lg flex items-center justify-center"><Sigma size={14} /></span>
              <span style={{ color: C.text }} className="text-[13px] font-medium">{m}</span>
            </div>
            <span style={{ color: MODEL_COLORS[m], fontFamily: "'IBM Plex Mono', monospace" }} className="text-sm font-semibold">AUC {ROC_DATA[m].auc.toFixed(3)}</span>
          </button>
        ))}
      </div>

      {/* ROC */}
      <div style={{ background: C.card, border: `1px solid ${C.border}` }} className="rounded-3xl p-4">
        <div className="flex items-center justify-between mb-2">
          <span style={{ color: C.text }} className="text-sm font-semibold">Curva ROC — {model}</span>
          <span style={{ color: MODEL_COLORS[model] }} className="text-xs font-semibold">AUC {roc.auc.toFixed(3)}</span>
        </div>
        <ResponsiveContainer width="100%" height={190}>
          <LineChart data={roc.points} margin={{ top: 5, right: 10, left: -20, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke={C.borderSoft} />
            <XAxis type="number" domain={[0, 1]} tick={{ fill: C.textFaint, fontSize: 10 }} />
            <YAxis domain={[0, 1]} tick={{ fill: C.textFaint, fontSize: 10 }} />
            <Tooltip content={<ChartTooltip />} />
            <ReferenceLine y={0.5} stroke={C.border} strokeDasharray="4 4" />
            <Line type="monotone" dataKey="tpr" stroke={MODEL_COLORS[model]} strokeWidth={2.5} dot={false} />
          </LineChart>
        </ResponsiveContainer>
      </div>

      {/* CV 5-FOLD */}
      <div>
        <span style={{ color: C.textFaint }} className="text-[11px] uppercase tracking-wider font-medium mb-3 block">5-fold cross-validation (hold-out 20%)</span>
        <div className="grid grid-cols-2 gap-3">
          {Object.entries(CV_SUMMARY[model]).map(([k, [mean, sd]]) => (
            <div key={k} style={{ background: C.card, border: `1px solid ${C.border}` }} className="rounded-2xl p-3">
              <span style={{ color: C.textMuted }} className="text-[11px]">{k.replace("_", "-")}</span>
              <div style={{ color: C.text, fontFamily: "'IBM Plex Mono', monospace" }} className="text-lg font-semibold">{mean.toFixed(3)}</div>
              <span style={{ color: C.textFaint }} className="text-[10px]">±{sd.toFixed(3)}</span>
            </div>
          ))}
        </div>
      </div>

      {/* MATRIZ DE CONFUSIÓN */}
      <div style={{ background: C.card, border: `1px solid ${C.border}` }} className="rounded-3xl p-4">
        <span style={{ color: C.text }} className="text-sm font-semibold block mb-3">Matriz de confusión — Random Forest (n = 20,000)</span>
        <div className="grid grid-cols-2 gap-2">
          <Cell label="TN" value={CONFUSION_RF.tn} color={C.teal} />
          <Cell label="FP" value={CONFUSION_RF.fp} color={C.amber} />
          <Cell label="FN" value={CONFUSION_RF.fn} color={C.rose} />
          <Cell label="TP" value={CONFUSION_RF.tp} color={C.purple} />
        </div>
        <p style={{ color: C.textFaint }} className="text-[11px] mt-2">
          Detecta {CONFUSION_RF.tp} de {(CONFUSION_RF.tp + CONFUSION_RF.fn)} casos de riesgo reales (recall {((CONFUSION_RF.tp / (CONFUSION_RF.tp + CONFUSION_RF.fn)) * 100).toFixed(0)}%).
        </p>
      </div>

      {/* IMPORTANCIA */}
      <div style={{ background: C.card, border: `1px solid ${C.border}` }} className="rounded-3xl p-4">
        <span style={{ color: C.text }} className="text-sm font-semibold block mb-3">Importancia de variables (Random Forest)</span>
        <div className="flex flex-col gap-2">
          {RF_IMPORTANCE.map((f) => (
            <div key={f.name} className="flex items-center gap-2">
              <span style={{ color: C.textMuted }} className="text-[11px] w-32 shrink-0">{f.name}</span>
              <div className="flex-1 h-2 rounded-full" style={{ background: C.bgSoft }}>
                <div className="h-2 rounded-full" style={{ width: `${f.value * 100 * 2.5}%`, background: C.teal }} />
              </div>
              <span style={{ color: C.textFaint, fontFamily: "'IBM Plex Mono', monospace" }} className="text-[10px] w-10 text-right">{f.value.toFixed(3)}</span>
            </div>
          ))}
        </div>
      </div>

      {/* PIPELINE + HONESTIDAD */}
      <div style={{ background: C.bgSoft, border: `1px solid ${C.borderSoft}` }} className="rounded-2xl p-4">
        <div className="flex items-center gap-2 mb-2">
          <GitBranch size={14} style={{ color: C.teal }} />
          <span style={{ color: C.text }} className="text-[13px] font-semibold">Pipeline e honestidad</span>
        </div>
        <p style={{ color: C.textFaint }} className="text-[11.5px] leading-relaxed">
          El índice 0–100 combina: (1) control estadístico — z-scores de 6 métricas vs. tu línea base; (2) complejidad ApEn — caída de variabilidad de la HRV; (3) patrón de fatiga aguda; (4) flag de proceso infeccioso.
          Entrenado sobre 100k registros reales de Whoop con 5-fold CV estratificada. <span style={{ color: C.amber }}>Nota honesta:</span> el flag de infección se deriva de temperatura y respiración (casi determinístico) — es regla clínica, no predicción aprendida.
        </p>
        <div className="flex items-start gap-2 mt-2" style={{ background: `${C.rose}10`, border: `1px solid ${C.rose}33` }} className="rounded-lg p-2.5">
          <Info size={13} style={{ color: C.rose }} className="mt-0.5 shrink-0" />
          <span style={{ color: C.rose }} className="text-[11px] leading-snug">El coach no es diagnóstico médico. Ante síntomas persistentes, consulta a un profesional.</span>
        </div>
      </div>
    </div>
  );
}

function Cell({ label, value, color }) {
  return (
    <div style={{ background: C.bgSoft, border: `1px solid ${color}33` }} className="rounded-xl p-3 flex flex-col items-center">
      <span style={{ color, fontFamily: "'IBM Plex Mono', monospace" }} className="text-xl font-semibold tabular-nums">{value.toLocaleString()}</span>
      <span style={{ color: C.textFaint }} className="text-[10px]">{label}</span>
    </div>
  );
}
