// ============================================================
// TAB SLEEP — calidad de sueño: métricas, gráfica 7/14/30 días,
// y consejos para mejorar.
// ============================================================
import React, { useState } from "react";
import { Moon, BedDouble, Clock, Zap, Lightbulb } from "lucide-react";
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid, Cell } from "recharts";
import { C, ChartTooltip, SectionHeader } from "./ui.jsx";

export default function Sleep({ data }) {
  const [range, setRange] = useState(14);
  const sleepDays = data.slice(-range);

  // promedios
  const avgHours = (sleepDays.reduce((a, d) => a + d.sleepHours, 0) / sleepDays.length).toFixed(1);
  const avgScore = Math.round(sleepDays.reduce((a, d) => a + d.sleepScore, 0) / sleepDays.length);
  const avgEff = Math.round(sleepDays.reduce((a, d) => a + d.sleepEff, 0) / sleepDays.length);
  const avgWake = (sleepDays.reduce((a, d) => a + (d.wakeUps || 0), 0) / sleepDays.length).toFixed(1);

  // calidad por día (score) y horas
  const chart = sleepDays.map((d) => ({ name: `${d.date.getDate()}/${d.date.getMonth() + 1}`, horas: d.sleepHours, score: d.sleepScore }));
  const minH = Math.min(...sleepDays.map((d) => d.sleepHours));

  const tips = [];
  if (avgHours < 7) tips.push("Duermes poco en promedio. Subir a 7–8 h mejora HRV y recuperación.");
  if (avgEff < 85) tips.push("Tu eficiencia es baja: reduce pantallas y luz 1 h antes de dormir.");
  if (avgWake > 2) tips.push("Despertares frecuentes: evita cafeína tarde y controla la temperatura de la habitación.");
  if (avgScore >= 85) tips.push("Buena calidad de sueño. Mantén tu rutina actual para sostenerla.");
  if (tips.length === 0) tips.push("Tus métricas de sueño son sólidas. Sigue así y vigila consistencia.");

  return (
    <div className="flex flex-col gap-5">
      <div>
        <span style={{ color: C.textFaint }} className="text-[11px] uppercase tracking-wider font-medium mb-3 block">Resumen de sueño</span>
        <div className="grid grid-cols-2 gap-3">
          <SleepStat icon={Clock} label="Horas promedio" value={avgHours} unit="h" color={C.teal} />
          <SleepStat icon={Moon} label="Sleep score" value={avgScore} unit="/100" color={C.amber} />
          <SleepStat icon={Zap} label="Eficiencia" value={avgEff} unit="%" color={C.purple} />
          <SleepStat icon={BedDouble} label="Despertares" value={avgWake} unit="" color={C.rose} />
        </div>
      </div>

      <div style={{ background: C.card, border: `1px solid ${C.border}` }} className="rounded-3xl p-4">
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
            <Bar dataKey="horas" radius={[4, 4, 0, 0]}>
              {chart.map((_, i) => <Cell key={i} fill={C.teal} />)}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
        <p style={{ color: C.textFaint }} className="text-[11px] mt-2">Barras = horas dormidas por día (últimos {range} días). Mínimo: {minH} h.</p>
      </div>

      <div>
        <span style={{ color: C.textFaint }} className="text-[11px] uppercase tracking-wider font-medium mb-3 block">Consejos para dormir mejor</span>
        <div className="flex flex-col gap-2">
          {tips.map((t, i) => (
            <div key={i} style={{ background: C.card, border: `1px solid ${C.border}` }} className="rounded-2xl p-3 flex items-start gap-2">
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
    <div style={{ background: C.card, border: `1px solid ${C.border}` }} className="rounded-2xl p-4 flex flex-col gap-2">
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
