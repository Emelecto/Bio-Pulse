// ============================================================
// TAB CONFIG — auth real (backend Vercel, Camino A) + conexión de
// datos (CSV/Demo/Wearable), umbral de riesgo y organización.
// NO usa Supabase: recibe `auth` (useAuth) y `hook` (useBiopulseData)
// como props desde AppInner, evitando instanciar useAuth dos veces.
// ============================================================
import React, { useState } from "react";
import { User, Key, Upload, Database, Trash2, RefreshCw, AlertTriangle, Mail, CheckCircle2, LogIn, UserPlus, Sparkles, Pencil, Eye, EyeOff } from "lucide-react";
import { C } from "./ui.jsx";
import { useTheme } from "../lib/theme.jsx";
import Onboarding from "./Onboarding.jsx";

// Input de contrasena con ojo (mostrar/ocultar)
function PassField({ label, value, onChange, placeholder }) {
  const [show, setShow] = useState(false);
  return (
    <div>
      <label style={{ color: C.textMuted }} className="text-[12px] font-medium">{label}</label>
      <div style={{ position: "relative", marginTop: 4 }}>
        <input type={show ? "text" : "password"} value={value} onChange={(e) => onChange(e.target.value)} placeholder={placeholder}
          style={{ width: "100%", borderRadius: 8, padding: "10px 38px 10px 12px", fontSize: 13, background: C.bgSoft, border: `1px solid ${C.borderSoft}`, color: C.text }} />
        <button type="button" onClick={() => setShow((s) => !s)} aria-label={show ? "Ocultar" : "Mostrar"}
          style={{ position: "absolute", right: 8, top: "50%", transform: "translateY(-50%)", color: C.textMuted, display: "flex" }}>
          {show ? <EyeOff size={16} /> : <Eye size={16} />}
        </button>
      </div>
    </div>
  );
}

export default function Config({ data, hook, auth }) {
  const {
    customSourceLabel, showModal, setShowModal, activeTab, setActiveTab,
    handleCsvFile, csvHeaders, csvMapping, setCsvMapping, csvError, csvFileName, csvRowCount,
    confirmCsv, onUseDemo, clearCustom, riskThreshold, setRiskThreshold, clearAllData,
  } = hook;

  const { theme, toggleTheme } = useTheme();
  const [email, setEmail] = useState("");
  const [pass, setPass] = useState("");
  const [view, setView] = useState("choice"); // choice | login | signup
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState(null);
  const [editing, setEditing] = useState(false);
  const [resetView, setResetView] = useState(false); // flujo de recuperacion
  const [recoveryQ, setRecoveryQ] = useState(null);
  const [resetEmail, setResetEmail] = useState("");
  const [resetAnswer, setResetAnswer] = useState("");
  const [resetPass, setResetPass] = useState("");
  const [resetToken, setResetToken] = useState(null);

  // Edicion de perfil: reusa el cuestionario Onboarding (modo edicion),
  // guarda via auth.saveProfile (backend) -> queda linked a la cuenta.
  if (editing) {
    return (
      <Onboarding
        auth={auth}
        editMode
        initialProfile={auth.profile}
        onSave={async (profile) => {
          if (profile === null) { setEditing(false); return; }
          try { await auth.saveProfile(profile); } catch (e) { setErr(e.message || "No se pudo guardar."); }
          setEditing(false);
        }}
      />
    );
  }

  const doSignUp = async (e) => {
    e.preventDefault();
    setBusy(true); setErr(null);
    try {
      const profile = { email: email.trim(), name: email.split("@")[0] };
      await auth.register(email.trim(), pass, profile);
      // register cierra el flujo (App deja de mostrar onboarding)
    } catch (er) {
      setErr(er.message || "No se pudo crear la cuenta.");
      setBusy(false);
    }
  };
  const doSignIn = async (e) => {
    e.preventDefault();
    setBusy(true); setErr(null);
    try {
      await auth.login(email.trim(), pass);
    } catch (er) {
      setErr(er.message || "No se pudo iniciar sesión.");
      setBusy(false);
    }
  };
  const doDemo = () => {
    setErr(null);
    auth.skip(); // usa datos demo y recuerda la eleccion
  };

  const displayName = (auth.profile?.name) || (auth.user?.email ? auth.user.email.split("@")[0] : "Usuario");

  return (
    <div className="flex flex-col gap-5">
      {/* CUENTA / AUTH */}
      <div style={{ background: C.card, border: `1px solid ${C.border}` }} className="glass rounded-3xl p-4">
        <div className="flex items-center gap-2 mb-4">
          <User size={16} style={{ color: C.teal }} />
          <span style={{ color: C.text }} className="text-sm font-semibold">Cuenta</span>
          {auth.token && (
            <span style={{ background: `${C.teal}1A`, color: C.teal }} className="text-[9px] font-semibold px-2 py-0.5 rounded-full ml-auto">BioPulse</span>
          )}
        </div>

        {/* LOGGED IN */}
        {auth.token ? (
          <div>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div style={{ background: C.teal }} className="w-9 h-9 rounded-full flex items-center justify-center text-[13px] font-bold">
                  <span style={{ color: C.bg }}>{displayName[0]?.toUpperCase()}</span>
                </div>
                <div>
                  <span style={{ color: C.text }} className="text-[13px] font-medium block">{displayName}</span>
                  <span style={{ color: C.textFaint }} className="text-[11px]">{auth.user?.email}</span>
                </div>
              </div>
              <button onClick={auth.logout} style={{ color: C.rose }} className="text-[12px]">Cerrar sesión</button>
            </div>
            {/* Resumen del perfil linked a la cuenta */}
            <div className="mt-3 rounded-xl px-3 py-2.5" style={{ background: C.bgSoft, border: `1px solid ${C.borderSoft}` }}>
              <div className="flex items-center justify-between mb-1.5">
                <span style={{ color: C.textMuted }} className="text-[11px] font-medium">Tu perfil</span>
                <button onClick={() => setEditing(true)} style={{ color: C.teal }} className="text-[11px] font-medium flex items-center gap-1">
                  <Pencil size={11} /> Editar
                </button>
              </div>
              <div className="flex flex-wrap gap-1.5">
                {profileChips(auth.profile).map((c, i) => (
                  <span key={i} style={{ background: `${C.teal}14`, color: C.teal }} className="text-[10.5px] px-2 py-0.5 rounded-full">{c}</span>
                ))}
                {profileChips(auth.profile).length === 0 && (
                  <span style={{ color: C.textFaint }} className="text-[10.5px]">Sin datos de perfil aún.</span>
                )}
              </div>
            </div>
          </div>
        ) : view === "choice" ? (
          /* ELECCIÓN INICIAL: TRES BOTONES CLAROS */
          <div className="flex flex-col gap-2.5">
            <button onClick={() => setView("signup")} style={{ background: C.teal, color: C.bg }} className="w-full text-[13px] font-semibold py-3 rounded-xl flex items-center justify-center gap-1.5">
              <UserPlus size={15} /> Crear cuenta
            </button>
            <button onClick={() => setView("login")} style={{ background: "transparent", color: C.teal, border: `1px solid ${C.teal}` }} className="w-full text-[13px] font-semibold py-3 rounded-xl flex items-center justify-center gap-1.5">
              <LogIn size={15} /> Iniciar sesión
            </button>
            <button onClick={doDemo} style={{ background: C.bgSoft, color: C.textMuted, border: `1px solid ${C.border}` }} className="w-full text-[12px] font-medium py-3 rounded-xl flex items-center justify-center gap-1.5">
              <Sparkles size={14} /> Usar datos demo (sin cuenta)
            </button>
          </div>
        ) : view === "login" ? (
          <form onSubmit={doSignIn} className="flex flex-col gap-2.5">
            <input type="email" required placeholder="tu@correo.com" value={email}
              onChange={(e) => setEmail(e.target.value)} style={{ background: C.bgSoft, border: `1px solid ${C.borderSoft}`, color: C.text }}
              className="text-xs rounded-lg px-3 py-2.5 outline-none" />
            <PassField label="" value={pass} onChange={setPass} placeholder="Contraseña" />
            <button type="submit" disabled={busy} style={{ background: C.teal, color: C.bg, opacity: busy ? 0.6 : 1 }} className="text-[13px] font-semibold py-3 rounded-xl">
              {busy ? "Procesando…" : "Entrar"}
            </button>
            <button type="button" onClick={() => setView("reset-email")} style={{ color: C.teal }} className="text-[11px]">¿Olvidaste tu contraseña?</button>
            <button type="button" onClick={() => setView("choice")} style={{ color: C.textFaint }} className="text-[11px]">← Volver</button>
          </form>
        ) : view === "reset-email" ? (
          <form onSubmit={async (e) => { e.preventDefault(); setBusy(true); setErr(null); try { const q = await auth.requestRecoveryQuestion(resetEmail.trim()); setRecoveryQ(q); setView("reset-answer"); } catch (er) { setErr(er.message || "No encontramos esa cuenta."); } finally { setBusy(false); } }} className="flex flex-col gap-2.5">
            <label style={{ color: C.textMuted }} className="text-[12px] font-medium">Restablecer contraseña</label>
            <input type="email" required placeholder="tu@correo.com" value={resetEmail}
              onChange={(e) => setResetEmail(e.target.value)} style={{ background: C.bgSoft, border: `1px solid ${C.borderSoft}`, color: C.text }}
              className="text-xs rounded-lg px-3 py-2.5 outline-none" />
            <button type="submit" disabled={busy} style={{ background: C.teal, color: C.bg, opacity: busy ? 0.6 : 1 }} className="text-[13px] font-semibold py-3 rounded-xl">Continuar</button>
            <button type="button" onClick={() => setView("login")} style={{ color: C.textFaint }} className="text-[11px]">← Volver</button>
          </form>
        ) : view === "reset-answer" ? (
          <form onSubmit={async (e) => { e.preventDefault(); setBusy(true); setErr(null); try { const t = await auth.requestReset(resetEmail.trim(), resetAnswer.trim()); await auth.confirmReset(t, resetPass); setView("reset-done"); } catch (er) { setErr(er.message || "No se pudo restablecer."); } finally { setBusy(false); } }} className="flex flex-col gap-2.5">
            <label style={{ color: C.textMuted }} className="text-[12px] font-medium">{recoveryQ}</label>
            <PassField label="" value={resetAnswer} onChange={setResetAnswer} placeholder="Tu respuesta" />
            <PassField label="" value={resetPass} onChange={setResetPass} placeholder="Nueva contraseña (mín 6)" />
            <button type="submit" disabled={busy || resetPass.length < 6} style={{ background: C.teal, color: C.bg, opacity: busy ? 0.6 : 1 }} className="text-[13px] font-semibold py-3 rounded-xl">Restablecer</button>
            <button type="button" onClick={() => setView("reset-email")} style={{ color: C.textFaint }} className="text-[11px]">← Volver</button>
          </form>
        ) : view === "reset-done" ? (
          <div className="flex flex-col gap-2.5 text-center">
            <CheckCircle2 size={28} style={{ color: C.teal }} className="mx-auto" />
            <span style={{ color: C.text }} className="text-[13px] font-medium">Contraseña actualizada</span>
            <button onClick={() => setView("login")} style={{ background: C.teal, color: C.bg }} className="text-[13px] font-semibold py-3 rounded-xl">Iniciar sesión</button>
          </div>
        ) : (
          <form onSubmit={doSignUp} className="flex flex-col gap-2.5">
            <input type="email" required placeholder="tu@correo.com" value={email}
              onChange={(e) => setEmail(e.target.value)} style={{ background: C.bgSoft, border: `1px solid ${C.borderSoft}`, color: C.text }}
              className="text-xs rounded-lg px-3 py-2.5 outline-none" />
            <PassField label="" value={pass} onChange={setPass} placeholder="Contraseña (mín 6)" />
            <button type="submit" disabled={busy} style={{ background: C.teal, color: C.bg, opacity: busy ? 0.6 : 1 }} className="text-[13px] font-semibold py-3 rounded-xl">
              {busy ? "Procesando…" : "Crear cuenta"}
            </button>
            <button type="button" onClick={() => setView("choice")} style={{ color: C.textFaint }} className="text-[11px]">← Volver</button>
          </form>
        )}

        {/* ERRORES */}
        {err && (
          <div style={{ background: `${C.rose}12`, border: `1px solid ${C.rose}33` }} className="rounded-lg px-3 py-2 mt-3">
            <span style={{ color: C.rose }} className="text-[11px]">{err}</span>
          </div>
        )}
      </div>

      {/* APARIENCIA / TEMA */}
      <div style={{ background: C.card, border: `1px solid ${C.border}` }} className="glass rounded-3xl p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span style={{ color: C.text }} className="text-sm font-semibold">Tema</span>
          </div>
          <button
            onClick={toggleTheme}
            role="switch"
            aria-checked={theme === "light"}
            aria-label="Cambiar entre tema claro y oscuro"
            style={{ background: theme === "light" ? C.teal : C.borderSoft, border: `1px solid ${theme === "light" ? C.teal : C.border}` }}
            className="relative w-14 h-8 rounded-full transition-colors duration-300 flex items-center px-1"
          >
            <span
              style={{ background: theme === "light" ? C.bg : C.teal, transform: theme === "light" ? "translateX(24px)" : "translateX(0)" }}
              className="w-6 h-6 rounded-full shadow transition-transform duration-300 flex items-center justify-center text-[10px]"
            >
              {theme === "light" ? "☀" : "☾"}
            </span>
          </button>
        </div>
        <p style={{ color: C.textFaint }} className="text-[11px] mt-2">
          {theme === "light" ? "Modo claro activado." : "Modo oscuro activado."}
        </p>
      </div>

      {/* CONECTAR DATOS */}
      <div style={{ background: C.card, border: `1px solid ${C.border}` }} className="glass rounded-3xl p-4">
        <div className="flex items-center gap-2 mb-3">
          <Key size={16} style={{ color: C.amber }} />
          <span style={{ color: C.text }} className="text-sm font-semibold">Conectar datos</span>
        </div>
        <p style={{ color: C.textFaint }} className="text-[12px] leading-relaxed mb-3">
          Conecta tu wearable o sube un CSV. En producción, el backend (Vercel Function) guarda el token y consulta la API de forma segura.
        </p>
        <div className="flex gap-2">
          <button onClick={() => { setActiveTab("wearable"); setShowModal(true); }} style={{ background: C.teal, color: C.bg, border: `1px solid ${C.teal}` }} className="flex-1 text-xs font-semibold py-2.5 rounded-xl flex items-center justify-center gap-1.5">
            <Upload size={13} /> Wearable
          </button>
          <button onClick={() => { setActiveTab("csv"); setShowModal(true); }} style={{ background: C.teal, color: C.bg, border: `1px solid ${C.teal}` }} className="flex-1 text-xs font-semibold py-2.5 rounded-xl flex items-center justify-center gap-1.5">
            <Upload size={13} /> Subir CSV
          </button>
          <button onClick={onUseDemo} style={{ background: C.teal, color: C.bg, border: `1px solid ${C.teal}` }} className="flex-1 text-xs font-semibold py-2.5 rounded-xl flex items-center justify-center gap-1.5">
            <Database size={13} /> Demo
          </button>
        </div>
        {customSourceLabel && (
          <div className="mt-3 flex items-center justify-between rounded-xl px-3 py-2" style={{ background: C.bgSoft, border: `1px solid ${C.borderSoft}` }}>
            <span style={{ color: C.textFaint }} className="text-[11px]">Fuente: <span style={{ color: C.text }}>{customSourceLabel}</span></span>
            <button onClick={clearCustom} style={{ color: C.rose }} className="text-[11px] flex items-center gap-1"><Trash2 size={11} /> Quitar</button>
          </div>
        )}
      </div>

      {/* UMBRAL DE RIESGO */}
      <div style={{ background: C.card, border: `1px solid ${C.border}` }} className="glass rounded-3xl p-4">
        <div className="flex items-center justify-between mb-2">
          <span style={{ color: C.text }} className="text-sm font-semibold">Umbral de alerta</span>
          <span style={{ color: C.teal, fontFamily: "'IBM Plex Mono', monospace" }} className="text-sm">{riskThreshold}</span>
        </div>
        <input type="range" min="10" max="80" value={riskThreshold} onChange={(e) => setRiskThreshold(Number(e.target.value))}
          className="w-full accent-[#4FD8C4]" />
        <p style={{ color: C.textFaint }} className="text-[11px] mt-1">El coach marca alerta cuando el índice supera este valor.</p>
      </div>

      {/* ORGANIZACIÓN */}
      <div style={{ background: C.card, border: `1px solid ${C.border}` }} className="glass rounded-3xl p-4">
        <div className="flex items-center gap-2 mb-3">
          <RefreshCw size={16} style={{ color: C.purple }} />
          <span style={{ color: C.text }} className="text-sm font-semibold">Organización</span>
        </div>
        <button onClick={clearAllData} style={{ background: `${C.rose}14`, border: `1px solid ${C.rose}33`, color: C.rose }} className="w-full text-xs font-medium py-2.5 rounded-xl flex items-center justify-center gap-1.5">
          <Trash2 size={13} /> Borrar todos los datos locales
        </button>
        <p style={{ color: C.textFaint }} className="text-[10.5px] mt-2">Elimina fuente personalizada, historial y ajustes guardados en este dispositivo.</p>
      </div>
    </div>
  );
}

// Resume del perfil en chips para la seccion "Tu perfil" de Config.
function profileChips(p) {
  if (!p) return [];
  const out = [];
  if (p.age) out.push(`${p.age} años`);
  if (p.sex && p.sex !== "ns") out.push(p.sex);
  if (p.weightKg) out.push(`${p.weightKg} kg`);
  if (p.heightCm) out.push(`${p.heightCm} cm`);
  if (p.activity) out.push(`Act: ${p.activity}`);
  if (p.smoke && p.smoke !== "no") out.push(`Fuma: ${p.smoke}`);
  if (Array.isArray(p.conditions)) {
    p.conditions.forEach((c) => {
      if (c === "ninguna") return;
      out.push(c.startsWith("otra:") ? c.slice(5) : c);
    });
  }
  return out;
}
