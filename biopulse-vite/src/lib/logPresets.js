// ============================================================
// lib/logPresets.js — Presets de hábitos/sustancias para el Registro.
// 45 presets agrupados por categoría + soporte para personalizado.
// Cada preset: { id, label, category, unit, icon }
// ============================================================

export const LOG_CATEGORIES = {
  consumo: { label: "Consumo", color: "#f59e0b" },
  medicamento: { label: "Medicamento", color: "#38bdf8" },
  suplemento: { label: "Suplemento", color: "#34d399" },
  habito: { label: "Hábito", color: "#a78bfa" },
  biologico: { label: "Biológico", color: "#fb7185" },
};

export const LOG_PRESETS = [
  // Consumo
  { id: "alcohol", label: "Alcohol", category: "consumo", unit: "tragos", icon: "🍺" },
  { id: "cigarrillo", label: "Cigarrillo", category: "consumo", unit: "cigarros", icon: "🚬" },
  { id: "vape", label: "Vape", category: "consumo", unit: "sesiones", icon: "💨" },
  { id: "cafe", label: "Café / Cafeína", category: "consumo", unit: "tazas", icon: "☕" },
  { id: "energetica", label: "Bebida energética", category: "consumo", unit: "latas", icon: "🥤" },
  { id: "cannabis", label: "Cannabis", category: "consumo", unit: "sesiones", icon: "🌿" },
  { id: "azucar", label: "Refresco / azúcar", category: "consumo", unit: "porciones", icon: "🍬" },

  // Medicamentos
  { id: "antibiotico", label: "Antibiótico", category: "medicamento", unit: "dosis", icon: "💊" },
  { id: "analgesico", label: "Analgésico", category: "medicamento", unit: "dosis", icon: "💊" },
  { id: "antiinflamatorio", label: "Antiinflamatorio", category: "medicamento", unit: "dosis", icon: "💊" },
  { id: "antihistaminico", label: "Antihistamínico", category: "medicamento", unit: "dosis", icon: "💊" },
  { id: "antidepresivo", label: "Antidepresivo", category: "medicamento", unit: "dosis", icon: "💊" },
  { id: "ansiolitico", label: "Ansiolítico", category: "medicamento", unit: "dosis", icon: "💊" },
  { id: "relajante", label: "Relajante muscular", category: "medicamento", unit: "dosis", icon: "💊" },

  // Suplementos
  { id: "proteina", label: "Proteína", category: "suplemento", unit: "scoops/g", icon: "🥩" },
  { id: "creatina", label: "Creatina", category: "suplemento", unit: "g", icon: "💪" },
  { id: "electrolitos", label: "Electrolitos", category: "suplemento", unit: "porciones", icon: "🧂" },
  { id: "magnesio", label: "Magnesio", category: "suplemento", unit: "mg", icon: "🧪" },
  { id: "omega3", label: "Omega-3", category: "suplemento", unit: "cápsulas", icon: "🐟" },
  { id: "vitd", label: "Vitamina D", category: "suplemento", unit: "UI", icon: "☀️" },
  { id: "zinc", label: "Zinc", category: "suplemento", unit: "mg", icon: "🧪" },
  { id: "cafeina_pe", label: "Cafeína pre-entreno", category: "suplemento", unit: "mg", icon: "⚡" },
  { id: "betaalanina", label: "Beta-alanina", category: "suplemento", unit: "g", icon: "🏋️" },
  { id: "bcaa", label: "BCAAs", category: "suplemento", unit: "g", icon: "🧪" },
  { id: "multi", label: "Multivitamínico", category: "suplemento", unit: "dosis", icon: "🧪" },

  // Hábitos
  { id: "fuerza", label: "Entrenamiento fuerza", category: "habito", unit: "min", icon: "🏋️" },
  { id: "cardio", label: "Cardio", category: "habito", unit: "min", icon: "🏃" },
  { id: "hiit", label: "HIIT", category: "habito", unit: "min", icon: "🔥" },
  { id: "yoga", label: "Yoga / estiramiento", category: "habito", unit: "min", icon: "🧘" },
  { id: "meditacion", label: "Meditación / respiración", category: "habito", unit: "min", icon: "🌬️" },
  { id: "sauna", label: "Sauna", category: "habito", unit: "min", icon: "♨️" },
  { id: "banofrio", label: "Baño frío", category: "habito", unit: "min", icon: "🧊" },
  { id: "siesta", label: "Siesta", category: "habito", unit: "min", icon: "😴" },
  { id: "hidratacion", label: "Hidratación extra", category: "habito", unit: "vasos", icon: "💧" },
  { id: "cena_tardia", label: "Comida pesada / cena tardía", category: "habito", unit: "ocasión", icon: "🍔" },
  { id: "ayuno", label: "Ayuno intermitente", category: "habito", unit: "horas", icon: "⏳" },
  { id: "pantallas", label: "Pantallas nocturnas", category: "habito", unit: "min", icon: "📱" },
  { id: "solar", label: "Exposición solar", category: "habito", unit: "min", icon: "🌞" },
  { id: "social", label: "Salida / vida social", category: "habito", unit: "evento", icon: "🎉" },

  // Biológico
  { id: "menstruacion", label: "Menstruación", category: "biologico", unit: "día ciclo", icon: "🩸" },
  { id: "enfermedad", label: "Resfriado / enfermedad", category: "biologico", unit: "severidad", icon: "🤒" },
  { id: "vacuna", label: "Vacuna", category: "biologico", unit: "dosis", icon: "💉" },
  { id: "jetlag", label: "Jet lag / viaje", category: "biologico", unit: "ocasión", icon: "✈️" },
  { id: "insomnio", label: "Mala noche (insomnio)", category: "biologico", unit: "ocasión", icon: "🌑" },
  { id: "estres_alto", label: "Estrés alto", category: "biologico", unit: "nivel", icon: "⚠️" },
];

export const LOG_PRESET_BY_ID = Object.fromEntries(LOG_PRESETS.map((p) => [p.id, p]));

// Combos de riesgo para banderas de seguridad.
export const SAFETY_FLAGS = [
  {
    id: "alcohol_antibiotico",
    when: ["alcohol", "antibiotico"],
    level: "warn",
    msg: "Alcohol + antibiótico: el alcohol puede reducir la eficacia del antibiótico y cargar el hígado. Evita consumir ambos el mismo día.",
  },
  {
    id: "fuerza_enfermedad",
    when: ["fuerza", "enfermedad"],
    level: "warn",
    msg: "Entrenamiento de fuerza con enfermedad: tu cuerpo necesita recuperar. Baja la intensidad o descansa.",
  },
  {
    id: "hiit_enfermedad",
    when: ["hiit", "enfermedad"],
    level: "danger",
    msg: "HIIT con enfermedad: riesgo alto de empeorar. Mejor recuperación hoy.",
  },
  {
    id: "alcohol_ansiolitico",
    when: ["alcohol", "ansiolitico"],
    level: "danger",
    msg: "Alcohol + ansiolítico: combinación depresora del sistema nervioso. No los mezcles.",
  },
  {
    id: "cafeina_insomnio",
    when: ["cafeina_pe", "insomnio"],
    level: "info",
    msg: "Cafeína pre-entreno tras mala noche: puede profundizar el déficit de sueño. Modera.",
  },
];

// Presets "saludables" (suman racha positiva) y "a evitar" (su AUSENCIA suma racha).
// Usado por computeStreaks para gamificación positiva (punto 5).
export const POSITIVE_PRESETS = new Set([
  "proteina", "creatina", "electrolitos", "magnesio", "omega3", "vitd", "zinc",
  "cafeina_pe", "betaalanina", "bcaa", "multi",
  "fuerza", "cardio", "hiit", "yoga", "meditacion", "sauna", "banofrio", "hidratacion", "siesta",
]);
export const AVOID_PRESETS = new Set([
  "alcohol", "cigarrillo", "vape", "cannabis", "energetica", "azucar",
]);
