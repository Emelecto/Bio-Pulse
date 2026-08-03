// ============================================================
// BioPulse — App shell (mobile-first, 5 tabs)
// Tabs: Técnico | Live | Dashboard | Sueño | Config
// Orden de barra inferior: Tecnico | Live | Inicio | Sueno | Ajustes
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

// AppInner vive DENTRO del ThemeProvider: asi useTheme() lee el contexto real
// y re-renderiza toda la app (y todos los tabs) al cambiar el tema, haciendo
// que el toggle claro/oscuro se vea de inmediato (sin salir de Config).
function AppInner() {
  const { theme } = useTheme(); // consume contexto REAL -> re-render global al cambiar tema
  const hook = useBiopulseData();
  const {
    customData, demoData, customSourceLabel, historyRange, setHistoryRange,
    riskThreshold, setRiskThreshold, clearAllData, showModal, setShowModal,
    activeTab, setActiveTab, connections, setConnections, syncStatus, setSyncStatus,
    handleCsvFile, csvHeaders, csvMapping, setCsvMapping, csvError, csvFileName,
    csvRowCount, confirmCsv, clearCustom, FIELD_DEFS,
  } = hook;

  const data = customData || demoData;
  const today = data[data.length - 1];
  const [tab, setTab] = useState("dash");

  const sourcePillLabel = customSourceLabel ? customSourceLabel : "Datos demo";

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
            className="w-10 h-10 rounded-full flex items-center justify-center active:scale-95 transition-transform" aria-label="Fuente de datos">
            <Settings2 size={14} />
          </button>
        </div>

        {/* TAB CONTENT */}
        {tab === "dash" && <Dashboard data={data} today={today} riskThreshold={riskThreshold} onOpenSettings={() => setTab("config")} />}
        {tab === "live" && <Live today={today} />}
        {tab === "sleep" && <Sleep data={data} />}
        {tab === "config" && <Config data={data} hook={hook} onUseDemo={() => setShowModal(true)} />}
        {tab === "tech" && <Technical />}
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
    </div>
  );
}

export default function App() {
  return (
    <ThemeProvider>
      <AppInner />
    </ThemeProvider>
  );
}
