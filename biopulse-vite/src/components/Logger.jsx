// ============================================================
// Logger.jsx — Registro de hábitos/sustancias + Banderas de seguridad.
// Presets (45) + personalizado. Lista por día. Acotado a móvil.
// ============================================================
import { useMemo, useState } from "react";
import { LOG_PRESETS, LOG_CATEGORIES, SAFETY_FLAGS, LOG_PRESET_BY_ID } from "../lib/logPresets.js";
import { logsByDay } from "../lib/bioUtils.js";

function pad(n) { return String(n).padStart(2, "0"); }
function fmtDate(d) { const x = new Date(d); return `${pad(x.getDate())}/${pad(x.getMonth() + 1)} ${pad(x.getHours())}:${pad(x.getMinutes())}`; }

export default function Logger({ logs, addLog, removeLog, C }) {
  const [cat, setCat] = useState("all");
  const [sel, setSel] = useState(null);
  const [amount, setAmount] = useState(1);
  const [note, setNote] = useState("");
  const [customLabel, setCustomLabel] = useState("");

  const filtered = useMemo(
    () => (cat === "all" ? LOG_PRESETS : LOG_PRESETS.filter((p) => p.category === cat)),
    [cat]
  );

  // Banderas de seguridad: combos de hoy
  const todayKey = new Date().toISOString().slice(0, 10);
  const todayPresets = useMemo(() => {
    const set = new Set();
    for (const l of logs) if (new Date(l.ts).toISOString().slice(0, 10) === todayKey) set.add(l.preset);
    return set;
  }, [logs, todayKey]);

  const flags = useMemo(
    () => SAFETY_FLAGS.filter((f) => f.when.every((p) => todayPresets.has(p))),
    [todayPresets]
  );

  const submit = async () => {
    if (!sel) return;
    const preset = sel === "custom"
      ? { id: "custom", label: customLabel || "Personalizado", category: "otro", unit: "" }
      : LOG_PRESET_BY_ID[sel];
    await addLog({
      preset: preset.id,
      label: preset.label,
      category: preset.category,
      unit: preset.unit,
      amount: +amount || 1,
      note: note.trim(),
      ts: new Date().toISOString(),
    });
    setSel(null); setAmount(1); setNote(""); setCustomLabel("");
  };

  const days = useMemo(() => {
    const m = logsByDay(logs);
    return Object.keys(m).sort().reverse();
  }, [logs]);

  return (
    <div style={{ padding: "14px 12px 24px", color: C.text, fontSize: 14 }}>
      <h2 style={{ fontSize: 18, fontWeight: 700, margin: "2px 0 2px" }}>Registro</h2>
      <p style={{ color: C.textMuted, fontSize: 12, margin: "0 0 10px" }}>
        Anota hábitos y sustancias para ver cómo cambian tus scores.
      </p>

      {/* Banderas de seguridad */}
      {flags.length > 0 && (
        <div style={{ marginBottom: 12 }}>
          {flags.map((f) => (
            <div key={f.id} style={{
              background: f.level === "danger" ? "rgba(239,68,68,.15)" : f.level === "warn" ? "rgba(245,158,11,.15)" : "rgba(56,189,248,.15)",
              border: `1px solid ${f.level === "danger" ? "#ef4444" : f.level === "warn" ? "#f59e0b" : "#38bdf8"}`,
              borderRadius: 10, padding: "8px 10px", marginBottom: 6, fontSize: 12,
            }}>
              <b>⚠️ Seguridad:</b> {f.msg}
            </div>
          ))}
        </div>
      )}

      {/* Selector de categoría */}
      <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginBottom: 8 }}>
        <Chip active={cat === "all"} onClick={() => setCat("all")} C={C}>Todos</Chip>
        {Object.entries(LOG_CATEGORIES).map(([k, v]) => (
          <Chip key={k} active={cat === k} onClick={() => setCat(k)} C={C}>{v.label}</Chip>
        ))}
      </div>

      {/* Grid de presets */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 8 }}>
        {filtered.map((p) => (
          <button key={p.id} onClick={() => setSel(p.id)} style={{
            background: C.card, border: `1px solid ${C.border}`, borderRadius: 12, padding: "10px 4px",
            color: C.text, fontSize: 11, textAlign: "center", cursor: "pointer",
          }}>
            <div style={{ fontSize: 20 }}>{p.icon}</div>
            <div style={{ marginTop: 2, lineHeight: 1.1 }}>{p.label}</div>
          </button>
        ))}
        <button onClick={() => setSel("custom")} style={{
          background: C.card, border: `1px dashed ${C.border}`, borderRadius: 12, padding: "10px 4px",
          color: C.textMuted, fontSize: 11, textAlign: "center", cursor: "pointer",
        }}>
          <div style={{ fontSize: 20 }}>➕</div>
          <div style={{ marginTop: 2 }}>Personalizado</div>
        </button>
      </div>

      {/* Panel de captura */}
      {sel && (
        <div style={{ marginTop: 12, background: C.card, border: `1px solid ${C.border}`, borderRadius: 12, padding: 12 }}>
          <div style={{ fontWeight: 600, marginBottom: 8 }}>
            {sel === "custom" ? "Personalizado" : LOG_PRESET_BY_ID[sel]?.icon + " " + LOG_PRESET_BY_ID[sel]?.label}
          </div>
          {sel === "custom" && (
            <input
              value={customLabel} onChange={(e) => setCustomLabel(e.target.value)}
              placeholder="Nombre (ej. Té matcha)"
              style={inputStyle(C)}
            />
          )}
          <div style={{ display: "flex", alignItems: "center", gap: 8, margin: "8px 0" }}>
            <span style={{ fontSize: 12, color: C.textMuted }}>Cantidad</span>
            <button onClick={() => setAmount(Math.max(0.5, +amount - 0.5))} style={btnSm(C)}>−</button>
            <span style={{ minWidth: 36, textAlign: "center" }}>{amount}</span>
            <button onClick={() => setAmount(+amount + 0.5)} style={btnSm(C)}>+</button>
            <span style={{ fontSize: 11, color: C.textMuted }}>
              {sel === "custom" ? "" : LOG_PRESET_BY_ID[sel]?.unit}
            </span>
          </div>
          <input value={note} onChange={(e) => setNote(e.target.value)} placeholder="Nota (opcional)" style={inputStyle(C)} />
          <div style={{ display: "flex", gap: 8, marginTop: 10 }}>
            <button onClick={submit} style={{ ...btnPrimary(C), flex: 1 }}>Guardar</button>
            <button onClick={() => setSel(null)} style={btnGhost(C)}>Cancelar</button>
          </div>
        </div>
      )}

      {/* Lista por día */}
      <h3 style={{ fontSize: 14, fontWeight: 700, margin: "18px 0 6px" }}>Historial</h3>
      {days.length === 0 && <p style={{ color: C.textMuted, fontSize: 12 }}>Aún no has registrado nada.</p>}
      {days.map((d) => (
        <div key={d} style={{ marginBottom: 10 }}>
          <div style={{ fontSize: 12, color: C.textMuted, marginBottom: 4 }}>{d}</div>
          <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
            {logsByDay(logs)[d].map((l) => (
              <div key={l.id} style={{
                display: "flex", alignItems: "center", justifyContent: "space-between",
                background: C.card, border: `1px solid ${C.border}`, borderRadius: 8, padding: "6px 8px", fontSize: 12,
              }}>
                <span>{l.label} · {l.amount}{l.unit ? " " + l.unit : ""}{l.note ? ` · ${l.note}` : ""}</span>
                <button onClick={() => removeLog(l.id)} style={{ background: "transparent", border: "none", color: C.textMuted, cursor: "pointer" }}>✕</button>
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}

function Chip({ active, onClick, children, C }) {
  return (
    <button onClick={onClick} style={{
      background: active ? C.accent : C.card, color: active ? "#fff" : C.textMuted,
      border: `1px solid ${active ? C.accent : C.border}`, borderRadius: 999, padding: "4px 10px", fontSize: 11, cursor: "pointer",
    }}>{children}</button>
  );
}
function inputStyle(C) {
  return {
    width: "100%", background: C.inputBg, border: `1px solid ${C.border}`, borderRadius: 8,
    padding: "8px 10px", color: C.text, fontSize: 13, marginBottom: 8, outline: "none",
  };
}
function btnSm(C) { return { width: 28, height: 28, borderRadius: 8, border: `1px solid ${C.border}`, background: C.inputBg, color: C.text, cursor: "pointer" }; }
function btnPrimary(C) { return { background: C.accent, color: "#fff", border: "none", borderRadius: 8, padding: "9px 12px", fontSize: 13, fontWeight: 600, cursor: "pointer" }; }
function btnGhost(C) { return { background: "transparent", color: C.textMuted, border: `1px solid ${C.border}`, borderRadius: 8, padding: "9px 12px", fontSize: 13, cursor: "pointer" }; }
