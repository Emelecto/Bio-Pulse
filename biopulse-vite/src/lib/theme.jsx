// ============================================================
// lib/theme.jsx — ThemeProvider (dark/light).
// Aplica la paleta al objeto C (mutacion en runtime, mismo objeto que
// importan todos los componentes) y guarda la preferencia en localStorage.
// CLAVE DEL FIX: forceVersion se incrementa en cada cambio de tema y se
// expone por contexto, asi CUALQUIER componente que consuma useTheme()
// (incluido AppInner) re-renderiza de inmediato y relee C mutado.
// Sin esto, mutar C no dispara re-render y el cambio no se ve hasta
// que el componente re-renderiza por otra causa (ej. cambiar de tab).
// ============================================================
import React, { createContext, useContext, useEffect, useState } from "react";
import { C, applyTheme } from "../components/ui.jsx";

const ThemeContext = createContext({ theme: "dark", toggleTheme: () => {}, setTheme: () => {}, forceVersion: 0 });

export function ThemeProvider({ children }) {
  const [theme, setThemeState] = useState(() => {
    if (typeof window === "undefined") return "dark";
    return localStorage.getItem("biopulse_theme") || "dark";
  });
  // Contador que FUERZA re-render global en cada cambio de tema.
  const [forceVersion, setForceVersion] = useState(0);

  useEffect(() => {
    applyTheme(theme); // muta el objeto C (mismo que importan los componentes)
    localStorage.setItem("biopulse_theme", theme);
    if (typeof document !== "undefined") {
      document.body.style.background = C.bg;
      document.documentElement.style.colorScheme = theme;
    }
    // Fuerza un re-render de todos los consumidores del contexto, para que
    // relean el C ya mutado (sin esto el cambio no se refleja de inmediato).
    setForceVersion((v) => v + 1);
  }, [theme]);

  const setTheme = (t) => setThemeState(t);
  const toggleTheme = () => setThemeState((p) => (p === "dark" ? "light" : "dark"));

  return (
    <ThemeContext.Provider value={{ theme, toggleTheme, setTheme, forceVersion }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  return useContext(ThemeContext);
}
