// ============================================================
// TabBar — barra inferior fija con 5 pestañas (mobile-first).
// Orden: Técnico | Live | Dashboard | Sueño | Config
// ============================================================
import React from "react";
import { FlaskConical, Activity, Home, Moon, Settings } from "lucide-react";
import { C } from "./ui.jsx";

const TABS = [
  { id: "tech", label: "Técnico", icon: FlaskConical },
  { id: "live", label: "Live", icon: Activity },
  { id: "dash", label: "Inicio", icon: Home },
  { id: "sleep", label: "Sueño", icon: Moon },
  { id: "config", label: "Ajustes", icon: Settings },
];

export default function TabBar({ active, onChange }) {
  return (
    <nav
      className="fixed bottom-0 left-1/2 -translate-x-1/2 w-full max-w-md z-40"
      style={{ background: `${C.bgSoft}F2`, backdropFilter: "blur(12px)", borderTop: `1px solid ${C.border}` }}
      aria-label="Navegación principal"
    >
      <div className="flex items-stretch justify-around px-2 py-1.5">
        {TABS.map((t) => {
          const isActive = active === t.id;
          return (
            <button
              key={t.id}
              onClick={() => onChange(t.id)}
              style={{ color: isActive ? C.teal : C.textFaint }}
              className="flex flex-col items-center gap-0.5 flex-1 py-1.5 rounded-xl transition-colors active:scale-95"
              aria-current={isActive ? "page" : undefined}
            >
              <t.icon size={20} strokeWidth={isActive ? 2.4 : 2} />
              <span className="text-[10px] font-medium">{t.label}</span>
            </button>
          );
        })}
      </div>
    </nav>
  );
}
