// ============================================================
// api/coach.js — Vercel Function (Node): coach de IA (Gemini).
// Vive en el root del proyecto frontend para que Vercel la detecte
// automaticamente como Function en /api/coach (mismo dominio, sin CORS).
//
// SEGURIDAD:
//  - GOOGLE_AI_API_KEY solo en variables de entorno de Vercel (server).
//  - Rate limit por IP (memoria, por instancia).
//  - Validacion estricta de input (solo numericos permitidos).
//  - Stateless: no persistimos datos de salud.
//  - System prompt medical-safe.
// ============================================================
import { GoogleGenerativeAI } from "@google/generative-ai";

const MODEL = process.env.GEMINI_MODEL || "gemini-1.5-flash";
const MAX_REQUESTS = 20;
const WINDOW_MS = 60 * 1000;
const ipHits = new Map();
const DISCLAIMER = "Esto no es consejo médico. Ante síntomas persistentes o fiebre, consulta a un profesional.";

function rateLimited(ip) {
  const now = Date.now();
  const hits = (ipHits.get(ip) || []).filter((t) => now - t < WINDOW_MS);
  hits.push(now);
  ipHits.set(ip, hits);
  return hits.length > MAX_REQUESTS;
}

function send(res, status, obj) {
  res.statusCode = status;
  res.setHeader("Content-Type", "application/json");
  res.end(JSON.stringify(obj));
}

function sanitizeMetrics(body) {
  if (!body || typeof body !== "object") return null;
  const allowed = ["hrv","rhr","recovery","resp","skinTemp","sleepEff","sleepPerf",
    "sleepHours","dayStrain","steps","wakeUps","riskScore","sleepScore","stressScore","fatigueScore"];
  for (const k of Object.keys(body)) {
    if (!allowed.includes(k)) return null;
    const v = body[k];
    if (typeof v !== "number" || !isFinite(v)) return null;
  }
  const out = {};
  for (const k of allowed) {
    const v = body[k];
    if (typeof v === "number" && isFinite(v)) out[k] = Math.max(-200, Math.min(400, v));
  }
  return out;
}

const SYSTEM_PROMPT = `Eres "Coach BioPulse", un asistente de bienestar y fisiología del ejercicio para usuarios de un wearable.
Tu objetivo: dar UN consejo corto, accionable y seguro basado en las métricas del día del usuario.
Contexto: hrv (ms), rhr (bpm), recovery (%), resp (rpm), skinTemp (desv. °C), sleepHours, sleepScore, stressScore, fatigueScore, riskScore (0-100).
Reglas estrictas:
- Responde en ESPAÑOL, máximo 2 frases, tono cercano y motivador.
- Si riskScore >= 60 o hay señal de proceso infeccioso (skinTemp > 1 y resp > 16): recomienda REPOSO y consulta médica.
- Nunca diagnostiques enfermedades ni recetes medicamentos.
- No inventes números; usa los del usuario.
- Termina con el aviso: "${DISCLAIMER}"
Salida: una sola línea de consejo.`;

export default async function handler(req, res) {
  if (req.method === "OPTIONS") return send(res, 204, {});
  if (req.method !== "POST") return send(res, 405, { error: "Method Not Allowed" });

  const ip = (req.headers["x-forwarded-for"] || req.socket?.remoteAddress || "anon").toString().split(",")[0].trim();
  if (rateLimited(ip)) return send(res, 429, { error: "Demasiadas solicitudes. Intenta en un minuto." });

  // En Vercel Functions, el body ya viene parseado como objeto.
  const metrics = sanitizeMetrics(req.body || {});
  if (!metrics || Object.keys(metrics).length === 0) return send(res, 400, { error: "Sin métricas válidas." });

  const apiKey = process.env.GOOGLE_AI_API_KEY;
  if (!apiKey) return send(res, 200, { advice: "", fallback: true });

  try {
    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({ model: MODEL, generationConfig: { maxOutputTokens: 160, temperature: 0.6 } });
    const userLine = Object.entries(metrics).map(([k, v]) => `${k}=${v}`).join(", ");
    const result = await model.generateContent([SYSTEM_PROMPT, `Métricas de hoy: ${userLine}`]);
    const text = (result.response.text() || "").trim();
    return send(res, 200, { advice: text, source: "gemini" });
  } catch (e) {
    return send(res, 200, { advice: "", fallback: true });
  }
}
