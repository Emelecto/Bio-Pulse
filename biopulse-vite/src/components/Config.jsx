// ============================================================
// TAB CONFIG — login (mock), conexión de API keys, CSV, demo,
// y organización de la app.
// ============================================================
import React, { useState } from "react";
import { User, Key, Upload, Database, Trash2, RefreshCw, Check, AlertTriangle, Link2 } from "lucide-react";
import { C } from "./ui.jsx";

export default function Config({ data, hook }) {
  const {
    customSourceLabel, showModal, setShowModal, activeTab, setActiveTab,
    connections, setConnections, syncStatus, setSyncStatus,
    handleCsvFile, csvHeaders, csvMapping, setCsvMapping, csvError, csvFileName, csvRowCount,
    confirmCsv, onUseDemo, clearCustom, riskThreshold, setRiskThreshold, clearAllData,
  } = hook;

  const [user, setUser] = useState(null);
  const [email, setEmail] = useState("");
  const [pass, setPass] = useState("");

  const login = (e) => { e.preventDefault(); setUser({ email, name: email.split("@")[0] }); };
  const logout = () => { setUser(null); setEmail(""); setPass(""); };

  return (
    <div className="flex flex-col gap-5">
      {/* LOGIN */}
      <div style={{ background: C.card, border: `1px solid ${C.border}` }} className="rounded-3xl p-4">
        <div className="flex items-center gap-2 mb-3">
          <User size={16} style={{ color: C.teal }} />
          <span style={{ color: C.text }} className="text-sm font-semibold">Cuenta</span>
        </div>
        {user ? (
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div style={{ background: C.teal }} className="w-9 h-9 rounded-full flex items-center justify-center text-[13px] font-bold" >
                <span style={{ color: C.bg }}>{user.name[0]?.toUpperCase()}</span>
              </div>
              <div>
                <span style={{ color: C.text }} className="text-[13px] font-medium block">{user.name}</span>
                <span style={{ color: C.textFaint }} className="text-[11px]">{user.email}</span>
              </div>
            </div>
            <button onClick={logout} style={{ color: C.rose }} className="text-[12px]">Cerrar sesión</button>
          </div>
        ) : (
          <form onSubmit={login} className="flex flex-col gap-2">
            <input type="email" required placeholder="tu@correo.com" value={email}
              onChange={(e) => setEmail(e.target.value)} style={{ background: C.bgSoft, border: `1px solid ${C.borderSoft}`, color: C.text }}
              className="text-xs rounded-lg px-3 py-2.5 outline-none" />
            <input type="password" required placeholder="Contraseña" value={pass}
              onChange={(e) => setPass(e.target.value)} style={{ background: C.bgSoft, border: `1px solid ${C.borderSoft}`, color: C.text }}
              className="text-xs rounded-lg px-3 py-2.5 outline-none" />
            <button type="submit" style={{ background: C.teal, color: C.bg }} className="text-xs font-semibold py-2.5 rounded-xl">Iniciar sesión (demo)</button>
            <span style={{ color: C.textFaint }} className="text-[10.5px]">Cuenta local simulada; no se envía a ningún servidor.</span>
          </form>
        )}
      </div>

      {/* API KEYS / WEARABLE */}
      <div style={{ background: C.card, border: `1px solid ${C.border}` }} className="rounded-3xl p-4">
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
          <div className="mt-3 flex items-center justify-between" style={{ background: C.bgSoft, border: `1px solid ${C.borderSoft}` }} className="rounded-xl px-3 py-2">
            <span style={{ color: C.textFaint }} className="text-[11px]">Fuente: <span style={{ color: C.text }}>{customSourceLabel}</span></span>
            <button onClick={clearCustom} style={{ color: C.rose }} className="text-[11px] flex items-center gap-1"><Trash2 size={11} /> Quitar</button>
          </div>
        )}
      </div>

      {/* UMBRAL DE RIESGO */}
      <div style={{ background: C.card, border: `1px solid ${C.border}` }} className="rounded-3xl p-4">
        <div className="flex items-center justify-between mb-2">
          <span style={{ color: C.text }} className="text-sm font-semibold">Umbral de alerta</span>
          <span style={{ color: C.teal, fontFamily: "'IBM Plex Mono', monospace" }} className="text-sm">{riskThreshold}</span>
        </div>
        <input type="range" min="10" max="80" value={riskThreshold} onChange={(e) => setRiskThreshold(Number(e.target.value))}
          className="w-full accent-[#4FD8C4]" />
        <p style={{ color: C.textFaint }} className="text-[11px] mt-1">El coach marca alerta cuando el índice supera este valor.</p>
      </div>

      {/* ORGANIZACIÓN */}
      <div style={{ background: C.card, border: `1px solid ${C.border}` }} className="rounded-3xl p-4">
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
