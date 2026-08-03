// ============================================================
// COACH ENGINE — selecciona el banco de mensajes segun las
// metricas del dia y rota el mensaje en cada entrada a la app.
// Tambien expone getCoachAdvice(metrics, {llm}) para usar un LLM
// real (Groq) cuando el backend lo provea; si falla, cae a bancos.
// ============================================================
import { COACH_BANKS } from "./coachMessages.js";

// Dado el dia (objeto con metricas), devuelve la clave de perfil.
export function selectCoachProfile(today) {
  const hrv = today.hrv;
  const rhr = today.rhr;
  const sleep = today.sleepHours;
  const strain = today.dayStrain;
  const resp = today.resp;
  const risk = today.riskScore;
  const f = today.flags || [];
  const has = (sub) => f.some((x) => x.toLowerCase().includes(sub.toLowerCase()));

  if (has("proceso infeccioso") || (today.skinTemp != null && today.skinTemp > 1.0 && resp != null && resp > 16)) return "procesoInfeccioso";
  if (risk != null && risk >= 60) return "riesgoAlto";
  if (has("fatiga aguda") || (hrv != null && hrv < 40 && rhr != null && rhr > 62)) return "fatigaAguda";
  if (sleep != null && sleep < 6.5) return "suenoMalo";
  if (resp != null && resp > 16) return "respAlta";
  if (rhr != null && rhr > 64) return "rhrAlta";
  if (strain != null && strain > 14) return "strainAlto";
  if (hrv != null && hrv < 38) return "hrvBaja";
  if (resp != null && resp > 15.5) return "estresAlto";
  if (today.recovery != null && today.recovery > 70 && hrv != null && hrv >= 50) return "recuperacionBuena";
  if (hrv != null && hrv >= 55) return "hrvAlta";
  if (rhr != null && rhr < 56) return "rhrBaja";
  // sin datos clave pero dia en rango
  return "diaBueno";
}

// Rotacion determinista por entrada (sessionStorage) -> cambia al recargar.
function rotationIndex(bankLen, seedKey) {
  let rot = 0;
  try {
    rot = parseInt(sessionStorage.getItem(seedKey) || "0", 10) || 0;
    sessionStorage.setItem(seedKey, String((rot + 1) % bankLen));
  } catch {
    rot = Math.floor(Math.random() * bankLen);
  }
  return rot % bankLen;
}

// Devuelve un consejo del banco seleccionado (fallback local).
export function getLocalAdvice(today) {
  const profile = selectCoachProfile(today);
  const bank = COACH_BANKS[profile] || COACH_BANKS.diaBueno;
  const idx = rotationIndex(bank.length, "biopulse_coach_rot_" + profile);
  const pick = bank[idx];
  return { profile, title: pick.t, advice: pick.a, source: "local" };
}

// Fallback local para CHAT: elige un tip coherente con la PREGUNTA del usuario
// (palabras clave) y con el perfil del dia. Asi, sin API key, el coach sigue
// pareciendo personalizado en lugar de soltar tips al azar.
const KEYWORD_BANK = [
  { keys: ["sauna", "baño", "calor", "contraste"], bank: "recuperacionBuena" },
  { keys: ["dormir", "sueño", "sleep", "descansar", "insomnio"], bank: "suenoMalo" },
  { keys: ["entren", "entrenar", "gimnasio", "correr", "run", "fuerza", "pesas"], bank: "fatigaAguda" },
  { keys: ["estres", "ansiedad", "estrés", "ansios"], bank: "estresAlto" },
  { keys: ["hrv", "variabilidad"], bank: "hrvBaja" },
  { keys: ["rhr", "frecuencia cardiaca", "descanso"], bank: "rhrAlta" },
  { keys: ["hidrat", "agua", "beber"], bank: "hidratacion" },
  { keys: ["calor", "verano", "temperatura"], bank: "calor" },
  { keys: ["motiv", "ánimo", "animo", "comenzar"], bank: "motivacion" },
];
export function getLocalReply(today, question) {
  const profile = selectCoachProfile(today);
  let bankKey = profile;
  const q = (question || "").toLowerCase();
  for (const kb of KEYWORD_BANK) {
    if (kb.keys.some((k) => q.includes(k))) { bankKey = kb.bank; break; }
  }
  const bank = COACH_BANKS[bankKey] || COACH_BANKS[profile] || COACH_BANKS.diaBueno;
  const idx = rotationIndex(bank.length, "biopulse_coach_chat_" + bankKey);
  const pick = bank[idx];
  return pick ? pick.a : "Pregúntame sobre tus métricas de hoy.";
}

// Interfaz para LLM real. `callLLM` es async (inyectado desde el backend/
// funcion serverless). Si no hay o falla, cae a bancos locales.
export async function getCoachAdvice(today, { callLLM } = {}) {
  if (callLLM) {
    try {
      const llmText = await callLLM(today);
      if (llmText && llmText.length > 10) {
        // El LLM puede devolver "Titulo || Consejo" o solo consejo.
        const [title, ...rest] = llmText.split("||");
        return {
          profile: selectCoachProfile(today),
          title: (title || "Coach BioPulse").trim().slice(0, 60),
          advice: (rest.join("||") || llmText).trim(),
          source: "llm",
        };
      }
    } catch (e) {
      // silencioso: fallback
    }
  }
  return getLocalAdvice(today);
}

// Conteo de mensajes (para el checklist de >100).
export function countCoachMessages() {
  return Object.values(COACH_BANKS).reduce((a, b) => a + b.length, 0);
}
