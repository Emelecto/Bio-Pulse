// ============================================================
// Onboarding — perfil de 30s que calibra el contexto personal.
// Multi-paso, glass, coherente con el resto de la app. Al completar
// guarda el perfil (persistido en useBiopulseData) y cierra.
// NO inventa datos: solo anade contexto a las metricas reales.
// ============================================================
import React, { useState } from "react";
import { C } from "./ui.jsx";
import { Activity, ArrowRight, ArrowLeft } from "lucide-react";

const GOALS = [
  { key: "salud", label: "Salud general", icon: "🌿" },
  { key: "rendimiento", label: "Rendimiento", icon: "⚡" },
  { key: "sueno", label: "Dormir mejor", icon: "🌙" },
  { key: "recuperacion", label: "Recuperación", icon: "💪" },
];
const CONDITIONS = [
  { key: "hipertension", label: "Hipertensión" },
  { key: "diabetes", label: "Diabetes" },
  { key: "cardiaco", label: "Cardíaco" },
  { key: "insomnio", label: "Insomnio" },
  { key: "embarazo", label: "Embarazo" },
  { key: "ninguna", label: "Ninguna" },
];
const SEX = [
  { key: "femenino", label: "Femenino" },
  { key: "masculino", label: "Masculino" },
  { key: "otro", label: "Otro" },
];

export default function Onboarding({ onComplete }) {
  const [step, setStep] = useState(0);
  const [form, setForm] = useState({
    name: "", age: "", sex: "femenino", goal: "salud",
    conditions: [], weightKg: "", heightCm: "",
  });

  const toggleCond = (k) =>
    setForm((f) => {
      if (k === "ninguna") return { ...f, conditions: ["ninguna"] };
      const has = f.conditions.includes(k);
      const next = has ? f.conditions.filter((c) => c !== k) : [...f.conditions.filter((c) => c !== "ninguna"), k];
      return { ...f, conditions: next };
    });

  const finish = () => {
    const profile = {
      ...form,
      age: form.age ? Number(form.age) : null,
      weightKg: form.weightKg ? Number(form.weightKg) : null,
      heightCm: form.heightCm ? Number(form.heightCm) : null,
      completedAt: new Date().toISOString(),
    };
    onComplete(profile);
  };

  const canNext = () => {
    if (step === 0) return form.name.trim().length > 0 && form.age.trim().length > 0;
    if (step === 1) return true;
    if (step === 2) return true;
    return true;
  };

  const next = () => { if (step < 3) setStep(step + 1); else finish(); };
  const back = () => setStep(Math.max(0, step - 1));

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center px-5" style={{ background: C.bg }}>
      <div className="w-full max-w-sm">
        {/* Logo */}
        <div className="flex items-center justify-center gap-2 mb-6">
          <div style={{ background: C.teal }} className="w-8 h-8 rounded-xl flex items-center justify-center">
            <Activity size={18} color={C.bg} strokeWidth={2.5} />
          </div>
          <span style={{ color: C.text, fontFamily: "'Space Grotesk', sans-serif" }} className="text-xl font-bold tracking-tight">BioPulse</span>
        </div>

        {/* Progreso */}
        <div className="flex gap-1.5 mb-5">
          {[0, 1, 2, 3].map((i) => (
            <div key={i} className="h-1 flex-1 rounded-full" style={{ background: i <= step ? C.teal : C.borderSoft, transition: "background 0.3s" }} />
          ))}
        </div>

        <div className="glass rounded-3xl p-5">
          {step === 0 && (
            <div>
              <h2 style={{ color: C.text }} className="text-lg font-semibold mb-1">Empecemos</h2>
              <p style={{ color: C.textMuted }} className="text-[13px] mb-4">Cuéntanos sobre ti para personalizar tus índices.</p>
              <label style={{ color: C.textMuted }} className="text-[12px] font-medium">Nombre</label>
              <input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })}
                placeholder="Tu nombre" className="w-full mt-1 mb-3 rounded-xl px-3 py-2.5 text-[14px] outline-none"
                style={{ background: C.bgSoft, border: `1px solid ${C.border}`, color: C.text }} />
              <label style={{ color: C.textMuted }} className="text-[12px] font-medium">Edad</label>
              <input type="number" value={form.age} onChange={(e) => setForm({ ...form, age: e.target.value })}
                placeholder="Ej. 28" className="w-full mt-1 rounded-xl px-3 py-2.5 text-[14px] outline-none"
                style={{ background: C.bgSoft, border: `1px solid ${C.border}`, color: C.text }} />
            </div>
          )}

          {step === 1 && (
            <div>
              <h2 style={{ color: C.text }} className="text-lg font-semibold mb-1">Tu objetivo</h2>
              <p style={{ color: C.textMuted }} className="text-[13px] mb-4">¿Qué quieres lograr?</p>
              <div className="grid grid-cols-2 gap-2.5">
                {GOALS.map((g) => (
                  <button key={g.key} onClick={() => setForm({ ...form, goal: g.key })}
                    className="rounded-2xl p-3 flex flex-col items-center gap-1 active:scale-95 transition-transform"
                    style={{ background: form.goal === g.key ? `${C.teal}1F` : C.bgSoft, border: `1px solid ${form.goal === g.key ? C.teal : C.border}` }}>
                    <span className="text-2xl">{g.icon}</span>
                    <span style={{ color: form.goal === g.key ? C.teal : C.text }} className="text-[12px] font-medium text-center">{g.label}</span>
                  </button>
                ))}
              </div>
              <label style={{ color: C.textMuted }} className="text-[12px] font-medium block mt-4 mb-1">Sexo biológico</label>
              <div className="flex gap-2">
                {SEX.map((s) => (
                  <button key={s.key} onClick={() => setForm({ ...form, sex: s.key })}
                    className="flex-1 rounded-xl py-2 text-[12px] font-medium active:scale-95 transition-transform"
                    style={{ background: form.sex === s.key ? `${C.teal}1F` : C.bgSoft, border: `1px solid ${form.sex === s.key ? C.teal : C.border}`, color: form.sex === s.key ? C.teal : C.text }}>
                    {s.label}
                  </button>
                ))}
              </div>
            </div>
          )}

          {step === 2 && (
            <div>
              <h2 style={{ color: C.text }} className="text-lg font-semibold mb-1">Contexto de salud</h2>
              <p style={{ color: C.textMuted }} className="text-[13px] mb-4">Nos ayuda a interpretar mejor tus señales. Opcional.</p>
              <div className="flex flex-wrap gap-2">
                {CONDITIONS.map((c) => {
                  const on = form.conditions.includes(c.key);
                  return (
                    <button key={c.key} onClick={() => toggleCond(c.key)}
                      className="rounded-full px-3 py-1.5 text-[12px] font-medium active:scale-95 transition-transform"
                      style={{ background: on ? `${C.teal}1F` : C.bgSoft, border: `1px solid ${on ? C.teal : C.border}`, color: on ? C.teal : C.textMuted }}>
                      {c.label}
                    </button>
                  );
                })}
              </div>
              <div className="grid grid-cols-2 gap-2.5 mt-4">
                <div>
                  <label style={{ color: C.textMuted }} className="text-[12px] font-medium">Peso (kg)</label>
                  <input type="number" value={form.weightKg} onChange={(e) => setForm({ ...form, weightKg: e.target.value })}
                    placeholder="Ej. 70" className="w-full mt-1 rounded-xl px-3 py-2 text-[14px] outline-none"
                    style={{ background: C.bgSoft, border: `1px solid ${C.border}`, color: C.text }} />
                </div>
                <div>
                  <label style={{ color: C.textMuted }} className="text-[12px] font-medium">Altura (cm)</label>
                  <input type="number" value={form.heightCm} onChange={(e) => setForm({ ...form, heightCm: e.target.value })}
                    placeholder="Ej. 170" className="w-full mt-1 rounded-xl px-3 py-2 text-[14px] outline-none"
                    style={{ background: C.bgSoft, border: `1px solid ${C.border}`, color: C.text }} />
                </div>
              </div>
            </div>
          )}

          {step === 3 && (
            <div className="text-center py-2">
              <div className="text-4xl mb-2">✅</div>
              <h2 style={{ color: C.text }} className="text-lg font-semibold mb-1">¡Listo, {form.name || "hola"}!</h2>
              <p style={{ color: C.textMuted }} className="text-[13px]">Tu BioPulse ahora conoce tu contexto. Empezamos a leer tus señales.</p>
            </div>
          )}

          {/* Navegacion */}
          <div className="flex items-center justify-between mt-5">
            {step > 0 ? (
              <button onClick={back} className="flex items-center gap-1 px-3 py-2 rounded-xl text-[13px] font-medium active:scale-95 transition-transform"
                style={{ background: C.bgSoft, border: `1px solid ${C.border}`, color: C.textMuted }}>
                <ArrowLeft size={15} /> Atrás
              </button>
            ) : <span />}
            <button onClick={next} disabled={!canNext()}
              className="flex items-center gap-1 px-4 py-2 rounded-xl text-[13px] font-semibold active:scale-95 transition-transform disabled:opacity-40"
              style={{ background: C.teal, color: C.bg }}>
              {step === 3 ? "Empezar" : "Continuar"} <ArrowRight size={15} />
            </button>
          </div>
        </div>
        <p style={{ color: C.textFaint }} className="text-[10px] text-center mt-3">Tus datos se guardan solo en este dispositivo.</p>
      </div>
    </div>
  );
}
