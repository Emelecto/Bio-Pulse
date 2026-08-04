// ============================================================
// Onboarding — flujo de 30s que calibra el contexto personal.
// Tres entradas en la pantalla inicial:
//   - Crear cuenta (email + password + perfil) -> auth.register
//   - Iniciar sesion (email + password)         -> auth.login
//   - Usar datos demo (sin cuenta)               -> auth.skip
// Si ya hay token valido o se eligio demo antes, App NO muestra esto.
// ============================================================
import React, { useState } from "react";
import { C } from "./ui.jsx";
import { Activity, ArrowRight, ArrowLeft, LogIn, UserPlus, Sparkles } from "lucide-react";

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

export default function Onboarding({ auth, onDemo }) {
  const [mode, setMode] = useState(null); // null | 'create' | 'login'
  const [step, setStep] = useState(0);
  const [form, setForm] = useState({
    name: "", age: "", sex: "femenino", goal: "salud",
    conditions: [], weightKg: "", heightCm: "",
  });
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState(null);

  const toggleCond = (k) =>
    setForm((f) => {
      if (k === "ninguna") return { ...f, conditions: ["ninguna"] };
      const has = f.conditions.includes(k);
      const next = has ? f.conditions.filter((c) => c !== k) : [...f.conditions.filter((c) => c !== "ninguna"), k];
      return { ...f, conditions: next };
    });

  const buildProfile = () => ({
    ...form,
    age: form.age ? Number(form.age) : null,
    weightKg: form.weightKg ? Number(form.weightKg) : null,
    heightCm: form.heightCm ? Number(form.heightCm) : null,
    completedAt: new Date().toISOString(),
  });

  const submitCreate = async () => {
    setBusy(true); setErr(null);
    try {
      const profile = buildProfile();
      await auth.register(email.trim(), password, profile);
      // register ya cierra el flujo (App deja de mostrar onboarding)
    } catch (e) {
      setErr(e.message || "No se pudo crear la cuenta.");
      setBusy(false);
    }
  };

  const submitLogin = async () => {
    setBusy(true); setErr(null);
    try {
      await auth.login(email.trim(), password);
    } catch (e) {
      setErr(e.message || "No se pudo iniciar sesión.");
      setBusy(false);
    }
  };

  // ---- Pantalla de entrada: 3 botones ----
  if (!mode) {
    return (
      <Shell>
        <h2 style={{ color: C.text }} className="text-xl font-semibold mb-1 text-center">Bienvenido a BioPulse</h2>
        <p style={{ color: C.textMuted }} className="text-[13px] text-center mb-6">Crea tu cuenta para guardar tu perfil, o usa datos demo.</p>
        <div className="flex flex-col gap-3">
          <BigBtn onClick={() => setMode("create")} icon={<UserPlus size={18} />} title="Crear cuenta" sub="Registra correo y contraseña" />
          <BigBtn onClick={() => setMode("login")} icon={<LogIn size={18} />} title="Iniciar sesión" sub="Ya tengo una cuenta" />
          <button onClick={onDemo} className="mt-1 flex items-center justify-center gap-1.5 py-2.5 rounded-xl text-[13px] font-medium active:scale-95 transition-transform"
            style={{ background: C.bgSoft, border: `1px solid ${C.border}`, color: C.textMuted }}>
            <Sparkles size={15} /> Usar datos demo (sin cuenta)
          </button>
        </div>
        <p style={{ color: C.textFaint }} className="text-[10px] text-center mt-4">Tus datos se guardan de forma segura en tu cuenta.</p>
      </Shell>
    );
  }

  // ---- Crear cuenta: email + password + perfil ----
  if (mode === "create") {
    if (step < 1) {
      return (
        <Shell>
          <BackBtn onClick={() => setMode(null)} />
          <h2 style={{ color: C.text }} className="text-lg font-semibold mb-4">Crear cuenta</h2>
          {err && <ErrBox msg={err} />}
          <Field label="Correo" value={email} onChange={setEmail} placeholder="tu@correo.com" type="email" />
          <div className="h-3" />
          <Field label="Contraseña" value={password} onChange={setPassword} placeholder="Mínimo 6 caracteres" type="password" />
          <Primary onClick={() => { if (email && password.length >= 6) { setErr(null); setStep(1); } else setErr("Ingresa correo y contraseña (mín. 6)."); }}
            disabled={busy}>
            Continuar
          </Primary>
        </Shell>
      );
    }
    return <ProfileStep form={form} setForm={setForm} toggleCond={toggleCond} step={step} setStep={setStep}
      onBack={() => setStep(0)} onSubmit={submitCreate} busy={busy} err={err} finishLabel="Crear cuenta" />;
  }

  // ---- Iniciar sesión ----
  return (
    <Shell>
      <BackBtn onClick={() => setMode(null)} />
      <h2 style={{ color: C.text }} className="text-lg font-semibold mb-4">Iniciar sesión</h2>
      {err && <ErrBox msg={err} />}
      <Field label="Correo" value={email} onChange={setEmail} placeholder="tu@correo.com" type="email" />
      <div className="h-3" />
      <Field label="Contraseña" value={password} onChange={setPassword} placeholder="Tu contraseña" type="password" />
      <Primary onClick={submitLogin} disabled={busy || !email || !password}>Entrar</Primary>
    </Shell>
  );
}

// ---------- Sub-componentes ----------
function Shell({ children }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center px-5" style={{ background: C.bg }}>
      <div className="w-full max-w-sm">
        <div className="flex items-center justify-center gap-2 mb-6">
          <div style={{ background: C.teal }} className="w-8 h-8 rounded-xl flex items-center justify-center">
            <Activity size={18} color={C.bg} strokeWidth={2.5} />
          </div>
          <span style={{ color: C.text, fontFamily: "'Space Grotesk', sans-serif" }} className="text-xl font-bold tracking-tight">BioPulse</span>
        </div>
        <div className="glass rounded-3xl p-5">{children}</div>
      </div>
    </div>
  );
}
function BigBtn({ onClick, icon, title, sub }) {
  return (
    <button onClick={onClick} className="flex items-center gap-3 p-3.5 rounded-2xl active:scale-95 transition-transform text-left"
      style={{ background: C.card, border: `1px solid ${C.border}` }}>
      <div style={{ background: `${C.teal}1F`, color: C.teal }} className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0">{icon}</div>
      <div>
        <div style={{ color: C.text }} className="text-[14px] font-semibold">{title}</div>
        <div style={{ color: C.textMuted }} className="text-[11px]">{sub}</div>
      </div>
    </button>
  );
}
function BackBtn({ onClick }) {
  return <button onClick={onClick} className="mb-3 flex items-center gap-1 text-[12px] font-medium active:scale-95"
    style={{ color: C.textMuted }}><ArrowLeft size={14} /> Volver</button>;
}
function Field({ label, value, onChange, placeholder, type }) {
  return (
    <div>
      <label style={{ color: C.textMuted }} className="text-[12px] font-medium">{label}</label>
      <input type={type || "text"} value={value} onChange={(e) => onChange(e.target.value)} placeholder={placeholder}
        className="w-full mt-1 rounded-xl px-3 py-2.5 text-[14px] outline-none"
        style={{ background: C.bgSoft, border: `1px solid ${C.border}`, color: C.text }} />
    </div>
  );
}
function Primary({ onClick, children, disabled }) {
  return (
    <button onClick={onClick} disabled={disabled} className="mt-5 w-full flex items-center justify-center gap-1 px-4 py-2.5 rounded-xl text-[13px] font-semibold active:scale-95 transition-transform disabled:opacity-40"
      style={{ background: C.teal, color: C.bg }}>{children} <ArrowRight size={15} /></button>
  );
}
function ErrBox({ msg }) {
  return <div className="rounded-lg p-2.5 text-[11px] mb-3" style={{ background: `${C.rose}14`, border: `1px solid ${C.rose}33`, color: C.rose }}>{msg}</div>;
}

function ProfileStep({ form, setForm, toggleCond, step, setStep, onBack, onSubmit, busy, err, finishLabel }) {
  return (
    <div>
      <BackBtn onClick={onBack} />
      {step === 0 && (
        <div>
          <h2 style={{ color: C.text }} className="text-lg font-semibold mb-1">Cuéntanos sobre ti</h2>
          <p style={{ color: C.textMuted }} className="text-[13px] mb-4">Para personalizar tus índices.</p>
          <Field label="Nombre" value={form.name} onChange={(v) => setForm({ ...form, name: v })} placeholder="Tu nombre" />
          <div className="h-3" />
          <Field label="Edad" value={form.age} onChange={(v) => setForm({ ...form, age: v })} placeholder="Ej. 28" />
          <Primary onClick={() => form.name.trim() && form.age.trim() ? setStep(1) : setErr("Nombre y edad son obligatorios.")} disabled={busy}>Continuar</Primary>
          {err && <ErrBox msg={err} />}
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
          <Primary onClick={() => setStep(2)} disabled={busy}>Continuar</Primary>
        </div>
      )}
      {step === 2 && (
        <div>
          <h2 style={{ color: C.text }} className="text-lg font-semibold mb-1">Contexto de salud</h2>
          <p style={{ color: C.textMuted }} className="text-[13px] mb-4">Opcional, ayuda a interpretar mejor tus señales.</p>
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
              <input type="number" value={form.weightKg} onChange={(e) => setForm({ ...form, weightKg: e.target.value })} placeholder="Ej. 70"
                className="w-full mt-1 rounded-xl px-3 py-2 text-[14px] outline-none" style={{ background: C.bgSoft, border: `1px solid ${C.border}`, color: C.text }} />
            </div>
            <div>
              <label style={{ color: C.textMuted }} className="text-[12px] font-medium">Altura (cm)</label>
              <input type="number" value={form.heightCm} onChange={(e) => setForm({ ...form, heightCm: e.target.value })} placeholder="Ej. 170"
                className="w-full mt-1 rounded-xl px-3 py-2 text-[14px] outline-none" style={{ background: C.bgSoft, border: `1px solid ${C.border}`, color: C.text }} />
            </div>
          </div>
          <Primary onClick={onSubmit} disabled={busy}>{busy ? "Guardando..." : finishLabel}</Primary>
          {err && <ErrBox msg={err} />}
        </div>
      )}
    </div>
  );
}
