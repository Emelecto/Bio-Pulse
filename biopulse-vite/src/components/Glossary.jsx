// ============================================================
// Glossary.jsx — Glosario educativo de métricas de BioPulse.
// ============================================================
const TERMS = [
  { t: "BioScore", d: "Índice de bienestar 0–100. Combina HRV (30%), RHR (20%), recuperación (25%) y sueño (25%)." },
  { t: "HRV (Variabilidad cardíaca)", d: "Diferencia de milisegundos entre latidos. Mayor = mejor recuperación del sistema nervioso." },
  { t: "RHR (Frecuencia cardíaca en reposo)", d: "Latidos por minuto en reposo. Más bajo (dentro de lo sano) suele indicar mejor forma." },
  { t: "Recuperación", d: "Capacidad de tu cuerpo para recuperarse. Se basa en HRV y RHR respecto a tu baseline." },
  { t: "Risk Score", d: "0–100 de señales de alerta (anomalías, fatiga, fiebre). Más bajo = mejor." },
  { t: "Sleep Score", d: "Calidad de tu sueño: duración, eficiencia y profundidad." },
  { t: "Fatiga", d: "Carga acumulada de esfuerzo. Alta sugiere descansar." },
  { t: "Estrés", d: "Carga del sistema nervioso simpático. Se infiere de HRV/RHR." },
  { t: "Readiness (Listo)", d: "Índice 0–100 que combina recuperación, HRV, riesgo y sueño para definir tu zona de esfuerzo." },
  { t: "Zona de esfuerzo", d: "Banda de intensidad ideal del día. Acotada para entrenar sin sobreesforzarte." },
  { t: "Correlación", d: "Relación estadística entre un hábito y tus métricas. No implica causalidad." },
];

export default function Glossary({ C }) {
  return (
    <div style={{ padding: 14, color: C.text, fontSize: 13 }}>
      <h3 style={{ fontSize: 15, fontWeight: 700, margin: "0 0 8px" }}>📖 Glosario</h3>
      {TERMS.map((x) => (
        <div key={x.t} style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 10, padding: "9px 11px", marginBottom: 7 }}>
          <div style={{ fontWeight: 600, marginBottom: 2 }}>{x.t}</div>
          <div style={{ fontSize: 12, color: C.textMuted, lineHeight: 1.4 }}>{x.d}</div>
        </div>
      ))}
    </div>
  );
}
