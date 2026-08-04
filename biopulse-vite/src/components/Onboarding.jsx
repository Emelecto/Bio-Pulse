// ============================================================
// Onboarding — flujo de ~30s que calibra el contexto personal.
// Tres entradas en la pantalla inicial:
//   - Crear cuenta (email + password + perfil) -> auth.register
//   - Iniciar sesion (email + password)         -> auth.login
//   - Usar datos demo (sin cuenta)              -> auth.skip
// Modo edicion (editMode): reusa el cuestionario para actualizar el
// perfil de la cuenta ya logueada (onSave -> auth.saveProfile).
// Escala coherente con el resto de la app (text-[13px]/text-sm).
// ============================================================
import React, { useState } from "react";
import { C } from "./ui.jsx";
import { Activity, ArrowRight, ArrowLeft, LogIn, UserPlus, Sparkles } from "lucide-react";

const GOALS = [
  { key: "salud", label: "Salud general", icon: "🌿" },
  { key: "rendimiento", label: "Rendimiento", icon: "⚡" },
  { key: "sueno", label: "Dormir mejor", icon: "🌙" },
  { key: "recuperacion", label: "Recuperación", icon: "💪" },
  { key: "estres", label: "Manejar estrés", icon: "🧘" },
  { key: "energia", label: "Más energía", icon: "🔋" },
  { key: "longevidad", label: "Longevidad", icon: "♾️" },
  { key: "preparacion", label: "Preparación física", icon: "🏋️" },
];
const CONDITIONS = [
  { key: "hipertension", label: "Hipertensión" },
  { key: "diabetes", label: "Diabetes" },
  { key: "cardiaco", label: "Cardíaco" },
  { key: "insomnio", label: "Insomnio" },
  { key: "embarazo", label: "Embarazo" },
  { key: "asma", label: "Asma" },
  { key: "ansiedad", label: "Ansiedad" },
  { key: "depresion", label: "Depresión" },
  { key: "tiroides", label: "Tiroides" },
  { key: "colesterol", label: "Colesterol alto" },
  { key: "artritis", label: "Artritis" },
  { key: "ninguna", label: "Ninguna" },
  { key: "otra", label: "Otra (especificar)" },
];
const SEX = [
  { key: "femenino", label: "Femenino" },
  { key: "masculino", label: "Masculino" },
  { key: "otro", label: "Otro" },
  { key: "ns", label: "Prefiero no decir" },
];
const ACTIVITY = [
  { key: "sedentario", label: "Sedentario" },
  { key: "ligero", label: "Ligero" },
  { key: "moderado", label: "Moderado" },
  { key: "intenso", label: "Intenso" },
];
const SMOKE = [
  { key: "no", label: "No" },
  { key: "ocasional", label: "Ocasional" },
  { key: "frecuente", label: "Frecuente" },
];

export default function Onboarding({ auth, onDemo, editMode = false, initialProfile = null, onSave = null }) {
  const [mode, setMode] = useState(editMode ? "create" : null);
  const [step, setStep] = useState(editMode ? 1 : 0);
  const init = initialProfile || {};
  const [form, setForm] = useState({
    name: init.name || "", age: init.age != null ? String(init.age) : "",
    sex: init.sex || "femenino", goal: init.goal || "salud",
    conditions: init.conditions || [], otherCondition: init.otherCondition || "",
    weightKg: init.weightKg != null ? String(init.weightKg) : "",
    heightCm: init.heightCm != null ? String(init.heightCm) : "",
    activity: init.activity || "ligero", smoke: init.smoke || "no",
  });
  const [email, setEmail] = useState(init.email || "");
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
    // Si marco "otra", guardo la condicion libre en conditions como "otra: <texto>"
    conditions: form.conditions.includes("otra") && form.otherCondition.trim()
      ? [...form.conditions.filter((c) => c !== "otra"), `otra:${form.otherCondition.trim()}`]
      : form.conditions,
    completedAt: new Date().toISOString(),
  });

  const submitCreate = async () => {
    setBusy(true); setErr(null);
    try {
      const profile = buildProfile();
      if (editMode && onSave) {
        await onSave(profile);
        return;
      }
      await auth.register(email.trim(), password, profile);
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
        <h2 style={{ color: C.text }} className="text-base font-semibold mb-1 text-center">Bienvenido a BioPulse</h2>
        <p style={{ color: C.textMuted }} className="text-[12px] text-center mb-5">Crea tu cuenta para guardar tu perfil, o usa datos demo.</p>
        <div className="flex flex-col gap-2.5">
          <BigBtn onClick={() => setMode("create")} icon={<UserPlus size={16} />} title="Crear cuenta" sub="Registra correo y contraseña" />
          <BigBtn onClick={() => setMode("login")} icon={<LogIn size={16} />} title="Iniciar sesión" sub="Ya tengo una cuenta" />
          <button onClick={onDemo} className="mt-1 flex items-center justify-center gap-1.5 py-2.5 rounded-xl text-[12px] font-medium active:scale-95 transition-transform"
            style={{ background: C.bgSoft, border: `1px solid ${C.border}`, color: C.textMuted }}>
            <Sparkles size={14} /> Usar datos demo (sin cuenta)
          </button>
        </div>
        <p style={{ color: C.textFaint }} className="text-[10px] text-center mt-4">Tus datos se guardan de forma segura en tu cuenta.</p>
      </Shell>
    );
  }

  // ---- Crear cuenta: email + password + perfil ----
  if (mode === "create" && !editMode) {
    if (step < 1) {
      return (
        <Shell>
          <BackBtn onClick={() => setMode(null)} />
          <h2 style={{ color: C.text }} className="text-[15px] font-semibold mb-3">Crear cuenta</h2>
          {err && <ErrBox msg={err} />}
          <Field label="Correo" value={email} onChange={setEmail} placeholder="tu@correo.com" type="email" />
          <div className="h-2.5" />
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

  // ---- Edición de perfil (ya logueado) ----
  if (editMode) {
    return <ProfileStep form={form} setForm={setForm} toggleCond={toggleCond} step={step} setStep={setStep}
      onBack={onSave ? () => onSave(null) : undefined} onSubmit={submitCreate} busy={busy} err={err} finishLabel="Guardar perfil" isEdit />;
  }

  // ---- Iniciar sesión ----
  return (
    <Shell>
      <BackBtn onClick={() => setMode(null)} />
      <h2 style={{ color: C.text }} className="text-[15px] font-semibold mb-3">Iniciar sesión</h2>
      {err && <ErrBox msg={err} />}
      <Field label="Correo" value={email} onChange={setEmail} placeholder="tu@correo.com" type="email" />
      <div className="h-2.5" />
      <Field label="Contraseña" value={password} onChange={setPassword} placeholder="Tu contraseña" type="password" />
      <Primary onClick={submitLogin} disabled={busy || !email || !password}>Entrar</Primary>
    </Shell>
  );
}

// ---------- Sub-componentes ----------
function Shell({ children }) {
  return (
    <div style={{ position: "fixed", inset: 0, zIndex: 50, display: "flex", alignItems: "center", justifyContent: "center", padding: "24px 20px", background: C.bg, fontSize: "13px" }}>
      <div style={{ width: "100%", maxWidth: 360 }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 8, marginBottom: 20 }}>
          <div style={{ background: C.teal, width: 28, height: 28, borderRadius: 10, display: "flex", alignItems: "center", justifyContent: "center" }}>
            <Activity size={15} color={C.bg} strokeWidth={2.5} />
          </div>
          <span style={{ color: C.text, fontFamily: "'Space Grotesk', sans-serif", fontSize: 17, fontWeight: 700, letterSpacing: "-0.01em" }}>BioPulse</span>
        </div>
        <div className="glass rounded-2xl p-4" style={{ background: C.card, border: `1px solid ${C.border}` }}>{children}</div>
      </div>
    </div>
  );
}
function BigBtn({ onClick, icon, title, sub }) {
  return (
    <button onClick={onClick} className="flex items-center gap-2.5 p-3 rounded-xl active:scale-95 transition-transform text-left"
      style={{ background: C.card, border: `1px solid ${C.border}` }}>
      <div style={{ background: `${C.teal}1F`, color: C.teal }} className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0">{icon}</div>
      <div>
        <div style={{ color: C.text }} className="text-[13px] font-semibold">{title}</div>
        <div style={{ color: C.textMuted }} className="text-[11px]">{sub}</div>
      </div>
    </button>
  );
}
function BackBtn({ onClick }) {
  return <button onClick={onClick} className="mb-2.5 flex items-center gap-1 text-[12px] font-medium active:scale-95"
    style={{ color: C.textMuted }}><ArrowLeft size={13} /> Volver</button>;
}
function Field({ label, value, onChange, placeholder, type }) {
  return (
    <div>
      <label style={{ color: C.textMuted }} className="text-[12px] font-medium">{label}</label>
      <input type={type || "text"} value={value} onChange={(e) => onChange(e.target.value)} placeholder={placeholder}
        className="w-full mt-1 rounded-lg px-2.5 py-2 text-[13px] outline-none"
        style={{ background: C.bgSoft, border: `1px solid ${C.border}`, color: C.text }} />
    </div>
  );
}
function Primary({ onClick, children, disabled }) {
  return (
    <button onClick={onClick} disabled={disabled} className="mt-4 w-full flex items-center justify-center gap-1 px-3 py-2.5 rounded-xl text-[13px] font-semibold active:scale-95 transition-transform disabled:opacity-40"
      style={{ background: C.teal, color: C.bg }}>{children} <ArrowRight size={14} /></button>
  );
}
function ErrBox({ msg }) {
  return <div className="rounded-lg p-2 text-[11px] mb-2.5" style={{ background: `${C.rose}14`, border: `1px solid ${C.rose}33`, color: C.rose }}>{msg}</div>;
}

function ProfileStep({ form, setForm, toggleCond, step, setStep, onBack, onSubmit, busy, err, finishLabel, isEdit }) {
  return (
    <div>
      {onBack && <BackBtn onClick={onBack} />}
      {step === 0 && (
        <div>
          <h2 style={{ color: C.text }} className="text-[15px] font-semibold mb-1">Cuéntanos sobre ti</h2>
          <p style={{ color: C.textMuted }} className="text-[12px] mb-3">Para personalizar tus índices.</p>
          <Field label="Nombre" value={form.name} onChange={(v) => setForm({ ...form, name: v })} placeholder="Tu nombre" />
          <div className="h-2.5" />
          <Field label="Edad" value={form.age} onChange={(v) => setForm({ ...form, age: v })} placeholder="Ej. 28" />
          <Primary onClick={() => form.name.trim() && form.age.trim() ? setStep(1) : setErr("Nombre y edad son obligatorios.")} disabled={busy}>Continuar</Primary>
          {err && <ErrBox msg={err} />}
        </div>
      )}
      {step === 1 && (
        <div>
          <h2 style={{ color: C.text }} className="text-[15px] font-semibold mb-1">Tu objetivo</h2>
          <p style={{ color: C.textMuted }} className="text-[12px] mb-3">¿Qué quieres lograr?</p>
          <div className="grid grid-cols-2 gap-2">
            {GOALS.map((g) => (
              <button key={g.key} onClick={() => setForm({ ...form, goal: g.key })}
                className="rounded-xl p-2.5 flex flex-col items-center gap-1 active:scale-95 transition-transform"
                style={{ background: form.goal === g.key ? `${C.teal}1F` : C.bgSoft, border: `1px solid ${form.goal === g.key ? C.teal : C.border}` }}>
                <span className="text-xl">{g.icon}</span>
                <span style={{ color: form.goal === g.key ? C.teal : C.text }} className="text-[11px] font-medium text-center leading-tight">{g.label}</span>
              </button>
            ))}
          </div>
          <label style={{ color: C.textMuted }} className="text-[12px] font-medium block mt-3 mb-1">Sexo biológico</label>
          <div className="flex gap-1.5">
            {SEX.map((s) => (
              <button key={s.key} onClick={() => setForm({ ...form, sex: s.key })}
                className="flex-1 rounded-lg py-1.5 text-[11px] font-medium active:scale-95 transition-transform"
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
          <h2 style={{ color: C.text }} className="text-[15px] font-semibold mb-1">Contexto de salud</h2>
          <p style={{ color: C.textMuted }} className="text-[12px] mb-3">Opcional, ayuda a interpretar mejor tus señales.</p>
          <div className="flex flex-wrap gap-1.5">
            {CONDITIONS.map((c) => {
              const on = form.conditions.includes(c.key);
              return (
                <button key={c.key} onClick={() => toggleCond(c.key)}
                  className="rounded-full px-2.5 py-1.5 text-[11px] font-medium active:scale-95 transition-transform"
                  style={{ background: on ? `${C.teal}1F` : C.bgSoft, border: `1px solid ${on ? C.teal : C.border}`, color: on ? C.teal : C.textMuted }}>
                  {c.label}
                </button>
              );
            })}
          </div>
          {form.conditions.includes("otra") && (
            <input type="text" value={form.otherCondition} onChange={(e) => setForm({ ...form, otherCondition: e.target.value })}
              placeholder="Escribe tu condición"
              className="w-full mt-2 rounded-lg px-2.5 py-2 text-[12px] outline-none"
              style={{ background: C.bgSoft, border: `1px solid ${C.teal}55`, color: C.text }} />
          )}
          <label style={{ color: C.textMuted }} className="text-[12px] font-medium block mt-3 mb-1">Nivel de actividad</label>
          <div className="flex gap-1.5">
            {ACTIVITY.map((a) => (
              <button key={a.key} onClick={() => setForm({ ...form, activity: a.key })}
                className="flex-1 rounded-lg py-1.5 text-[11px] font-medium active:scale-95 transition-transform"
                style={{ background: form.activity === a.key ? `${C.teal}1F` : C.bgSoft, border: `1px solid ${form.activity === a.key ? C.teal : C.border}`, color: form.activity === a.key ? C.teal : C.text }}>
                {a.label}
              </button>
            ))}
          </div>
          <label style={{ color: C.textMuted }} className="text-[12px] font-medium block mt-3 mb-1">¿Fumas?</label>
          <div className="flex gap-1.5">
            {SMOKE.map((s) => (
              <button key={s.key} onClick={() => setForm({ ...form, smoke: s.key })}
                className="flex-1 rounded-lg py-1.5 text-[11px] font-medium active:scale-95 transition-transform"
                style={{ background: form.smoke === s.key ? `${C.teal}1F` : C.bgSoft, border: `1px solid ${form.smoke === s.key ? C.teal : C.border}`, color: form.smoke === s.key ? C.teal : C.text }}>
                {s.label}
              </button>
            ))}
          </div>
          <div className="grid grid-cols-2 gap-2 mt-3">
            <div>
              <label style={{ color: C.textMuted }} className="text-[12px] font-medium">Peso (kg)</label>
              <input type="number" value={form.weightKg} onChange={(e) => setForm({ ...form, weightKg: e.target.value })} placeholder="Ej. 70"
                className="w-full mt-1 rounded-lg px-2.5 py-1.5 text-[13px] outline-none" style={{ background: C.bgSoft, border: `1px solid ${C.border}`, color: C.text }} />
            </div>
            <div>
              <label style={{ color: C.textMuted }} className="text-[12px] font-medium">Altura (cm)</label>
              <input type="number" value={form.heightCm} onChange={(e) => setForm({ ...form, heightCm: e.target.value })} placeholder="Ej. 170"
                className="w-full mt-1 rounded-lg px-2.5 py-1.5 text-[13px] outline-none" style={{ background: C.bgSoft, border: `1px solid ${C.border}`, color: C.text }} />
            </div>
          </div>
          <Primary onClick={onSubmit} disabled={busy}>{busy ? "Guardando..." : finishLabel}</Primary>
          {err && <ErrBox msg={err} />}
        </div>
      )}
    </div>
  );
}
