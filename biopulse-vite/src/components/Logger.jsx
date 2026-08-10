// ============================================================
// Logger — registro de hábitos/sustancias.
// Flujo organizado: 1) elige CATEGORÍA, 2) elige el ítem de esa
// categoría, 3) se abre un MODAL en pantalla para cantidad/hora/nota.
// Sin scroll forzado para registrar. Incluye banderas de seguridad.
// ============================================================
import React, { useState, useMemo } from "react";
import { X, Plus, Trash2, AlertTriangle } from "lucide-react";
import { C } from "./ui.jsx";
import { LOG_CATEGORIES, LOG_PRESETS, SAFETY_FLAGS } from "../lib/logPresets.js";

const CAT_ORDER = ["consumo", "medicamento", "suplemento", "habito", "biologico"];

export default function Logger({ logs = [], onAdd, onRemove }) {
  const [cat, setCat] = useState(null); // categoría elegida
  const [preset, setPreset] = useState(null); // preset elegido (abre modal)
  const [amount, setAmount] = useState(1);
  const [hour, setHour] = useState("");
  const [note, setNote] = useState("");

  const presetsOfCat = useMemo(
    () => (cat ? LOG_PRESETS.filter((p) => p.category === cat) : []),
    [cat]
  );

  const todayIds = useMemo(() => {
    const todayKey = new Date().toISOString().slice(0, 10);
    return logs.filter((l) => (l.ts || "").slice(0, 10) === todayKey).map((l) => l.preset);
  }, [logs]);

  // Banderas de seguridad activas hoy.
  const flags = useMemo(() => {
    const set = new Set(todayIds);
    return SAFETY_FLAGS.filter((f) => f.when.every((id) => set.has(id)));
  }, [todayIds]);

  const openModal = (p) => {
    setPreset(p);
    setAmount(1);
    setHour("");
    setNote("");
  };

  const save = async () => {
    if (!preset) return;
    await onAdd({
      preset: preset.id,
      label: preset.label,
      category: preset.category,
      unit: preset.unit,
      amount: Number(amount) || 1,
      note: note.trim(),
      ts: hour ? new Date().toISOString().slice(0, 11) + hour + ":00.000Z" : new Date().toISOString(),
    });
    setPreset(null);
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
      {/* BANDERAS DE SEGURIDAD */}
      {flags.length > 0 && (
        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          {flags.map((f) => (
            <div key={f.id} style={{ background: f.level === "danger" ? "rgba(255,0,85,.12)" : "rgba(245,158,11,.12)", border: `1px solid ${f.level === "danger" ? C.rose : C.amber}`, borderRadius: 14, padding: 12, display: "flex", gap: 10 }}>
              <AlertTriangle size={18} color={f.level === "danger" ? C.rose : C.amber} style={{ flexShrink: 0, marginTop: 2 }} />
              <span style={{ color: C.text, fontSize: 12.5, lineHeight: 1.4 }}>{f.msg}</span>
            </div>
          ))}
        </div>
      )}

      {/* SELECTOR DE CATEGORÍA */}
      {!cat && (
        <div>
          <div style={{ color: C.text, fontWeight: 600, fontSize: 14, marginBottom: 10 }}>¿Qué vas a registrar?</div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
            {CAT_ORDER.map((cid) => {
              const c = LOG_CATEGORIES[cid];
              return (
                <button key={cid} onClick={() => setCat(cid)} style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 16, padding: 16, display: "flex", alignItems: "center", gap: 12, cursor: "pointer", textAlign: "left" }}>
                  <span style={{ width: 10, height: 10, borderRadius: 999, background: c.color, flexShrink: 0 }} />
                  <span style={{ color: C.text, fontWeight: 600, fontSize: 14 }}>{c.label}</span>
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* LISTA DE PRESETS DE LA CATEGORÍA */}
      {cat && !preset && (
        <div>
          <button onClick={() => setCat(null)} style={{ background: "transparent", border: "none", color: C.teal, fontSize: 13, fontWeight: 600, padding: 0, marginBottom: 10, cursor: "pointer" }}>
            ← Cambiar categoría
          </button>
          <div style={{ color: C.text, fontWeight: 600, fontSize: 14, marginBottom: 10 }}>{LOG_CATEGORIES[cat].label}</div>
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            {presetsOfCat.map((p) => (
              <button key={p.id} onClick={() => openModal(p)} style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 14, padding: 14, display: "flex", alignItems: "center", gap: 12, cursor: "pointer", textAlign: "left" }}>
                <span style={{ fontSize: 20 }}>{p.icon}</span>
                <span style={{ color: C.text, fontWeight: 600, fontSize: 14, flex: 1 }}>{p.label}</span>
                <span style={{ color: C.textFaint, fontSize: 11 }}>{p.unit}</span>
                <Plus size={18} color={C.teal} />
              </button>
            ))}
            <button onClick={() => openModal({ id: "custom", label: "Personalizado", category: cat, unit: "", icon: "✍️" })} style={{ background: C.bgSoft, border: `1px dashed ${C.border}`, borderRadius: 14, padding: 14, display: "flex", alignItems: "center", gap: 12, cursor: "pointer", color: C.textMuted, fontSize: 13 }}>
              <span style={{ fontSize: 18 }}>✍️</span> Personalizado
            </button>
          </div>
        </div>
      )}

      {/* REGISTROS DE HOY */}
      {logs.length > 0 && (
        <div>
          <div style={{ color: C.textMuted, fontSize: 12, marginBottom: 8 }}>Registrado hoy</div>
          <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
            {logs.slice().reverse().map((l) => (
              <div key={l.id} style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 12, padding: "10px 12px", display: "flex", alignItems: "center", gap: 10 }}>
                <span style={{ color: C.text, fontSize: 13.5, flex: 1 }}>{l.label} {Number(l.amount) ? `· ${l.amount} ${l.unit || ""}`.trim() : ""}</span>
                <button onClick={() => onRemove && onRemove(l.id)} style={{ background: "transparent", border: "none", color: C.textFaint, cursor: "pointer" }}><Trash2 size={16} /></button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* MODAL DE REGISTRO EN PANTALLA */}
      {preset && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center px-4" style={{ background: "rgba(2,6,12,0.74)", backdropFilter: "blur(10px)" }} onClick={() => setPreset(null)}>
          <div onClick={(e) => e.stopPropagation()} className="relative w-full max-w-sm rounded-[24px] p-6 mb-4 sm:mb-0" style={{ background: C.card, border: `1px solid ${C.border}` }}>
            <button onClick={() => setPreset(null)} aria-label="Cerrar" className="absolute top-4 right-4 w-9 h-9 rounded-full flex items-center justify-center" style={{ background: C.bgSoft, color: C.textMuted }}><X size={16} /></button>
            <div style={{ color: C.textFaint, fontSize: 12, marginBottom: 2 }}>{LOG_CATEGORIES[preset.category]?.label}</div>
            <div style={{ color: C.text, fontWeight: 700, fontSize: 18, marginBottom: 16 }}>{preset.icon} {preset.label}</div>

            <label style={{ color: C.textMuted, fontSize: 12 }}>Cantidad{preset.unit ? ` (${preset.unit})` : ""}</label>
            <input type="number" min="0" step="0.5" value={amount} onChange={(e) => setAmount(e.target.value)} className="w-full mt-1 mb-4 rounded-xl px-3 py-2.5 text-[15px]" style={{ background: C.bgSoft, border: `1px solid ${C.border}`, color: C.text }} />

            <label style={{ color: C.textMuted, fontSize: 12 }}>Hora (opcional)</label>
            <input type="time" value={hour} onChange={(e) => setHour(e.target.value)} className="w-full mt-1 mb-4 rounded-xl px-3 py-2.5 text-[15px]" style={{ background: C.bgSoft, border: `1px solid ${C.border}`, color: C.text }} />

            <label style={{ color: C.textMuted, fontSize: 12 }}>Nota (opcional)</label>
            <input type="text" value={note} onChange={(e) => setNote(e.target.value)} placeholder="Ej: después de entrenar" className="w-full mt-1 mb-5 rounded-xl px-3 py-2.5 text-[15px]" style={{ background: C.bgSoft, border: `1px solid ${C.border}`, color: C.text }} />

            <button onClick={save} className="w-full text-[15px] font-semibold py-3 rounded-2xl active:scale-[0.98] transition-transform" style={{ background: C.teal, color: "#050A10" }}>
              Guardar registro
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
