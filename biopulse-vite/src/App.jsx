// ============================================================
// BioPulse — App shell (mobile-first, 5 tabs)
// Tabs: Técnico | Live | Dashboard | Sueño | Config
// Orden de barra inferior: Tecnico | Live | Inicio | Sueno | Ajustes
//
// El estado de tab ahora vive en <CoachProvider> (A2) para que el
// chat del coach persista entre pestañas. <Coach/> (FAB + sheet)
// se monta UNA SOLA VEZ, fuera del contenido de tabs.
// ============================================================
import React, { useState } from "react";
import { Activity, ChevronRight, FileText, Database, Settings2 } from "lucide-react";
import { C, GLOBAL_STYLE } from "./components/ui.jsx";
import { ThemeProvider, useTheme } from "./lib/theme.jsx";
import { useBiopulseData } from "./hooks/useBiopulseData.js";
import TabBar from "./components/TabBar.jsx";
import DataSourceModal from "./components/DataSourceModal.jsx";
import Dashboard from "./components/Dashboard.jsx";
import Live from "./components/Live.jsx";
import Sleep from "./components/Sleep.jsx";
import Config from "./components/Config.jsx";
import Technical from "./components/Technical.jsx";
import BreathSession from "./components/BreathSession.jsx";
import Onboarding from "./components/Onboarding.jsx";
import Coach from "./components/Coach.jsx";
import { CoachProvider, useCoach } from "./coach/CoachContext.jsx";

// AppInner vive DENTRO del ThemeProvider: asi useTheme() lee el contexto real
// y re-renderiza toda la app (y todos los tabs) al cambiar el tema, haciendo
// que el toggle claro/oscuro se vea de inmediato (sin salir de Config).
function AppInner({ hook }) {
  const { theme, forceVersion } = useTheme();
  void forceVersion;
  const { tab, setTab } = useCoach();
  const [breathOpen, setBreathOpen] = useState(false);
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

  // Onboarding: primera vez, sin perfil -> mostramos el flujo de 30s encima de todo.
  if (!hook.profile) {
    return <Onboarding onComplete={hook.setProfile} />;
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
            <Settings2 size={14} />
          </button>
        </div>

        {/* TAB CONTENT */}
        {tab === "dash" && <Dashboard data={data} today={today} riskThreshold={riskThreshold} onOpenSettings={() => setTab("config")} onBreathe={() => setBreathOpen(true)} />}
        {tab === "live" && <Live today={today} />}
        {tab === "sleep" && <Sleep data={data} onBreathe={() => setBreathOpen(true)} />}
        {tab === "config" && <Config data={data} hook={hook} onUseDemo={() => setShowModal(true)} />}
        {tab === "tech" && <Technical data={data} />}
      </div>

      <TabBar active={tab} onChange={setTab} />

      {showModal && (
        <DataSourceModal
          onClose={() => setShowModal(false)} activeTab={activeTab} setActiveTab={setActiveTab}
          connections={connections} setConnections={setConnections} syncStatus={syncStatus} setSyncStatus={setSyncStatus}
          onCsvFile={handleCsvFile} csvHeaders={csvHeaders} csvMapping={setCsvMapping} csvError={csvError} csvFileName={csvFileName} csvRowCount={csvRowCount}
          onConfirmCsv={confirmCsv} onUseDemo={() => { setShowModal(false); }} onClearCustom={clearCustom}
          customSourceLabel={customSourceLabel} riskThreshold={riskThreshold} setRiskThreshold={setRiskThreshold}
          clearAllData={clearAllData} FIELD_DEFS={FIELD_DEFS}
        />
      )}

      {/* COACH: FAB + bottom-sheet, montado UNA SOLA VEZ (no se desmonta al cambiar tab). */}
      <Coach />

      {/* RESPIRACION GUIADA: overlay global, se abre desde cualquier tab. */}
      <BreathSession open={breathOpen} onClose={() => setBreathOpen(false)} today={today} />
    </div>
  );
}

// Root llama al hook UNA vez y envuelve todo en CoachProvider (A2).
function Root() {
  const hook = useBiopulseData();
  const data = hook.customData || hook.demoData;
  const today = data[data.length - 1];
  return (
    <CoachProvider today={today}>
      <AppInner hook={hook} />
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
