// ============================================================
// TAB LIVE — frecuencia cardiaca "en vivo" simulada, onda de
// latidos y métricas interpretables en vivo.
// ============================================================
import React, { useEffect, useRef, useState } from "react";
import { Heart, Activity, Wind, BatteryMedium } from "lucide-react";
import { C, Sparkline, buildSmoothPath } from "./ui.jsx";

// Genera una onda tipo ECG para un BPM dado.
function ecgWave(bpm, points = 120) {
  const beat = (i) => {
    const t = (i % Math.floor(points / (bpm / 60))) / (points / (bpm / 60));
    // simplificado: pico QRS
    return Math.sin(t * Math.PI * 2) + (t < 0.12 ? 0 : t < 0.18 ? 1.6 : t < 0.25 ? -0.8 : 0);
  };
  return Array.from({ length: points }, (_, i) => beat(i));
}

export default function Live({ today }) {
  const [bpm, setBpm] = useState(today.rhr || 60);
  const [wave, setWave] = useState(() => ecgWave(today.rhr || 60));
  const [hrv, setHrv] = useState(today.hrv);
  const [resp, setResp] = useState(today.resp);
  const tick = useRef(0);

  useEffect(() => {
    const id = setInterval(() => {
      tick.current++;
      // varía el BPM alrededor de RHR como si fuera en vivo
      const base = today.rhr || 60;
      const v = Math.round(base + Math.sin(tick.current / 3) * 4 + (Math.random() - 0.5) * 2);
      setBpm(v);
      setWave(ecgWave(v));
      setHrv(Math.round(today.hrv + Math.sin(tick.current / 5) * 3 + (Math.random() - 0.5) * 2));
      setResp(+(today.resp + Math.sin(tick.current / 7) * 0.6).toFixed(1));
    }, 900);
    return () => clearInterval(id);
  }, [today.rhr, today.hrv, today.resp]);

  const w = 600, h = 120;
  const wMin = Math.min(...wave), wMax = Math.max(...wave);
  const range = (wMax - wMin) || 1;
  // Padding vertical para que los picos QRS no se corten arriba/abajo.
  const pad = h * 0.18;
  const usable = h - pad * 2;
  const pts = wave.map((v, i) => [(i / (wave.length - 1)) * w, pad + usable - ((v - wMin) / range) * usable]);
  const d = buildSmoothPath(pts);

  return (
    <div className="flex flex-col gap-5">
      <div style={{ background: `linear-gradient(160deg, ${C.card}, ${C.bgSoft})`, border: `1px solid ${C.border}` }} className="rounded-3xl p-5 relative overflow-hidden">
        <div className="flex items-center gap-2 mb-2">
          <Heart size={16} style={{ color: C.rose }} className="animate-pulse" />
          <span style={{ color: C.textMuted }} className="text-[11px] uppercase tracking-wider font-medium">Frecuencia cardíaca en vivo</span>
          <span style={{ color: C.teal, background: `${C.teal}14`, border: `1px solid ${C.teal}40` }} className="text-[9px] font-semibold px-2 py-0.5 rounded-full ml-auto">SIMULADO</span>
        </div>
        <div className="flex items-end gap-2">
          <span style={{ color: C.text, fontFamily: "'IBM Plex Mono', monospace" }} className="text-5xl font-semibold tabular-nums">{bpm}</span>
          <span style={{ color: C.textFaint }} className="text-sm mb-1">bpm</span>
        </div>
        <svg viewBox={`0 0 ${w} ${h}`} width="100%" height={h} preserveAspectRatio="none" className="mt-2" style={{ overflow: "hidden" }} role="img" aria-label="Onda de latidos en vivo">
          <path d={d} fill="none" stroke={C.rose} strokeWidth="2" vectorEffect="non-scaling-stroke" style={{ filter: `drop-shadow(0 0 6px ${C.rose}66)` }} />
        </svg>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <LiveCard icon={Heart} label="HRV en vivo" value={hrv} unit="ms" color={C.teal} spark={wave.map((v) => v * 20 + 50)} />
        <LiveCard icon={Wind} label="Frec. resp." value={resp} unit="rpm" color={C.purple} spark={Array.from({ length: 12 }, (_, i) => 50 + Math.sin(i / 2) * 15)} />
        <LiveCard icon={Activity} label="RHR base" value={today.rhr} unit="bpm" color={C.amber} spark={Array.from({ length: 12 }, (_, i) => 50 + Math.sin(i / 3) * 10)} />
        <LiveCard icon={BatteryMedium} label="Recuperación" value={today.recovery} unit="%" color={C.teal} spark={Array.from({ length: 12 }, (_, i) => 50 + Math.sin(i / 4) * 20)} />
      </div>

      <div style={{ background: C.bgSoft, border: `1px solid ${C.borderSoft}` }} className="rounded-2xl p-4">
        <p style={{ color: C.textFaint }} className="text-[12px] leading-relaxed">
          Vista en vivo simulada a partir de tus métricas de hoy (RHR {today.rhr} bpm, HRV {today.hrv} ms). Al conectar un wearable real vía el backend, estos valores se actualizan con datos de sensores en tiempo real.
        </p>
      </div>
    </div>
  );
}

function LiveCard({ icon: Icon, label, value, unit, color, spark }) {
  return (
    <div style={{ background: C.card, border: `1px solid ${C.border}` }} className="rounded-2xl p-4 flex flex-col gap-2">
      <div className="flex items-center gap-2">
        <div style={{ background: `${color}1A`, color }} className="w-7 h-7 rounded-lg flex items-center justify-center"><Icon size={15} /></div>
        <span style={{ color: C.textMuted }} className="text-xs font-medium truncate">{label}</span>
      </div>
      <div className="flex items-baseline gap-1">
        <span style={{ color: C.text, fontFamily: "'IBM Plex Mono', monospace" }} className="text-2xl font-semibold tabular-nums">{value}</span>
        <span style={{ color: C.textFaint }} className="text-xs">{unit}</span>
      </div>
      <Sparkline data={spark} color={color} height={28} />
    </div>
  );
}
