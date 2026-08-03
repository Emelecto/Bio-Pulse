// ============================================================
// DataSourceModal — seleccion de fuente (Wearable / CSV / Demo).
// Reutiliza FIELD_DEFS y el estado del hook useBiopulseData.
// ============================================================
import React from "react";
import {
  Link2, Upload, Database, X, Check, Loader2, RefreshCw, AlertTriangle, Info, FileText,
} from "lucide-react";
import { C } from "./ui.jsx";

export default function DataSourceModal({
  onClose, activeTab, setActiveTab,
  connections, setConnections, syncStatus, setSyncStatus,
  onCsvFile, csvHeaders, csvMapping, setCsvMapping, csvError, csvFileName, csvRowCount,
  onConfirmCsv, onUseDemo, onClearCustom, customSourceLabel,
  riskThreshold, setRiskThreshold, clearAllData, FIELD_DEFS,
}) {
  const tabs = [
    { id: "wearable", label: "Wearable", icon: Link2 },
    { id: "csv", label: "Subir CSV", icon: Upload },
    { id: "demo", label: "Demo", icon: Database },
  ];

  async function testConnection(provider) {
    const token = connections[provider].token;
    if (!token) return;
    setSyncStatus((s) => ({ ...s, [provider]: "loading" }));
    const testUrl = provider === "fitbit"
      ? "https://api.fitbit.com/1/user/-/profile.json"
      : "https://api.prod.whoop.com/developer/v1/cycle";
    try {
      const res = await fetch(testUrl, { headers: { Authorization: `Bearer ${token}` } });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      await res.json();
      setSyncStatus((s) => ({ ...s, [provider]: { ok: true } }));
      setConnections((c) => ({ ...c, [provider]: { ...c[provider], lastSync: new Date().toISOString() } }));
    } catch (err) {
      setSyncStatus((s) => ({ ...s, [provider]: { ok: false, error: err.message || "Error de red" } }));
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center">
      <div onClick={onClose} style={{ background: "rgba(5,10,16,0.7)" }} className="absolute inset-0" />
      <div style={{ background: C.bg, border: `1px solid ${C.border}` }} className="relative w-full sm:max-w-lg max-h-[88vh] overflow-y-auto rounded-t-3xl sm:rounded-3xl">
        <div style={{ background: C.bg, borderBottom: `1px solid ${C.borderSoft}` }} className="sticky top-0 z-10 flex items-center justify-between px-5 py-4">
          <span style={{ color: C.text, fontFamily: "'Space Grotesk', sans-serif" }} className="text-base font-semibold">Fuente de datos</span>
          <button onClick={onClose} style={{ color: C.textMuted }} aria-label="Cerrar"><X size={18} /></button>
        </div>

        <div className="flex gap-1 px-5 pt-4">
          {tabs.map((t) => (
            <button key={t.id} onClick={() => setActiveTab(t.id)}
              style={{ background: activeTab === t.id ? C.card : "transparent", border: `1px solid ${activeTab === t.id ? C.border : "transparent"}`, color: activeTab === t.id ? C.text : C.textFaint }}
              className="flex-1 flex items-center justify-center gap-1.5 text-xs font-medium py-2 rounded-xl">
              <t.icon size={13} /> {t.label}
            </button>
          ))}
        </div>

        <div className="p-5">
          {activeTab === "wearable" && (
            <div className="flex flex-col gap-4">
              <p style={{ color: C.textFaint }} className="text-[12px] leading-relaxed">
                Conecta tu cuenta para trackeo en vivo. Pega un access token (obtenido vía el flujo OAuth del proveedor) — BioPulse no gestiona el login por ti.
              </p>
              {["fitbit", "whoop"].map((provider) => {
                const conn = connections[provider];
                const status = syncStatus[provider];
                const displayName = provider === "fitbit" ? "Fitbit" : "Whoop";
                return (
                  <div key={provider} style={{ background: C.card, border: `1px solid ${C.border}` }} className="glass rounded-2xl p-4">
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-2">
                        <span style={{ color: C.text, fontFamily: "'Space Grotesk', sans-serif" }} className="text-sm font-semibold">{displayName}</span>
                        <span style={{ color: conn.connected ? C.teal : C.textFaint, background: conn.connected ? `${C.teal}1A` : "transparent", border: `1px solid ${conn.connected ? C.teal + "44" : C.borderSoft}` }}
                          className="text-[10px] px-2 py-0.5 rounded-full font-medium">
                          {conn.connected ? "Conectado" : "No conectado"}
                        </span>
                      </div>
                    </div>
                    <input type="password" placeholder="Access token" value={conn.token}
                      onChange={(e) => setConnections((c) => ({ ...c, [provider]: { ...c[provider], token: e.target.value } }))}
                      style={{ background: C.bgSoft, border: `1px solid ${C.borderSoft}`, color: C.text }}
                      className="w-full text-xs rounded-lg px-3 py-2.5 mb-2 outline-none" />
                    <div className="flex gap-2">
                      <button onClick={() => setConnections((c) => ({ ...c, [provider]: { ...c[provider], connected: !!c[provider].token } }))}
                        disabled={!conn.token} style={{ background: conn.token ? C.teal : C.borderSoft, color: conn.token ? C.bg : C.textFaint }}
                        className="flex-1 text-xs font-semibold py-2 rounded-lg disabled:cursor-not-allowed">
                        {conn.connected ? "Actualizar" : "Conectar"}
                      </button>
                      <button onClick={() => testConnection(provider)} disabled={!conn.connected || status === "loading"}
                        title="Requiere un backend para validar el token en producción; desde el navegador fallará por CORS/OAuth."
                        style={{ background: "transparent", border: `1px solid ${C.border}`, color: C.textMuted }}
                        className="flex-1 text-xs font-medium py-2 rounded-lg flex items-center justify-center gap-1.5 disabled:opacity-40">
                        {status === "loading" ? <Loader2 size={13} className="animate-spin" /> : <RefreshCw size={13} />} Sincronizar
                      </button>
                    </div>
                    {status && status !== "loading" && (
                      <div style={{ background: status.ok ? `${C.teal}14` : `${C.rose}14`, border: `1px solid ${status.ok ? C.teal + "33" : C.rose + "33"}` }}
                        className="mt-2.5 rounded-lg p-2.5 flex gap-2 items-start">
                        {status.ok ? <Check size={13} style={{ color: C.teal }} className="mt-0.5 shrink-0" /> : <AlertTriangle size={13} style={{ color: C.rose }} className="mt-0.5 shrink-0" />}
                        <span style={{ color: status.ok ? C.teal : C.rose }} className="text-[11px] leading-snug">
                          {status.ok ? "Conexión verificada." : `No se pudo sincronizar desde el navegador (${status.error}). La API de ${displayName} requiere un backend intermediario.`}
                        </span>
                      </div>
                    )}
                  </div>
                );
              })}
              <div style={{ background: C.bgSoft, border: `1px solid ${C.borderSoft}` }} className="rounded-xl p-3.5">
                <div className="flex items-center gap-1.5 mb-1.5">
                  <Info size={12} style={{ color: C.textMuted }} />
                  <span style={{ color: C.textMuted }} className="text-[11px] font-semibold">Por qué falla la sincronización directa</span>
                </div>
                <p style={{ color: C.textFaint }} className="text-[11px] leading-relaxed">
                  Fitbit y Whoop no permiten llamadas CORS desde un navegador sin servidor propio, y su OAuth requiere un client secret que nunca debe vivir en el frontend. En producción, este botón llamaría a tu backend, que guarda el token y consulta la API.
                </p>
              </div>
            </div>
          )}

          {activeTab === "csv" && (
            <div className="flex flex-col gap-4">
              <p style={{ color: C.textFaint }} className="text-[12px] leading-relaxed">
                Sube un CSV exportado de tu wearable. Detectamos las columnas automáticamente; puedes corregirlas abajo.
              </p>
              <label style={{ background: C.card, border: `1.5px dashed ${C.border}` }} className="glass rounded-2xl p-6 flex flex-col items-center gap-2 cursor-pointer">
                <Upload size={20} style={{ color: C.teal }} />
                <span style={{ color: C.text }} className="text-xs font-medium">{csvFileName ? csvFileName : "Toca para elegir un archivo .csv"}</span>
                {csvRowCount > 0 && <span style={{ color: C.textFaint }} className="text-[11px]">{csvRowCount} filas detectadas</span>}
                <input type="file" accept=".csv" className="hidden" onChange={onCsvFile} />
              </label>
              {csvError && <div style={{ background: `${C.rose}14`, border: `1px solid ${C.rose}33`, color: C.rose }} className="rounded-lg p-2.5 text-[11px]">{csvError}</div>}
              {csvHeaders.length > 0 && (
                <div className="flex flex-col gap-2">
                  <span style={{ color: C.textFaint }} className="text-[11px] uppercase tracking-wider font-medium">Mapeo de columnas</span>
                  {FIELD_DEFS.map((f) => (
                    <div key={f.key} className="flex items-center gap-2">
                      <span style={{ color: f.required ? C.text : C.textMuted }} className="text-[11px] w-32 shrink-0">{f.label}{f.required && <span style={{ color: C.rose }}> *</span>}</span>
                      <select value={csvMapping[f.key] || ""} onChange={(e) => setCsvMapping((m) => ({ ...m, [f.key]: e.target.value }))}
                        style={{ background: C.bgSoft, border: `1px solid ${C.borderSoft}`, color: C.text }}
                        className="flex-1 text-[11px] rounded-lg px-2 py-1.5 outline-none min-w-0">
                        <option value="">— sin usar / valor neutro —</option>
                        {csvHeaders.map((h) => (<option key={h} value={h}>{h}</option>))}
                      </select>
                    </div>
                  ))}
                  <button onClick={onConfirmCsv} disabled={!csvMapping.hrv || !csvMapping.rhr}
                    style={{ background: csvMapping.hrv && csvMapping.rhr ? C.teal : C.borderSoft, color: csvMapping.hrv && csvMapping.rhr ? C.bg : C.textFaint }}
                    className="mt-2 text-xs font-semibold py-2.5 rounded-xl disabled:cursor-not-allowed">Analizar estos datos</button>
                  <p style={{ color: C.textFaint }} className="text-[10.5px]">* HRV y RHR son obligatorios. Los demás campos usan un valor neutro si no se mapean.</p>
                </div>
              )}
            </div>
          )}

          {activeTab === "demo" && (
            <div className="flex flex-col gap-3">
              <p style={{ color: C.textFaint }} className="text-[12px] leading-relaxed">
                Datos sintéticos (44 días) con una narrativa de deterioro gradual seguido de dos eventos agudos, pensados para mostrar cómo se comporta el pipeline. Útiles para explorar la app sin conectar nada.
              </p>
              <button onClick={onUseDemo} style={{ background: C.teal, color: C.bg }} className="text-xs font-semibold py-2.5 rounded-xl">Usar datos demo</button>
            </div>
          )}

          {customSourceLabel && (
            <div className="mt-5 flex items-center justify-between">
              <span style={{ color: C.textFaint }} className="text-[11px]">Fuente activa: <span style={{ color: C.text }}>{customSourceLabel}</span></span>
              <button onClick={onClearCustom} style={{ color: C.rose }} className="text-[11px] flex items-center gap-1"><FileText size={11} /> Quitar</button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
