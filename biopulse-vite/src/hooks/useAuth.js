// ============================================================
// hooks/useAuth.js — estado de sesion con Supabase (auth real).
// Si supabaseClient existe: usa signUp/signInWithPassword/signOut
// y escucha cambios de sesion. Si no: fallback a mock local (estado
// en memoria) para no romper la app antes de configurar credenciales.
// ============================================================
import { useState, useEffect } from "react";
import { supabaseClient, supabaseEnabled } from "../lib/supabase.js";

export function useAuth() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [mode, setMode] = useState(supabaseEnabled ? "supabase" : "mock");

  // Escuchar cambios de sesion (Supabase) o restaurar mock.
  useEffect(() => {
    if (supabaseEnabled && supabaseClient) {
      supabaseClient.auth.getSession().then(({ data }) => {
        if (data.session?.user) setUser({ email: data.session.user.email, name: (data.session.user.email || "").split("@")[0] });
      });
      const { data: sub } = supabaseClient.auth.onAuthStateChange((_e, session) => {
        setUser(session?.user ? { email: session.user.email, name: (session.user.email || "").split("@")[0] } : null);
      });
      return () => sub.subscription.unsubscribe();
    }
  }, []);

  const signUp = async (email, password) => {
    setError(null); setLoading(true);
    try {
      if (mode === "supabase" && supabaseClient) {
        const { error } = await supabaseClient.auth.signUp({ email, password });
        if (error) { setError(error.message); return false; }
        return true;
      }
      // mock
      setUser({ email, name: email.split("@")[0] });
      return true;
    } catch (e) { setError(e.message); return false; }
    finally { setLoading(false); }
  };

  const signIn = async (email, password) => {
    setError(null); setLoading(true);
    try {
      if (mode === "supabase" && supabaseClient) {
        const { error } = await supabaseClient.auth.signInWithPassword({ email, password });
        if (error) { setError(error.message); return false; }
        return true;
      }
      // mock
      setUser({ email, name: email.split("@")[0] });
      return true;
    } catch (e) { setError(e.message); return false; }
    finally { setLoading(false); }
  };

  const signOut = async () => {
    if (mode === "supabase" && supabaseClient) {
      await supabaseClient.auth.signOut();
    }
    setUser(null);
  };

  return { user, loading, error, signUp, signIn, signOut, isReal: mode === "supabase" };
}
