// ============================================================
// hooks/useAuth.js — auth real con Supabase (email/password,
// confirmacion por correo, reset de password, OAuth Google) con
// fallback a mock local si no hay credenciales. Errores traducidos.
// ============================================================
import { useState, useEffect } from "react";
import { supabaseClient, supabaseEnabled } from "../lib/supabase.js";

// Traduce mensajes cripticos de Supabase a espanol claro.
function translateError(msg = "") {
  if (/user already registered/i.test(msg)) return "Ese correo ya tiene una cuenta. Inicia sesión.";
  if (/invalid login credentials/i.test(msg)) return "Correo o contraseña incorrectos.";
  if (/password should be at least/i.test(msg)) return "La contraseña debe tener al menos 6 caracteres.";
  if (/email not confirmed/i.test(msg)) return "Aún no has verificado tu correo. Revisa tu bandeja y haz clic en el enlace.";
  if (/unable to validate email/i.test(msg)) return "El correo no tiene un formato válido.";
  if (/for security purposes/i.test(msg)) return "Demasiados intentos. Espera un momento e inténtalo de nuevo.";
  if (/user not found/i.test(msg)) return "No existe una cuenta con ese correo.";
  return msg || "Ocurrió un error. Inténtalo de nuevo.";
}

export function useAuth() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [info, setInfo] = useState(null); // mensajes no-error (ej. reset enviado)
  const [needsConfirmation, setNeedsConfirmation] = useState(false);
  const isReal = supabaseEnabled;

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
    setError(null); setLoading(true); setNeedsConfirmation(false); setInfo(null);
    try {
      if (isReal && supabaseClient) {
        const { data, error } = await supabaseClient.auth.signUp({ email, password });
        if (error) { setError(translateError(error.message)); return false; }
        // Si Supabase NO abre sesion automaticamente => pide confirmar correo.
        if (!data.session) {
          setNeedsConfirmation(true);
          return "confirm";
        }
        return true;
      }
      // mock: simula flujo de confirmacion para consistencia visual
      setNeedsConfirmation(true);
      return "confirm";
    } catch (e) { setError(translateError(e.message)); return false; }
    finally { setLoading(false); }
  };

  const signIn = async (email, password) => {
    setError(null); setLoading(true); setNeedsConfirmation(false); setInfo(null);
    try {
      if (isReal && supabaseClient) {
        const { error } = await supabaseClient.auth.signInWithPassword({ email, password });
        if (error) { setError(translateError(error.message)); return false; }
        return true;
      }
      setUser({ email, name: email.split("@")[0] });
      return true;
    } catch (e) { setError(translateError(e.message)); return false; }
    finally { setLoading(false); }
  };

  const signInWithGoogle = async () => {
    setError(null); setLoading(true); setInfo(null);
    try {
      if (isReal && supabaseClient) {
        const { error } = await supabaseClient.auth.signInWithOAuth({
          provider: "google",
          options: { redirectTo: window.location.origin },
        });
        if (error) { setError(translateError(error.message)); return false; }
        return true; // redirige a Google
      }
      setError("Login con Google no disponible en modo demo.");
      return false;
    } catch (e) { setError(translateError(e.message)); return false; }
    finally { setLoading(false); }
  };

  const resetPassword = async (email) => {
    setError(null); setLoading(true); setInfo(null);
    try {
      if (isReal && supabaseClient) {
        const { error } = await supabaseClient.auth.resetPasswordForEmail(email, {
          redirectTo: window.location.origin + "/ajustes",
        });
        if (error) { setError(translateError(error.message)); return false; }
        setInfo("Te enviamos un enlace a tu correo para restablecer la contraseña.");
        return true;
      }
      setInfo("Te enviamos un enlace a tu correo para restablecer la contraseña.");
      return true;
    } catch (e) { setError(translateError(e.message)); return false; }
    finally { setLoading(false); }
  };

  const signOut = async () => {
    setError(null); setInfo(null); setNeedsConfirmation(false);
    if (isReal && supabaseClient) await supabaseClient.auth.signOut();
    setUser(null);
  };

  return { user, loading, error, info, needsConfirmation, signUp, signIn, signInWithGoogle, resetPassword, signOut, isReal };
}
