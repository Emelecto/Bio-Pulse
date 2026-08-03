// ============================================================
// TAB SLEEP — calidad de sueño centrada en la noche seleccionada:
// hero Sleep Score (anillo) + metricas de ESA noche, y grafico
// donde el usuario elige ver cualquier noche en detalle.
// El Sleep Score se calcula con un modelo de prediccion (bioUtils)
// desde las metricas reales de la noche (no se inventan datos).
// ============================================================
import React, { useState } from "react";
import { Moon, BedDouble, Clock, Zap, HeartPulse, Activity, Lightbulb } from "lucide-react";
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid, Cell } from "recharts";
import { C, ChartTooltip } from "./ui.jsx";
import SleepScoreRing from "./SleepScoreRing.jsx";
import { computeSleepScore } from "../lib/bioUtils.js";

export default function Sleep({ data, onBreathe }) {
  const [range, setRange] = useState(14);
  const [selectedIdx, setSelectedIdx] = useState(data.length - 1); // noche anterior por defecto
  const sleepDays = data.slice(-range);

  // La noche que se muestra en detalle (por defecto la ultima).
  const selInView = Math.max(0, Math.min(selectedIdx, data.length - 1));
  const night = data[selInView];
  const sleepObj = computeSleepScore(night);
  const deepMin = Math.round(sleepObj.deepSleepFrac * night.sleepHours * 60);
  const sleepRhr = sleepObj.sleepRhr;

  // calidad por dia (score + horas) para el grafico
  const chart = sleepDays.map((d, i) => {
    const globalIdx = data.indexOf(d);
    return {
      name: `${d.date.getDate()}/${d.date.getMonth() + 1}`,
      horas: d.sleepHours,
      score: computeSleepScore(d).score,
      idx: globalIdx,
    };
  });

  // Consejos segun la noche seleccionada (no promedio).
  const tips = [];
  if (night.sleepHours < 7) tips.push("Dormiste poco esta noche. Subir a 7–8 h mejora HRV y recuperación.");
  if (night.sleepEff < 85) tips.push("Eficiencia baja: reduce pantallas y luz 1 h antes de dormir.");
  if (night.wakeUps > 2) tips.push("Despertadas frecuentes: evita cafeína tarde y controla la temperatura de la habitación.");
  if (sleepObj.score >= 85) tips.push("Buena calidad de sueño esta noche. Mantén tu rutina para sostenerla.");
  if (tips.length === 0) tips.push("Tus métricas de sueño de esta noche son sólidas. Sigue así y vigila consistencia.");

  // Mini metrica de la noche (reusa el estilo de tarjeta).
  const MiniStat = ({ icon: Icon, label, value, unit, color }) => (
    <div style={{ background: C.card, border: `1px solid ${C.border}` }} className="glass rounded-2xl p-3 flex flex-col gap-1.5">
      <div className="flex items-center gap-1.5">
        <div style={{ background: `${color}1A`, color }} className="w-6 h-6 rounded-lg flex items-center justify-center"><Icon size={13} /></div>
        <span style={{ color: C.textMuted }} className="text-[10.5px] font-medium leading-tight">{label}</span>
      </div>
      <div className="flex items-baseline gap-1">
        <span style={{ color: C.text, fontFamily: "'IBM Plex Mono', monospace" }} className="text-xl font-semibold tabular-nums">{value}</span>
        <span style={{ color: C.textFaint }} className="text-[10px]">{unit}</span>
      </div>
    </div>
  );

  return (
    <div className="flex flex-col gap-5">
      {/* HERO: Sleep Score de la noche seleccionada */}
      <div style={{ background: `linear-gradient(160deg, ${C.card}, ${C.bgSoft})`, border: `1px solid ${C.border}` }} className="rounded-3xl p-5 pt-4 relative overflow-hidden flex flex-col items-center">
        <span style={{ color: C.textFaint }} className="text-[11px] uppercase tracking-wider font-medium mb-2 self-start">
          {selInView === data.length - 1 ? "Noche anterior" : `Noche del ${night.date.getDate()}/${night.date.getMonth() + 1}`}
        </span>
        <SleepScoreRing night={night} scoreObj={sleepObj} />
        <div className="grid grid-cols-3 gap-2.5 w-full mt-4">
          <MiniStat icon={Clock} label="Horas dormidas" value={night.sleepHours} unit="h" color={C.teal} />
          <MiniStat icon={Moon} label="Sueño profundo" value={deepMin} unit="min" color={C.purple} />
          <MiniStat icon={HeartPulse} label="RHR en sueño" value={sleepRhr} unit="bpm" color={C.rose} />
        </div>
        {onBreathe && sleepObj.score < 70 && (
          <button
            onClick={onBreathe}
            style={{ background: `${C.teal}1A`, color: C.teal, border: `1px solid ${C.teal}44` }}
            className="mt-3 text-[12px] font-semibold px-3.5 py-1.5 rounded-full active:scale-95 transition-transform flex items-center gap-1.5"
          >
            <span style={{ fontSize: 13, lineHeight: 1 }}>◐</span> Respira 2 min para bajar la carga
          </button>
        )}
      </div>

      {/* DETALLE DE LA NOCHE SELECCIONADA */}
      <div>
        <span style={{ color: C.textFaint }} className="text-[11px] uppercase tracking-wider font-medium mb-3 block">Detalle de la noche</span>
        <div className="grid grid-cols-2 gap-3">
          <SleepStat icon={Zap} label="Eficiencia" value={night.sleepEff} unit="%" color={C.amber} />
          <SleepStat icon={BedDouble} label="Despertadas" value={night.wakeUps} unit="" color={C.rose} />
          <SleepStat icon={Activity} label="HRV" value={night.hrv} unit="ms" color={C.teal} />
          <SleepStat icon={HeartPulse} label="RHR" value={night.rhr} unit="bpm" color={C.purple} />
        </div>
      </div>

      {/* GRAFICO CON SELECTOR DE NOCHE */}
      <div style={{ background: C.card, border: `1px solid ${C.border}` }} className="glass rounded-3xl p-4">
        <div className="flex items-center justify-between mb-3">
          <span style={{ color: C.text }} className="text-sm font-semibold">Horas y calidad</span>
          <div className="flex items-center gap-1">
            {[7, 14, 30].map((r) => (
              <button key={r} onClick={() => setRange(r)}
                style={{ background: range === r ? C.teal : C.cardAlt, color: range === r ? C.bg : C.textMuted, border: `1px solid ${range === r ? C.teal : C.border}` }}
                className="text-[11px] font-medium px-2.5 py-1 rounded-lg">{r}d</button>
            ))}
          </div>
        </div>
        <ResponsiveContainer width="100%" height={180}>
          <BarChart data={chart} margin={{ top: 5, right: 5, left: -20, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke={C.borderSoft} vertical={false} />
            <XAxis dataKey="name" tick={{ fill: C.textFaint, fontSize: 10 }} interval="preserveStartEnd" />
            <YAxis tick={{ fill: C.textFaint, fontSize: 10 }} domain={[0, 'dataMax + 1']} />
            <Tooltip content={<ChartTooltip />} cursor={{ fill: `${C.teal}11` }} />
            <Bar dataKey="horas" radius={[4, 4, 0, 0]} onClick={(d) => d && d.idx != null && setSelectedIdx(d.idx)}>
              {chart.map((d, i) => (
                <Cell key={i} fill={d.idx === selInView ? C.teal : `${C.teal}55`} cursor="pointer" />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
        <p style={{ color: C.textFaint }} className="text-[11px] mt-2">Toca una barra para ver el detalle de esa noche. Seleccionada: {night.date.getDate()}/{night.date.getMonth() + 1}.</p>
      </div>

      {/* CONSEJOS */}
      <div>
        <span style={{ color: C.textFaint }} className="text-[11px] uppercase tracking-wider font-medium mb-3 block">Consejos para dormir mejor</span>
        <div className="flex flex-col gap-2">
          {tips.map((t, i) => (
            <div key={i} style={{ background: C.card, border: `1px solid ${C.border}` }} className="glass rounded-2xl p-3 flex items-start gap-2">
              <Lightbulb size={15} style={{ color: C.amber }} className="mt-0.5 shrink-0" />
              <span style={{ color: C.text }} className="text-[12.5px] leading-snug">{t}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function SleepStat({ icon: Icon, label, value, unit, color }) {
  return (
    <div style={{ background: C.card, border: `1px solid ${C.border}` }} className="glass rounded-2xl p-4 flex flex-col gap-2">
      <div className="flex items-center gap-2">
        <div style={{ background: `${color}1A`, color }} className="w-7 h-7 rounded-lg flex items-center justify-center"><Icon size={15} /></div>
        <span style={{ color: C.textMuted }} className="text-xs font-medium">{label}</span>
      </div>
      <div className="flex items-baseline gap-1">
        <span style={{ color: C.text, fontFamily: "'IBM Plex Mono', monospace" }} className="text-2xl font-semibold tabular-nums">{value}</span>
        <span style={{ color: C.textFaint }} className="text-xs">{unit}</span>
      </div>
    </div>
  );
}
