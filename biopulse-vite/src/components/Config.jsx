// ============================================================
// TAB CONFIG — auth real (Supabase) con fallback mock, conexión
// de datos (Wearable/CSV/Demo), umbral de riesgo y organización.
// ============================================================
import React, { useState } from "react";
import { User, Key, Upload, Database, Trash2, RefreshCw, AlertTriangle, Link2, Mail, CheckCircle2 } from "lucide-react";
import { C } from "./ui.jsx";
import { useAuth } from "../hooks/useAuth.js";
import { useTheme } from "../lib/theme.jsx";

export default function Config({ data, hook }) {
  const {
    customSourceLabel, showModal, setShowModal, activeTab, setActiveTab,
    handleCsvFile, csvHeaders, csvMapping, setCsvMapping, csvError, csvFileName, csvRowCount,
    confirmCsv, onUseDemo, clearCustom, riskThreshold, setRiskThreshold, clearAllData,
  } = hook;

  const auth = useAuth();
  const { theme, toggleTheme } = useTheme();
  const [email, setEmail] = useState("");
  const [pass, setPass] = useState("");
  const [view, setView] = useState("choice"); // choice | login | signup

  const doSignUp = async (e) => {
    e.preventDefault();
    const r = await auth.signUp(email, pass);
    if (r === "confirm") setView("choice"); // el estado confirm se muestra via auth.needsConfirmation
  };
  const doSignIn = async (e) => {
    e.preventDefault();
    await auth.signIn(email, pass);
  };
  const doReset = async (e) => {
    e.preventDefault();
    if (!email) { auth.resetPassword(""); return; }
    await auth.resetPassword(email);
  };

  return (
    <div className="flex flex-col gap-5">
      {/* CUENTA / AUTH */}
      <div style={{ background: C.card, border: `1px solid ${C.border}` }} className="glass rounded-3xl p-4">
        <div className="flex items-center gap-2 mb-4">
          <User size={16} style={{ color: C.teal }} />
          <span style={{ color: C.text }} className="text-sm font-semibold">Cuenta</span>
          {auth.isReal && (
            <span style={{ background: `${C.teal}1A`, color: C.teal }} className="text-[9px] font-semibold px-2 py-0.5 rounded-full ml-auto">Supabase</span>
          )}
        </div>

        {/* LOGGED IN */}
        {auth.user ? (
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div style={{ background: C.teal }} className="w-9 h-9 rounded-full flex items-center justify-center text-[13px] font-bold">
                <span style={{ color: C.bg }}>{auth.user.name[0]?.toUpperCase()}</span>
              </div>
              <div>
                <span style={{ color: C.text }} className="text-[13px] font-medium block">{auth.user.name}</span>
                <span style={{ color: C.textFaint }} className="text-[11px]">{auth.user.email}</span>
              </div>
            </div>
            <button onClick={auth.signOut} style={{ color: C.rose }} className="text-[12px]">Cerrar sesión</button>
          </div>
        ) : auth.needsConfirmation ? (
          /* PENDIENTE DE VERIFICAR CORREO */
          <div style={{ background: `${C.teal}0D`, border: `1px solid ${C.teal}33` }} className="rounded-2xl p-4 flex flex-col items-center text-center">
            <Mail size={26} style={{ color: C.teal }} className="mb-2" />
            <span style={{ color: C.text }} className="text-[13px] font-semibold mb-1">Revisa tu correo</span>
            <p style={{ color: C.textFaint }} className="text-[12px] leading-relaxed">
              Revisa tu correo y haz clic en el enlace de verificación para activar tu cuenta.
            </p>
            <button onClick={() => { auth.signOut(); setView("login"); }} style={{ color: C.teal }} className="text-[12px] font-medium mt-3">Ir a iniciar sesión</button>
          </div>
        ) : view === "choice" ? (
          /* ELECCIÓN INICIAL: DOS BOTONES CLAROS */
          <div className="flex flex-col gap-2.5">
            <button onClick={() => setView("login")} style={{ background: C.teal, color: C.bg }} className="w-full text-[13px] font-semibold py-3 rounded-xl">
              Iniciar sesión
            </button>
            <button onClick={() => setView("signup")} style={{ background: "transparent", color: C.teal, border: `1px solid ${C.teal}` }} className="w-full text-[13px] font-semibold py-3 rounded-xl">
              Crear cuenta
            </button>
            <button onClick={auth.signInWithGoogle} disabled={auth.loading} style={{ background: C.bgSoft, color: C.text, border: `1px solid ${C.border}` }} className="w-full text-[12px] font-medium py-3 rounded-xl flex items-center justify-center gap-2">
              <svg width="15" height="15" viewBox="0 0 48 48"><path fill="#FFC107" d="M43.6 20.5H42V20H24v8h11.3C33.7 32.9 29.3 36 24 36c-6.6 0-12-5.4-12-12s5.4-12 12-12c3.1 0 5.9 1.2 8 3.1l5.7-5.7C34.3 6.1 29.4 4 24 4 12.9 4 4 12.9 4 24s8.9 20 20 20 20-8.9 20-20c0-1.3-.1-2.3-.4-3.5z"/><path fill="#FF3D00" d="M6.3 14.7l6.6 4.8C14.7 15.1 19 12 24 12c3.1 0 5.9 1.2 8 3.1l5.7-5.7C34.3 6.1 29.4 4 24 4 16.3 4 9.7 8.3 6.3 14.7z"/><path fill="#4CAF50" d="M24 44c5.2 0 9.9-2 13.4-5.2l-6.2-5.2C29.2 35 26.7 36 24 36c-5.3 0-9.7-3.1-11.3-7.5l-6.5 5C9.5 39.6 16.2 44 24 44z"/><path fill="#1976D2" d="M43.6 20.5H42V20H24v8h11.3c-.8 2.3-2.3 4.2-4.2 5.6l6.2 5.2C40.9 36.3 44 30.7 44 24c0-1.3-.1-2.3-.4-3.5z"/></svg>
              Continuar con Google
            </button>
            <span style={{ color: C.textFaint }} className="text-[10.5px] text-center mt-1">
              {auth.isReal ? "Cuenta real vía Supabase (datos en la nube)." : "Modo demo local; configura VITE_SUPABASE_URL/ANON_KEY para auth real."}
            </span>
          </div>
        ) : view === "login" ? (
          /* LOGIN */
          <form onSubmit={doSignIn} className="flex flex-col gap-2.5">
            <input type="email" required placeholder="tu@correo.com" value={email}
              onChange={(e) => setEmail(e.target.value)} style={{ background: C.bgSoft, border: `1px solid ${C.borderSoft}`, color: C.text }}
              className="text-xs rounded-lg px-3 py-2.5 outline-none" />
            <input type="password" required placeholder="Contraseña" value={pass}
              onChange={(e) => setPass(e.target.value)} style={{ background: C.bgSoft, border: `1px solid ${C.borderSoft}`, color: C.text }}
              className="text-xs rounded-lg px-3 py-2.5 outline-none" />
            <button type="submit" disabled={auth.loading} style={{ background: C.teal, color: C.bg, opacity: auth.loading ? 0.6 : 1 }} className="text-[13px] font-semibold py-3 rounded-xl">
              {auth.loading ? "Procesando…" : "Entrar"}
            </button>
            <button type="button" onClick={doReset} style={{ color: C.textFaint }} className="text-[11px]">¿Olvidaste tu contraseña?</button>
            <button type="button" onClick={() => setView("choice")} style={{ color: C.textFaint }} className="text-[11px]">← Volver</button>
          </form>
        ) : (
          /* SIGNUP */
          <form onSubmit={doSignUp} className="flex flex-col gap-2.5">
            <input type="email" required placeholder="tu@correo.com" value={email}
              onChange={(e) => setEmail(e.target.value)} style={{ background: C.bgSoft, border: `1px solid ${C.borderSoft}`, color: C.text }}
              className="text-xs rounded-lg px-3 py-2.5 outline-none" />
            <input type="password" required minLength={6} placeholder="Contraseña (mín 6)" value={pass}
              onChange={(e) => setPass(e.target.value)} style={{ background: C.bgSoft, border: `1px solid ${C.borderSoft}`, color: C.text }}
              className="text-xs rounded-lg px-3 py-2.5 outline-none" />
            <button type="submit" disabled={auth.loading} style={{ background: C.teal, color: C.bg, opacity: auth.loading ? 0.6 : 1 }} className="text-[13px] font-semibold py-3 rounded-xl">
              {auth.loading ? "Procesando…" : "Crear cuenta"}
            </button>
            <button type="button" onClick={() => setView("choice")} style={{ color: C.textFaint }} className="text-[11px]">← Volver</button>
          </form>
        )}

        {/* ERRORES / INFO */}
        {auth.error && (
          <div style={{ background: `${C.rose}12`, border: `1px solid ${C.rose}33` }} className="rounded-lg px-3 py-2 mt-3">
            <span style={{ color: C.rose }} className="text-[11px]">{auth.error}</span>
          </div>
        )}
        {auth.info && (
          <div style={{ background: `${C.teal}12`, border: `1px solid ${C.teal}33` }} className="rounded-lg px-3 py-2 mt-3">
            <span style={{ color: C.teal }} className="text-[11px]">{auth.info}</span>
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
          Conecta tu wearable o sube un CSV. Las API keys se guardan solo en este dispositivo (localStorage). En producción, el backend (Vercel Function) guarda el token y consulta la API de forma segura.
        </p>
        <div className="flex gap-2">
          <button onClick={() => { setActiveTab("wearable"); setShowModal(true); }} style={{ background: C.teal, color: C.bg, border: `1px solid ${C.teal}` }} className="flex-1 text-xs font-semibold py-2.5 rounded-xl flex items-center justify-center gap-1.5">
            <Link2 size={13} /> Wearable
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
