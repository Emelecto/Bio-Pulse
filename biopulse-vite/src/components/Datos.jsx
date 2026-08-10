// ============================================================
// TAB DATOS — layout vertical (tipo Inicio) en vez de sub-tabs.
//   Bloque 1: Registrar (botón -> vista Logger por categorías + modal)
//   Bloque 2: Zona de esfuerzo (mejorada)
//   Bloque 3: Análisis de correlación
//   Bloque 4: Glosario (botón -> vista Glossary)
// ============================================================
import React, { useState } from "react";
import { Database, BookOpen, Target, BarChart3, ArrowLeft } from "lucide-react";
import { C } from "./ui.jsx";
import Logger from "./Logger.jsx";
import EffortZone from "./EffortZone.jsx";
import LogAnalysis from "./LogAnalysis.jsx";
import Glossary from "./Glossary.jsx";
import { computeReadiness, effortTarget } from "../lib/bioUtils.js";

export default function Datos({ logs, data, onOpenTech, onBreathe }) {
  const [view, setView] = useState("home"); // 'home' | 'registrar' | 'glosario'

  const today = data && data.length ? data[data.length - 1] : null;
  const metrics = today || {};
  const logArr = logs?.logs || [];
  const addLog = logs?.addLog;
  const removeLog = logs?.removeLog;

  // Encabezado de sub-vista con botón atrás.
  const SubHeader = ({ title, icon: Icon, onBack }) => (
    <div className="flex items-center gap-3 mb-4">
      <button onClick={onBack} aria-label="Atrás" className="w-9 h-9 rounded-full flex items-center justify-center active:scale-95 transition-transform" style={{ background: C.card, border: `1px solid ${C.border}`, color: C.textMuted }}>
        <ArrowLeft size={18} />
      </button>
      <div className="flex items-center gap-2">
        <Icon size={20} color={C.teal} />
        <span style={{ color: C.text }} className="text-lg font-bold">{title}</span>
      </div>
    </div>
  );

  if (view === "registrar") {
    return (
      <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
        <SubHeader title="Registrar" icon={Database} onBack={() => setView("home")} />
        <Logger logs={logArr} onAdd={addLog} onRemove={removeLog} />
      </div>
    );
  }

  if (view === "glosario") {
    return (
      <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
        <SubHeader title="Glosario" icon={BookOpen} onBack={() => setView("home")} />
        <Glossary C={C} />
      </div>
    );
  }

  // HOME: bloques apilados.
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
      {/* BLOQUE 1: REGISTRAR */}
      <button onClick={() => setView("registrar")} style={{ background: `linear-gradient(160deg, ${C.card}, ${C.bgSoft})`, border: `1px solid ${C.border}`, borderRadius: 20, padding: 18, display: "flex", alignItems: "center", gap: 14, cursor: "pointer", textAlign: "left" }}>
        <div style={{ background: C.teal, borderRadius: 14, padding: 12, flexShrink: 0 }}><Database size={22} color="#050A10" /></div>
        <div style={{ flex: 1 }}>
          <div style={{ color: C.text, fontWeight: 700, fontSize: 15 }}>Registrar hábitos y sustancias</div>
          <div style={{ color: C.textMuted, fontSize: 12.5, marginTop: 2 }}>Alcohol, café, entrenamiento, medicamentos y más</div>
        </div>
        <span style={{ color: C.teal, fontSize: 22, fontWeight: 700 }}>+</span>
      </button>

      {/* BLOQUE 2: ZONA DE ESFUERZO (mejorada) */}
      <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 20, padding: 16 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 10 }}>
          <Target size={18} color={C.purple} />
          <span style={{ color: C.text, fontWeight: 600, fontSize: 14 }}>Zona de esfuerzo</span>
        </div>
        <EffortZone metrics={metrics} C={C} />
      </div>

      {/* BLOQUE 3: ANÁLISIS */}
      <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 20, padding: 16 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 10 }}>
          <BarChart3 size={18} color={C.teal} />
          <span style={{ color: C.text, fontWeight: 600, fontSize: 14 }}>Análisis de correlación</span>
        </div>
        <LogAnalysis logs={logArr} data={data} C={C} />
      </div>

      {/* BLOQUE 4: GLOSARIO */}
      <button onClick={() => setView("glosario")} style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 20, padding: 16, display: "flex", alignItems: "center", gap: 14, cursor: "pointer", textAlign: "left" }}>
        <div style={{ background: C.bgSoft, borderRadius: 12, padding: 10, flexShrink: 0 }}><BookOpen size={20} color={C.purple} /></div>
        <div style={{ flex: 1 }}>
          <div style={{ color: C.text, fontWeight: 700, fontSize: 14 }}>Glosario</div>
          <div style={{ color: C.textMuted, fontSize: 12.5, marginTop: 2 }}>HRV, Riesgo, Readiness y más términos</div>
        </div>
        <ArrowLeft size={18} color={C.textMuted} style={{ transform: "rotate(180deg)" }} />
      </button>
    </div>
  );
}
