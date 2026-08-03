// ============================================================
// TabBar — barra inferior flotante tipo iOS 26 (liquid glass).
// Cápsula redonda y translúcida con indicador deslizante;
// mueve la luz de fondo según la pestaña activa.
// Orden: Técnico | Live | Inicio | Sueño | Ajustes
// ============================================================
import React, { useEffect } from "react";
import { FlaskConical, Activity, Home, Moon, Settings } from "lucide-react";
import { C } from "./ui.jsx";

const TABS = [
  { id: "tech", label: "Técnico", icon: FlaskConical },
  { id: "live", label: "Live", icon: Activity },
  { id: "dash", label: "Inicio", icon: Home },
  { id: "sleep", label: "Sueño", icon: Moon },
  { id: "config", label: "Ajustes", icon: Settings },
];

// Cada tab desplaza la luz de fondo hacia una zona distinta (iOS 26: el wallpaper "respira" con la navegación).
const TAB_BG = {
  tech:   { x: -10, y: -6 },
  live:   { x: 8,   y: -8 },
  dash:   { x: 0,   y: 6 },
  sleep:  { x: -6,  y: 10 },
  config: { x: 10,  y: 4 },
};

export default function TabBar({ active, onChange }) {
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
            </button>
          );
        })}
      </div>
    </nav>
  );
}
