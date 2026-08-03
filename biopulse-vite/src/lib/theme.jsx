// ============================================================
// lib/theme.jsx — ThemeProvider (dark/light). Aplica la paleta
// al objeto C (mutacion en runtime, mismo objeto que importan
// todos los componentes) y guarda la preferencia en localStorage.
// No cambia ningun import en los componentes: todos usan C y al
// re-renderizar ven la paleta activa.
// ============================================================
import React, { createContext, useContext, useEffect, useState } from "react";
import { C, applyTheme } from "../components/ui.jsx";

const ThemeContext = createContext({ theme: "dark", toggleTheme: () => {}, setTheme: () => {} });

export function ThemeProvider({ children }) {
  const [theme, setThemeState] = useState(() => {
    if (typeof window === "undefined") return "dark";
    return localStorage.getItem("biopulse_theme") || "dark";
  });

  useEffect(() => {
    applyTheme(theme);
    localStorage.setItem("biopulse_theme", theme);
    if (typeof document !== "undefined") {
      document.body.style.background = C.bg;
      document.documentElement.style.colorScheme = theme;
    }
  }, [theme]);

  const setTheme = (t) => setThemeState(t);
  const toggleTheme = () => setThemeState((p) => (p === "dark" ? "light" : "dark"));

  return (
    <ThemeContext.Provider value={{ theme, toggleTheme, setTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  return useContext(ThemeContext);
}
