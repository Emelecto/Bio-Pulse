// ============================================================
// lib/supabase.js — cliente de Supabase (auth real).
// Las credenciales vienen de variables de entorno de Vercel
// (VITE_SUPABASE_URL, VITE_SUPABASE_ANON_KEY). La anon key es
// publica por diseno (segura para el frontend); la secret key
// NUNCA va al frontend.
// Si no hay credenciales, supabaseClient queda null y la app
// usa el login mock local (fallback).
// ============================================================
import { createClient } from "@supabase/supabase-js";

const url = import.meta.env.VITE_SUPABASE_URL;
const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

export const supabaseEnabled = Boolean(url && anonKey);
export const supabaseClient = supabaseEnabled ? createClient(url, anonKey) : null;
