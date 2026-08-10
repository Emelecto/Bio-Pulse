// ============================================================
// BioPulse — App shell (mobile-first, 5 tabs)
// Tabs: Live | Datos | Inicio | Sueño | Ajustes (Inicio al centro)
// Técnico = pantalla completa abierta desde Inicio.
//
// El estado de tab vive en <CoachProvider> (A2) para que el chat del
// coach persista entre pestañas. <Coach/> se monta UNA SOLA VEZ.
// ============================================================
import React, { useState } from "react";
import { Activity, ChevronRight, FileText, Database, Plus } from "lucide-react";
import { C, GLOBAL_STYLE } from "./components/ui.jsx";
import { ThemeProvider, useTheme } from "./lib/theme.jsx";
import { useBiopulseData } from "./hooks/useBiopulseData.js";
import { useLogs } from "./hooks/useLogs.js";
import TabBar from "./components/TabBar.jsx";
import DataSourceModal from "./components/DataSourceModal.jsx";
import Inicio from "./components/Inicio.jsx";
import Live from "./components/Live.jsx";
import Sleep from "./components/Sleep.jsx";
import Config from "./components/Config.jsx";
import Technical from "./components/Technical.jsx";
import Datos from "./components/Datos.jsx";
import BreathSession from "./components/BreathSession.jsx";
import Onboarding from "./components/Onboarding.jsx";
import Coach from "./components/Coach.jsx";
import { useAuth } from "./hooks/useAuth.js";
import { CoachProvider, useCoach } from "./coach/CoachContext.jsx";
import { SAFETY_FLAGS } from "./lib/logPresets.js";

function AppInner({ hook, auth, userProfile }) {
  const { theme, forceVersion } = useTheme();
  void forceVersion;
  const { tab, setTab } = useCoach();
  const [breathOpen, setBreathOpen] = useState(false);
  const [techOpen, setTechOpen] = useState(false);
  const logs = useLogs();
  const {
    customData, demoData, customSourceLabel, historyRange, setHistoryRange,
    riskThreshold, setRiskThreshold, clearAllData, showModal, setShowModal,
    activeTab, setActiveTab, connections, setConnections, syncStatus, setSyncStatus,
    handleCsvFile, csvHeaders, csvMapping, setCsvMapping, csvError, csvFileName,
    csvRowCount, confirmCsv, clearCustom, FIELD_DEFS,
  } = hook;

  const data = customData || demoData;
  const today = data[data.length - 1];
  const sourcePillLabel = customSourceLabel ? customSourceLabel : "Datos demo";

  // Bandera de seguridad activa hoy (badge en Datos)
  const todayKey = new Date().toISOString().slice(0, 10);
  const hasSafetyFlag = logs.logs.some(
    (l) => new Date(l.ts).toISOString().slice(0, 10) === todayKey &&
      SAFETY_FLAGS.some((f) => f.when.includes(l.preset))
  ) && new Set(logs.logs.filter((l)=>new Date(l.ts).toISOString().slice(0,10)===todayKey).map(l=>l.preset)).size >= 2;

  // Onboarding: solo si NO hay sesión válida ni se eligió demo.
  if (!auth.token && !auth.skipped) {
    return <Onboarding auth={auth} onDemo={auth.skip} />;
  }

  return (
    <div style={{ background: C.bg, minHeight: "100vh", fontFamily: "'Manrope', sans-serif" }}>
      <style>{GLOBAL_STYLE}</style>

      <div className="max-w-md mx-auto px-4 pb-24 pt-6">
        {/* HEADER */}
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <div style={{ background: C.teal }} className="w-7 h-7 rounded-lg flex items-center justify-center">
              <Activity size={16} color={C.bg} strokeWidth={2.5} />
            </div>
            <span style={{ color: C.text, fontFamily: "'Space Grotesk', sans-serif" }} className="text-lg font-bold tracking-tight">BioPulse</span>
          </div>
          <button onClick={() => setShowModal(true)}
            style={{ background: C.card, border: `1px solid ${C.border}`, color: C.textMuted }}
            className="glass w-10 h-10 rounded-full flex items-center justify-center active:scale-95 transition-transform" aria-label="Fuente de datos">
            <FileText size={14} />
          </button>
        </div>

        {/* TAB CONTENT */}
        {tab === "inicio" && <Inicio data={data} today={today} riskThreshold={riskThreshold} userProfile={userProfile} logs={logs} onOpenTech={() => setTechOpen(true)} onOpenDatos={() => setTab("datos")} onBreathe={() => setBreathOpen(true)} />}
        {tab === "live" && <Live today={today} />}
        {tab === "datos" && <Datos logs={logs} data={data} C={C} onOpenTech={() => setTechOpen(true)} onBreathe={() => setBreathOpen(true)} />}
        {tab === "sleep" && <Sleep data={data} onBreathe={() => setBreathOpen(true)} />}
        {tab === "config" && <Config data={data} hook={hook} auth={auth} logs={logs} onExportData={() => exportData(data, logs.logs)} onExportMedical={() => exportMedicalReport(data, logs.logs)} />}
      </div>

      <TabBar active={tab} onChange={setTab} safetyFlag={hasSafetyFlag} />

      {/* Pantalla Técnico (completa, desde Inicio) */}
      {techOpen && (
        <div className="fixed inset-0 z-50 overflow-y-auto" style={{ background: C.bg }}>
          <div className="max-w-md mx-auto px-4 py-6">
            <div className="flex items-center justify-between mb-3">
              <h2 style={{ color: C.text }} className="text-xl font-bold">Análisis técnico</h2>
              <button onClick={() => setTechOpen(false)} style={{ background: C.card, border: `1px solid ${C.border}`, color: C.textMuted }} className="w-9 h-9 rounded-full">✕</button>
            </div>
            <Technical data={data} />
          </div>
        </div>
      )}

      {showModal && (
        <DataSourceModal
          onClose={() => setShowModal(false)} activeTab={activeTab} setActiveTab={setActiveTab}
          connections={connections} setConnections={setConnections} syncStatus={syncStatus} setSyncStatus={setSyncStatus}
          onCsvFile={handleCsvFile} csvHeaders={csvHeaders} csvMapping={csvMapping} setCsvMapping={setCsvMapping} csvError={csvError} csvFileName={csvFileName} csvRowCount={csvRowCount}
          onConfirmCsv={confirmCsv} onUseDemo={() => { setShowModal(false); }} onClearCustom={clearCustom}
          customSourceLabel={customSourceLabel} riskThreshold={riskThreshold} setRiskThreshold={setRiskThreshold}
          clearAllData={clearAllData} FIELD_DEFS={FIELD_DEFS}
        />
      )}

      {/* COACH: FAB + bottom-sheet, montado UNA SOLA VEZ */}
      <Coach />

      {/* RESPIRACION GUIADA */}
      <BreathSession open={breathOpen} onClose={() => setBreathOpen(false)} today={today} />
    </div>
  );
}

// Exporta métricas + logs a un JSON descargable (dataset para ML / respaldo).
function exportData(data, logs) {
  try {
    const payload = { exportedAt: new Date().toISOString(), metrics: data, logs };
    const blob = new Blob([JSON.stringify(payload, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url; a.download = "biopulse-datos.json"; a.click();
    URL.revokeObjectURL(url);
  } catch (e) { /* noop */ }
}

// Punto 6: informe legible para médico (CSV humano, no JSON de ML).
function exportMedicalReport(data, logs) {
  try {
    const byDate = {};
    for (const l of logs || []) {
      const d = (l.ts || "").slice(0, 10);
      (byDate[d] = byDate[d] || []).push(l);
    }
    const header = ["fecha", "hrv", "rhr", "bioScore", "sleepScore", "riskScore", "recuperacion", "habitos_registrados"];
    const rows = (data || []).map((d) => {
      const dk = String(d.date).slice(0, 10);
      const hs = (byDate[dk] || []).map((l) => `${l.label || l.preset}${l.amount ? " (" + l.amount + (l.unit || "") + ")" : ""}`).join("; ");
      return [dk, d.hrv, d.rhr, d.bioScore, d.sleepScore, d.riskScore, d.recovery, hs];
    });
    const csv = [header, ...rows]
      .map((r) => r.map((c) => `"${String(c ?? "").replace(/"/g, '""')}"`).join(","))
      .join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url; a.download = "biopulse-informe-medico.csv"; a.click();
    URL.revokeObjectURL(url);
  } catch (e) { /* noop */ }
}

// Root llama al hook UNA vez y envuelve todo en CoachProvider.
function Root() {
  const hook = useBiopulseData();
  const auth = useAuth();
  const logs = useLogs();
  if (auth.status === "loading") {
    return <div style={{ background: C.bg, minHeight: "100vh" }} />;
  }
  const userProfile = auth.profile || null;
  const data = hook.customData || hook.demoData;
  const today = data[data.length - 1];
  return (
    <CoachProvider today={today} userProfile={userProfile} logs={logs.logs}>
      <AppInner hook={hook} auth={auth} userProfile={userProfile} />
    </CoachProvider>
  );
}

export default function App() {
  return (
    <ThemeProvider>
      <Root />
    </ThemeProvider>
  );
}
