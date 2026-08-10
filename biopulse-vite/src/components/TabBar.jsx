// ============================================================
// TabBar — barra inferior flotante tipo iOS 26 (liquid glass).
// Orden: Live | Datos | Inicio | Sueño | Ajustes (Inicio al centro).
// ============================================================
import React, { useEffect } from "react";
import { Activity, Database, Home, Moon, Settings } from "lucide-react";
import { C } from "./ui.jsx";

const TABS = [
  { id: "live", label: "Live", icon: Activity },
  { id: "datos", label: "Datos", icon: Database },
  { id: "inicio", label: "Inicio", icon: Home },
  { id: "sleep", label: "Sueño", icon: Moon },
  { id: "config", label: "Ajustes", icon: Settings },
];

// Cada tab desplaza la luz de fondo hacia una zona distinta (iOS 26: el wallpaper "respira" con la navegación).
const TAB_BG = {
  live:   { x: -12, y: -6 },
  datos:  { x: -4,  y: -8 },
  inicio: { x: 0,   y: 6 },
  sleep:  { x: 6,   y: 10 },
  config: { x: 12,  y: 4 },
};

export default function TabBar({ active, onChange, safetyFlag }) {
  const idx = Math.max(0, TABS.findIndex((t) => t.id === active));

  // Mueve la luz de fondo al cambiar de pestaña.
  useEffect(() => {
    const off = TAB_BG[active] || { x: 0, y: 0 };
    document.documentElement.style.setProperty("--bg-x", String(off.x));
    document.documentElement.style.setProperty("--bg-y", String(off.y));
  }, [active]);

  return (
    <nav
      className="fixed bottom-0 left-1/2 -translate-x-1/2 w-full max-w-md z-40 px-3 pb-[max(12px,env(safe-area-inset-bottom))]"
      aria-label="Navegación principal"
      style={{ paddingBottom: "calc(12px + env(safe-area-inset-bottom))" }}
    >
      <div
        className="relative flex items-stretch justify-around px-1.5 py-1.5 rounded-[26px]"
        style={{
          background: `${C.bgSoft}F0`,
          backdropFilter: "blur(24px) saturate(160%)",
          WebkitBackdropFilter: "blur(24px) saturate(160%)",
          border: "1px solid rgba(255,255,255,0.14)",
          boxShadow:
            "0 10px 40px rgba(0,0,0,0.35), inset 0 1px 0 rgba(255,255,255,0.18)",
        }}
      >
        {/* Indicador deslizante (píldora translúcida) */}
        <span
          aria-hidden
          className="absolute top-1.5 bottom-1.5 rounded-[20px] pointer-events-none"
          style={{
            width: `calc((100% - 12px) / ${TABS.length})`,
            left: `calc(6px + ${idx} * ((100% - 12px) / ${TABS.length}))`,
            background: `linear-gradient(180deg, ${C.teal}33, ${C.teal}14)`,
            border: `1px solid ${C.teal}55`,
            boxShadow: `0 0 18px ${C.teal}40, inset 0 1px 0 rgba(255,255,255,0.25)`,
            transition: "left 0.42s cubic-bezier(0.22, 1, 0.36, 1), background 0.42s ease",
          }}
        />

        {TABS.map((t) => {
          const isActive = active === t.id;
          return (
            <button
              key={t.id}
              onClick={() => onChange(t.id)}
              style={{ color: isActive ? C.teal : C.textFaint }}
              className="relative z-10 flex flex-col items-center gap-0.5 flex-1 py-1.5 rounded-[20px] transition-colors active:scale-95"
              aria-current={isActive ? "page" : undefined}
            >
              <t.icon
                size={20}
                strokeWidth={isActive ? 2.4 : 2}
                style={isActive ? { filter: `drop-shadow(0 0 6px ${C.teal}80)` } : undefined}
              />
              <span
                className="text-[10px] font-medium"
                style={{ opacity: isActive ? 1 : 0.7 }}
              >
                {t.label}
              </span>
              {t.id === "datos" && safetyFlag && (
                <span
                  aria-hidden
                  style={{
                    position: "absolute", top: 4, right: "50%",
                    transform: "translateX(14px)",
                    width: 8, height: 8, borderRadius: "50%",
                    background: "#ef4444", boxShadow: "0 0 8px #ef4444",
                  }}
                />
              )}
            </button>
          );
        })}
      </div>
    </nav>
  );
}
