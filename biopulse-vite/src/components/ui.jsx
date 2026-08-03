// ============================================================
// UI — subcomponentes reutilizables y design tokens.
// Extraido de App.jsx para usar en todas las tabs.
// ============================================================
import React from "react";

export const C_DARK = {
  bg: "#050A10", bgSoft: "#0A121D", card: "#0D1828", cardAlt: "#122034",
  border: "#1C2E46", borderSoft: "#15253A",
  teal: "#00F5D4", amber: "#FFB703", rose: "#FF0055", purple: "#818CF8",
  text: "#F3F7FA", textMuted: "#91A8BE", textFaint: "#56728C",
};
export const C_LIGHT = {
  bg: "#F0F4F8", bgSoft: "#FFFFFF", card: "#FFFFFF", cardAlt: "#E8EEF5",
  border: "#CBD5E1", borderSoft: "#E2E8F0",
  teal: "#059669", amber: "#D97706", rose: "#DC2626", purple: "#6366F1",
  text: "#0F172A", textMuted: "#475569", textFaint: "#64748B",
};
export const C = { ...C_DARK };
// Mutacion en runtime: todos los componentes importan el MISMO objeto C,
// asi que al reasignar sus props ven la paleta activa al re-renderizar.
export function applyTheme(theme) {
  Object.assign(C, theme === "light" ? C_LIGHT : C_DARK);
}
export const riskColor = (level) =>
  level === "ALTO" ? C.rose : level === "MODERADO" ? C.amber : C.teal;
export const MONTHS = ["ene","feb","mar","abr","may","jun","jul","ago","sep","oct","nov","dic"];
export const fmtDate = (d) => `${String(d.getDate()).padStart(2,"0")} ${MONTHS[d.getMonth()]}`;

export function Sparkline({ data, color, height = 32 }) {
  if (!data || data.length < 2) return null;
  const w = 100, h = height;
  const min = Math.min(...data), max = Math.max(...data);
  const range = max - min || 1;
  const pts = data.map((v, i) => [(i / (data.length - 1)) * w, h - ((v - min) / range) * h]);
  const d = pts.reduce((acc, [x, y], i) => acc + (i === 0 ? `M${x},${y}` : ` L${x},${y}`), "");
  return (
    <svg viewBox={`0 0 ${w} ${h}`} width="100%" height={height} preserveAspectRatio="none" role="img" aria-label="Mini gráfica de tendencia">
      <path d={d} fill="none" stroke={color} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" opacity="0.9" />
    </svg>
  );
}

export function MetricCard({ icon: Icon, label, value, unit, delta, sparkData, accent, sub }) {
  return (
    <div
      style={{ background: C.card, border: `1px solid ${C.border}`, boxShadow: `0 4px 14px ${C.bg}80` }}
      className="rounded-2xl p-3 flex flex-col gap-2 min-w-0 transition-all duration-300 hover:-translate-y-0.5 hover:border-teal/30 active:scale-[0.98] overflow-hidden relative"
    >
      <div className="flex items-center justify-between min-w-0">
        <div className="flex items-center gap-1.5 min-w-0">
          <div style={{ background: `${accent}1D`, color: accent }} className="w-6 h-6 rounded-lg flex items-center justify-center shrink-0">
            <Icon size={13} strokeWidth={2.4} />
          </div>
          <span style={{ color: C.textMuted }} className="text-[11px] font-semibold truncate" title={label}>{label}</span>
        </div>
      </div>

      <div className="flex items-baseline justify-between min-w-0">
        <div className="flex items-baseline gap-1 min-w-0">
          <span style={{ color: C.text, fontFamily: "'IBM Plex Mono', monospace" }} className="text-xl font-bold tabular-nums truncate">{value}</span>
          {unit && <span style={{ color: C.textFaint }} className="text-[10px] font-medium shrink-0">{unit}</span>}
        </div>
        {delta !== undefined && !Number.isNaN(delta) && (
          <span style={{ color: delta >= 0 ? C.teal : C.rose, background: delta >= 0 ? `${C.teal}14` : `${C.rose}14` }} className="text-[9.5px] font-bold px-1.5 py-0.5 rounded-md tabular-nums shrink-0">
            {delta >= 0 ? "▲" : "▼"} {Math.abs(Math.round(delta * 10) / 10)}
          </span>
        )}
      </div>

      {sub && <span style={{ color: C.textFaint }} className="text-[10px] truncate">{sub}</span>}
      {sparkData && <Sparkline data={sparkData} color={accent} height={22} />}
    </div>
  );
}

export function RiskGauge({ score, level }) {
  const size = 176, stroke = 12, r = (size - stroke) / 2;
  const circumference = 2 * Math.PI * r;
  const offset = circumference - (score / 100) * circumference;
  const color = riskColor(level);
  return (
    <div className="relative" style={{ width: size, height: size }}>
      <svg width={size} height={size} style={{ transform: "rotate(-90deg)" }} role="img" aria-label={`Índice de riesgo: ${score} de 100, nivel ${level}`}>
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke={C.borderSoft} strokeWidth={stroke} />
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke={color} strokeWidth={stroke} strokeLinecap="round"
          strokeDasharray={circumference} strokeDashoffset={offset}
          style={{ transition: "stroke-dashoffset 1.1s cubic-bezier(.4,0,.2,1)", filter: `drop-shadow(0 0 8px ${color}55)` }} />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span style={{ color: C.text, fontFamily: "'IBM Plex Mono', monospace" }} className="text-4xl font-semibold tabular-nums">{score}</span>
        <span style={{ color: C.textFaint }} className="text-[11px] -mt-1">/ 100</span>
      </div>
    </div>
  );
}

export function PulseRibbon({ values }) {
  const w = 600, h = 90;
  const min = Math.min(...values), max = Math.max(...values);
  const range = max - min || 1;
  const pts = values.map((v, i) => [(i / (values.length - 1)) * w, h / 2 - ((v - min) / range - 0.5) * (h * 0.75)]);
  let d = `M${pts[0][0]},${pts[0][1]}`;
  for (let i = 1; i < pts.length; i++) {
    const [x0, y0] = pts[i - 1], [x1, y1] = pts[i];
    const mx = (x0 + x1) / 2;
    d += ` Q${x0},${y0} ${mx},${(y0 + y1) / 2}`;
  }
  d += ` T${pts[pts.length - 1][0]},${pts[pts.length - 1][1]}`;
  return (
    <svg viewBox={`0 0 ${w} ${h}`} width="100%" height={h} preserveAspectRatio="none" className="pulse-ribbon" role="img" aria-label="Ondas de variabilidad cardíaca reciente">
      <defs>
        <linearGradient id="ribbonFade" x1="0" y1="0" x2="1" y2="0">
          <stop offset="0%" stopColor={C.teal} stopOpacity="0.15" />
          <stop offset="70%" stopColor={C.teal} stopOpacity="0.85" />
          <stop offset="100%" stopColor={C.teal} stopOpacity="1" />
        </linearGradient>
      </defs>
      <path d={d} fill="none" stroke="url(#ribbonFade)" strokeWidth="2" opacity="0.35" style={{ filter: "blur(3px)" }} />
      <path d={d} fill="none" stroke="url(#ribbonFade)" strokeWidth="1.5" />
    </svg>
  );
}

export function SectionHeader({ index, title, subtitle, icon: Icon }) {
  return (
    <div className="flex items-start gap-3 mb-4">
      <span style={{ color: C.teal, fontFamily: "'IBM Plex Mono', monospace", borderColor: C.border }} className="text-[11px] border rounded-md px-1.5 py-0.5 mt-0.5 shrink-0">{index}</span>
      <div className="min-w-0">
        <div className="flex items-center gap-2">
          {Icon && <Icon size={15} style={{ color: C.textMuted }} />}
          <h3 style={{ color: C.text, fontFamily: "'Space Grotesk', sans-serif" }} className="text-[15px] font-semibold">{title}</h3>
        </div>
        {subtitle && <p style={{ color: C.textFaint }} className="text-xs mt-0.5">{subtitle}</p>}
      </div>
    </div>
  );
}

export const ChartTooltip = ({ active, payload, label }) => {
  if (!active || !payload || !payload.length) return null;
  return (
    <div style={{ background: C.cardAlt, border: `1px solid ${C.border}` }} className="rounded-lg px-3 py-2 text-xs">
      <div style={{ color: C.textFaint }} className="mb-1">{label}</div>
      {payload.map((p, i) => (
        <div key={i} style={{ color: p.color || C.text, fontFamily: "'IBM Plex Mono', monospace" }}>
          {p.name}: {typeof p.value === "number" ? p.value.toFixed(2) : p.value}
        </div>
      ))}
    </div>
  );
};

export const GLOBAL_STYLE = `
  @import url('https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@500;600;700&family=IBM+Plex+Mono:wght@400;500;600&family=Manrope:wght@400;500;600;700;800&display=swap');
  * { box-sizing: border-box; }
  html, body { overflow-x: hidden; width: 100%; margin: 0; padding: 0; }
  ::-webkit-scrollbar { width: 6px; height: 6px; }
  ::-webkit-scrollbar-thumb { background: ${C.border}; border-radius: 4px; }
  .pulse-ribbon path { stroke-dasharray: 1400; stroke-dashoffset: 1400; animation: draw 2.2s ease-out forwards; }
  @keyframes draw { to { stroke-dashoffset: 0; } }
  .animate-spin { animation: spin 1s linear infinite; }
  @keyframes spin { to { transform: rotate(360deg); } }
  .dt-breathe-BAJO, .dt-breathe-MODERADO, .dt-breathe-ALTO { animation-name: dt-breathe; animation-iteration-count: infinite; animation-timing-function: ease-in-out; animation-direction: alternate; }
  @keyframes dt-breathe { from { transform: scale(0.92); opacity: 0.5; } to { transform: scale(1.06); opacity: 1; } }
  .tab-fade-in { animation: fadeInUp 0.35s cubic-bezier(0.16, 1, 0.3, 1) forwards; }
  @keyframes fadeInUp { from { opacity: 0; transform: translateY(8px); } to { opacity: 1; transform: translateY(0); } }
  .animate-pulse-slow { animation: pulseSlow 2.5s ease-in-out infinite; }
  @keyframes pulseSlow { 0%, 100% { opacity: 1; transform: scale(1); } 50% { opacity: 0.7; transform: scale(1.04); } }
  .typing-dot { animation: typingBounce 1.4s infinite ease-in-out both; }
  .typing-dot:nth-child(1) { animation-delay: -0.32s; }
  .typing-dot:nth-child(2) { animation-delay: -0.16s; }
  @keyframes typingBounce { 0%, 80%, 100% { transform: scale(0.4); opacity: 0.3; } 40% { transform: scale(1); opacity: 1; } }
  @media (prefers-reduced-motion: reduce) {
    .pulse-ribbon path { animation: none; stroke-dashoffset: 0; }
    .animate-spin, .animate-pulse-slow { animation: none; }
    .dt-breathe-BAJO, .dt-breathe-MODERADO, .dt-breathe-ALTO { animation: none; }
    .tab-fade-in { animation: none; opacity: 1; transform: none; }
    .typing-dot { animation: none; opacity: 0.8; }
  }
  button:focus-visible, [tabindex]:focus-visible, select:focus-visible, input:focus-visible { outline: 2px solid ${C.teal}; outline-offset: 2px; }
  select option { background: ${C.bgSoft}; }
`;
