// ============================================================
// Onboarding — flujo de ~30s que calibra el contexto personal.
// Tres entradas: Crear cuenta / Iniciar sesion / Usar datos demo.
// Crear cuenta: email+pass (con ojo) -> pregunta de recuperacion -> perfil.
// Modo edicion (editMode): reusa el cuestionario para actualizar perfil.
// Escala coherente con la app (estilos inline en Shell, base 13px).
// ============================================================
import React, { useState } from "react";
import { C } from "./ui.jsx";
import { Activity, ArrowRight, ArrowLeft, LogIn, UserPlus, Sparkles, Eye, EyeOff } from "lucide-react";

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
const RECOVERY_QS = [
  "¿Cuál es el nombre de tu primera mascota?",
  "¿En qué ciudad naciste?",
  "¿Cuál es el apellido de soltera de tu madre?",
  "¿Cuál fue el nombre de tu mejor amigo de la infancia?",
  "¿Qué marca fue tu primer auto?",
];

export default function Onboarding({ auth, onDemo, editMode = false, initialProfile = null, onSave = null }) {
  const [mode, setMode] = useState(editMode ? "create" : null);
  const [step, setStep] = useState(editMode ? 2 : 0);
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
  const [recoveryQ, setRecoveryQ] = useState(RECOVERY_QS[0]);
  const [recoveryA, setRecoveryA] = useState("");
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
      await auth.register(email.trim(), password, profile, { question: recoveryQ, answer: recoveryA.trim() });
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
        <h2 style={{ color: C.text, fontSize: 16, fontWeight: 600, marginBottom: 4, textAlign: "center" }}>Bienvenido a BioPulse</h2>
        <p style={{ color: C.textMuted, fontSize: 12, textAlign: "center", marginBottom: 20 }}>Crea tu cuenta para guardar tu perfil, o usa datos demo.</p>
        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          <BigBtn onClick={() => setMode("create")} icon={<UserPlus size={16} />} title="Crear cuenta" sub="Registra correo y contraseña" />
          <BigBtn onClick={() => setMode("login")} icon={<LogIn size={16} />} title="Iniciar sesión" sub="Ya tengo una cuenta" />
          <button onClick={onDemo} style={{ marginTop: 4, display: "flex", alignItems: "center", justifyContent: "center", gap: 6, padding: "10px 0", borderRadius: 12, fontSize: 12, fontWeight: 500, background: C.bgSoft, border: `1px solid ${C.border}`, color: C.textMuted }}>
            <Sparkles size={14} /> Usar datos demo (sin cuenta)
          </button>
        </div>
        <p style={{ color: C.textFaint, fontSize: 10, textAlign: "center", marginTop: 16 }}>Tus datos se guardan de forma segura en tu cuenta.</p>
      </Shell>
    );
  }

  // ---- Crear cuenta: email + password + recuperacion + perfil ----
  if (mode === "create" && !editMode) {
    if (step < 1) {
      return (
        <Shell>
          <BackBtn onClick={() => setMode(null)} />
          <h2 style={{ color: C.text, fontSize: 15, fontWeight: 600, marginBottom: 12 }}>Crear cuenta</h2>
          {err && <ErrBox msg={err} />}
          <Field label="Correo" value={email} onChange={setEmail} placeholder="tu@correo.com" type="email" />
          <div style={{ height: 10 }} />
          <PassField label="Contraseña" value={password} onChange={setPassword} placeholder="Mínimo 6 caracteres" />
          <Primary onClick={() => { if (email && password.length >= 6) { setErr(null); setStep(1); } else setErr("Ingresa correo y contraseña (mín. 6)."); }} disabled={busy}>Continuar</Primary>
        </Shell>
      );
    }
    if (step < 2) {
      return (
        <Shell>
          <BackBtn onClick={() => setStep(0)} />
          <h2 style={{ color: C.text, fontSize: 15, fontWeight: 600, marginBottom: 4 }}>Recuperación</h2>
          <p style={{ color: C.textMuted, fontSize: 12, marginBottom: 12 }}>Elige una pregunta para restablecer tu contraseña si la olvidas.</p>
          {err && <ErrBox msg={err} />}
          <label style={{ color: C.textMuted, fontSize: 12, fontWeight: 500 }}>Pregunta de seguridad</label>
          <select value={recoveryQ} onChange={(e) => setRecoveryQ(e.target.value)}
            style={{ width: "100%", marginTop: 4, borderRadius: 8, padding: "10px 12px", fontSize: 13, background: C.bgSoft, border: `1px solid ${C.border}`, color: C.text }}>
            {RECOVERY_QS.map((q) => <option key={q} value={q}>{q}</option>)}
          </select>
          <div style={{ height: 10 }} />
          <PassField label="Tu respuesta" value={recoveryA} onChange={setRecoveryA} placeholder="Respuesta" />
          <Primary onClick={() => { if (recoveryA.trim()) { setErr(null); setStep(2); } else setErr("Escribe una respuesta."); }} disabled={busy}>Continuar</Primary>
        </Shell>
      );
    }
    return <ProfileStep form={form} setForm={setForm} toggleCond={toggleCond} step={step} setStep={setStep}
      onBack={() => setStep(1)} onSubmit={submitCreate} busy={busy} err={err} finishLabel="Crear cuenta" />;
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
      <h2 style={{ color: C.text, fontSize: 15, fontWeight: 600, marginBottom: 12 }}>Iniciar sesión</h2>
      {err && <ErrBox msg={err} />}
      <Field label="Correo" value={email} onChange={setEmail} placeholder="tu@correo.com" type="email" />
      <div style={{ height: 10 }} />
      <PassField label="Contraseña" value={password} onChange={setPassword} placeholder="Tu contraseña" />
      <Primary onClick={submitLogin} disabled={busy || !email || !password}>Entrar</Primary>
    </Shell>
  );
}

// ---------- Sub-componentes ----------
function Shell({ children }) {
  return (
    <div style={{ position: "fixed", inset: 0, zIndex: 50, display: "flex", alignItems: "center", justifyContent: "center", padding: "24px 20px", background: C.bg, fontSize: 13 }}>
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
    <button onClick={onClick} style={{ display: "flex", alignItems: "center", gap: 10, padding: 12, borderRadius: 12, background: C.card, border: `1px solid ${C.border}` }}>
      <div style={{ background: `${C.teal}1F`, color: C.teal, width: 32, height: 32, borderRadius: 10, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>{icon}</div>
      <div>
        <div style={{ color: C.text, fontSize: 13, fontWeight: 600 }}>{title}</div>
        <div style={{ color: C.textMuted, fontSize: 11 }}>{sub}</div>
      </div>
    </button>
  );
}
function BackBtn({ onClick }) {
  return <button onClick={onClick} style={{ display: "flex", alignItems: "center", gap: 4, fontSize: 12, fontWeight: 500, marginBottom: 10, color: C.textMuted }}><ArrowLeft size={13} /> Volver</button>;
}
function Field({ label, value, onChange, placeholder, type }) {
  return (
    <div>
      <label style={{ color: C.textMuted, fontSize: 12, fontWeight: 500 }}>{label}</label>
      <input type={type || "text"} value={value} onChange={(e) => onChange(e.target.value)} placeholder={placeholder}
        style={{ width: "100%", marginTop: 4, borderRadius: 8, padding: "10px 12px", fontSize: 13, background: C.bgSoft, border: `1px solid ${C.border}`, color: C.text }} />
    </div>
  );
}
function PassField({ label, value, onChange, placeholder }) {
  const [show, setShow] = useState(false);
  return (
    <div>
      <label style={{ color: C.textMuted, fontSize: 12, fontWeight: 500 }}>{label}</label>
      <div style={{ position: "relative", marginTop: 4 }}>
        <input type={show ? "text" : "password"} value={value} onChange={(e) => onChange(e.target.value)} placeholder={placeholder}
          style={{ width: "100%", borderRadius: 8, padding: "10px 38px 10px 12px", fontSize: 13, background: C.bgSoft, border: `1px solid ${C.border}`, color: C.text }} />
        <button type="button" onClick={() => setShow((s) => !s)} aria-label={show ? "Ocultar contraseña" : "Mostrar contraseña"}
          style={{ position: "absolute", right: 8, top: "50%", transform: "translateY(-50%)", color: C.textMuted, display: "flex" }}>
          {show ? <EyeOff size={16} /> : <Eye size={16} />}
        </button>
      </div>
    </div>
  );
}
function Primary({ onClick, children, disabled }) {
  return (
    <button onClick={onClick} disabled={disabled} style={{ marginTop: 16, width: "100%", display: "flex", alignItems: "center", justifyContent: "center", gap: 4, padding: "10px 12px", borderRadius: 12, fontSize: 13, fontWeight: 600, background: C.teal, color: C.bg, opacity: disabled ? 0.4 : 1 }}>
      {children} <ArrowRight size={14} />
    </button>
  );
}
function ErrBox({ msg }) {
  return <div style={{ background: `${C.rose}14`, border: `1px solid ${C.rose}33`, color: C.rose, borderRadius: 8, padding: 8, fontSize: 11, marginBottom: 10 }}>{msg}</div>;
}

function ProfileStep({ form, setForm, toggleCond, step, setStep, onBack, onSubmit, busy, err, finishLabel, isEdit }) {
  return (
    <div>
      {onBack && <BackBtn onClick={onBack} />}
      {step === 2 && (
        <div>
          <h2 style={{ color: C.text, fontSize: 15, fontWeight: 600, marginBottom: 4 }}>Cuéntanos sobre ti</h2>
          <p style={{ color: C.textMuted, fontSize: 12, marginBottom: 12 }}>Para personalizar tus índices.</p>
          <Field label="Nombre" value={form.name} onChange={(v) => setForm({ ...form, name: v })} placeholder="Tu nombre" />
          <div style={{ height: 10 }} />
          <Field label="Edad" value={form.age} onChange={(v) => setForm({ ...form, age: v })} placeholder="Ej. 28" />
          <Primary onClick={() => form.name.trim() && form.age.trim() ? setStep(3) : setErr("Nombre y edad son obligatorios.")} disabled={busy}>Continuar</Primary>
          {err && <ErrBox msg={err} />}
        </div>
      )}
      {step === 3 && (
        <div>
          <h2 style={{ color: C.text, fontSize: 15, fontWeight: 600, marginBottom: 4 }}>Tu objetivo</h2>
          <p style={{ color: C.textMuted, fontSize: 12, marginBottom: 12 }}>¿Qué quieres lograr?</p>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
            {GOALS.map((g) => (
              <button key={g.key} onClick={() => setForm({ ...form, goal: g.key })}
                style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 4, padding: 10, borderRadius: 12, background: form.goal === g.key ? `${C.teal}1F` : C.bgSoft, border: `1px solid ${form.goal === g.key ? C.teal : C.border}` }}>
                <span style={{ fontSize: 20 }}>{g.icon}</span>
                <span style={{ color: form.goal === g.key ? C.teal : C.text, fontSize: 11, fontWeight: 500, textAlign: "center", lineHeight: 1.2 }}>{g.label}</span>
              </button>
            ))}
          </div>
          <label style={{ color: C.textMuted, fontSize: 12, fontWeight: 500, display: "block", marginTop: 12, marginBottom: 4 }}>Sexo biológico</label>
          <div style={{ display: "flex", gap: 6 }}>
            {SEX.map((s) => (
              <button key={s.key} onClick={() => setForm({ ...form, sex: s.key })}
                style={{ flex: 1, padding: 6, fontSize: 11, fontWeight: 500, borderRadius: 10, background: form.sex === s.key ? `${C.teal}1F` : C.bgSoft, border: `1px solid ${form.sex === s.key ? C.teal : C.border}`, color: form.sex === s.key ? C.teal : C.text }}>
                {s.label}
              </button>
            ))}
          </div>
          <Primary onClick={() => setStep(4)} disabled={busy}>Continuar</Primary>
        </div>
      )}
      {step === 4 && (
        <div>
          <h2 style={{ color: C.text, fontSize: 15, fontWeight: 600, marginBottom: 4 }}>Contexto de salud</h2>
          <p style={{ color: C.textMuted, fontSize: 12, marginBottom: 12 }}>Opcional, ayuda a interpretar mejor tus señales.</p>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
            {CONDITIONS.map((c) => {
              const on = form.conditions.includes(c.key);
              return (
                <button key={c.key} onClick={() => toggleCond(c.key)}
                  style={{ padding: "6px 10px", fontSize: 11, fontWeight: 500, borderRadius: 999, background: on ? `${C.teal}1F` : C.bgSoft, border: `1px solid ${on ? C.teal : C.border}`, color: on ? C.teal : C.textMuted }}>
                  {c.label}
                </button>
              );
            })}
          </div>
          {form.conditions.includes("otra") && (
            <input type="text" value={form.otherCondition} onChange={(e) => setForm({ ...form, otherCondition: e.target.value })}
              placeholder="Escribe tu condición"
              style={{ width: "100%", marginTop: 8, borderRadius: 8, padding: "10px 12px", fontSize: 12, background: C.bgSoft, border: `1px solid ${C.teal}55`, color: C.text }} />
          )}
          <label style={{ color: C.textMuted, fontSize: 12, fontWeight: 500, display: "block", marginTop: 12, marginBottom: 4 }}>Nivel de actividad</label>
          <div style={{ display: "flex", gap: 6 }}>
            {ACTIVITY.map((a) => (
              <button key={a.key} onClick={() => setForm({ ...form, activity: a.key })}
                style={{ flex: 1, padding: 6, fontSize: 11, fontWeight: 500, borderRadius: 10, background: form.activity === a.key ? `${C.teal}1F` : C.bgSoft, border: `1px solid ${form.activity === a.key ? C.teal : C.border}`, color: form.activity === a.key ? C.teal : C.text }}>
                {a.label}
              </button>
            ))}
          </div>
          <label style={{ color: C.textMuted, fontSize: 12, fontWeight: 500, display: "block", marginTop: 12, marginBottom: 4 }}>¿Fumas?</label>
          <div style={{ display: "flex", gap: 6 }}>
            {SMOKE.map((s) => (
              <button key={s.key} onClick={() => setForm({ ...form, smoke: s.key })}
                style={{ flex: 1, padding: 6, fontSize: 11, fontWeight: 500, borderRadius: 10, background: form.smoke === s.key ? `${C.teal}1F` : C.bgSoft, border: `1px solid ${form.smoke === s.key ? C.teal : C.border}`, color: form.smoke === s.key ? C.teal : C.text }}>
                {s.label}
              </button>
            ))}
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8, marginTop: 12 }}>
            <div>
              <label style={{ color: C.textMuted, fontSize: 12, fontWeight: 500 }}>Peso (kg)</label>
              <input type="number" value={form.weightKg} onChange={(e) => setForm({ ...form, weightKg: e.target.value })} placeholder="Ej. 70"
                style={{ width: "100%", marginTop: 4, borderRadius: 8, padding: "6px 12px", fontSize: 13, background: C.bgSoft, border: `1px solid ${C.border}`, color: C.text }} />
            </div>
            <div>
              <label style={{ color: C.textMuted, fontSize: 12, fontWeight: 500 }}>Altura (cm)</label>
              <input type="number" value={form.heightCm} onChange={(e) => setForm({ ...form, heightCm: e.target.value })} placeholder="Ej. 170"
                style={{ width: "100%", marginTop: 4, borderRadius: 8, padding: "6px 12px", fontSize: 13, background: C.bgSoft, border: `1px solid ${C.border}`, color: C.text }} />
            </div>
          </div>
          <Primary onClick={onSubmit} disabled={busy}>{busy ? "Guardando..." : finishLabel}</Primary>
          {err && <ErrBox msg={err} />}
        </div>
      )}
    </div>
  );
}
