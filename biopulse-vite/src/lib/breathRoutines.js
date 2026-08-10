// ============================================================
// breathRoutines — 3 rutinas de respiración guiada.
// Cada rutina define sus fases (en segundos) y metadata educativa.
// La investigación de "para qué sirve" está resumida en `benefit`.
// ============================================================

export const BREATH_ROUTINES = [
  {
    id: "basica",
    name: "Respiración equilibrante",
    subtitle: "Coherencia cardíaca 5-5",
    pattern: [
      { label: "Inhala", secs: 5 },
      { label: "Exhala", secs: 5 },
    ],
    color: "#00F5D4", // teal
    benefit:
      "Equilibra el sistema nervioso y mejora la variabilidad de la frecuencia cardíaca (HRV). Ideal para empezar el día o recuperarte entre tareas.",
    totalSecs: 120,
    tag: "Equilibra",
  },
  {
    id: "478",
    name: "Respiración relajante",
    subtitle: "Técnica 4-7-8 para dormir",
    pattern: [
      { label: "Inhala", secs: 4 },
      { label: "Sostén", secs: 7 },
      { label: "Exhala", secs: 8 },
    ],
    color: "#818CF8", // purple
    benefit:
      "Activa el sistema parasimpático y baja la frecuencia cardíaca. Muy usada para conciliar el sueño y cortar la ansiedad en minutos.",
    totalSecs: 120,
    tag: "Relaja",
  },
  {
    id: "box",
    name: "Respiración de enfoque",
    subtitle: "Box breathing 4-4-4-4",
    pattern: [
      { label: "Inhala", secs: 4 },
      { label: "Sostén", secs: 4 },
      { label: "Exhala", secs: 4 },
      { label: "Sostén", secs: 4 },
    ],
    color: "#34D399", // verde claro (enfoque)
    benefit:
      "Usada por fuerzas especiales y astronautas para mantener la calma y la claridad bajo presión. Estabiliza antes de decisiones o esfuerzo intenso.",
    totalSecs: 120,
    tag: "Enfoca",
  },
];

export const getRoutine = (id) => BREATH_ROUTINES.find((r) => r.id === id) || BREATH_ROUTINES[0];
