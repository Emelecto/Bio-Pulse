import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App.jsx";
import "./index.css";

// Polyfill de window.storage para entornos fuera del artifact de Hermes
// (Vite/Next no lo tienen). Usa localStorage con la misma interfaz async.
if (typeof window !== "undefined" && !window.storage) {
  const prefix = "biopulse:";
  window.storage = {
    get: async (key) => {
      const raw = localStorage.getItem(prefix + key);
      return raw != null ? { value: raw } : null;
    },
    set: async (key, value) => {
      localStorage.setItem(prefix + key, value);
    },
    delete: async (key) => {
      localStorage.removeItem(prefix + key);
    },
  };
}

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
