const pptxgen = require("pptxgenjs");
const path = require("path");

const FILES = "C:/Users/ecard/Desktop/BIOPULSE PROYECTO CIENCIA DE DATOS/files";

// Paleta de marca BioPulse (sin '#')
const C = {
  bg: "0A1420",
  card: "101F30",
  cardAlt: "0D1B2A",
  border: "1D3348",
  borderSoft: "152840",
  teal: "4FD8C4",
  amber: "F2B84B",
  rose: "F0687A",
  purple: "9BA8F2",
  text: "EAF2F5",
  muted: "8AA0B2",
  white: "FFFFFF",
};

const F = { head: "Cambria", body: "Calibri", mono: "Consolas" };

const pptx = new pptxgen();
pptx.layout = "LAYOUT_WIDE"; // 13.3 x 7.5
const PW = 13.3, PH = 7.5;

// ---------- helpers ----------
function bg(slide, color = C.bg) {
  slide.background = { color };
}
function card(slide, x, y, w, h, fill = C.card, line = C.border, radius = 0.12) {
  slide.addShape(pptx.ShapeType.roundRect, {
    x, y, w, h, rectRadius: radius,
    fill: { color: fill }, line: { color: line, width: 1 },
  });
}
function iconCircle(slide, x, y, d, color) {
  slide.addShape(pptx.ShapeType.ellipse, {
    x, y, w: d, h: d, fill: { color: color }, line: { type: "none" },
  });
}
function title(slide, text, color = C.text, size = 32, y = 0.45, x = 0.6) {
  slide.addText(text, {
    x, y, w: PW - 2 * x, h: 0.9, fontFace: F.head, fontSize: size, bold: true,
    color, align: "left", margin: 0,
  });
}
function kicker(slide, text, color = C.teal, x = 0.6, y = 0.42) {
  slide.addText(text.toUpperCase(), {
    x, y, w: PW - 2 * x, h: 0.3, fontFace: F.body, fontSize: 12, bold: true,
    color, charSpacing: 2, align: "left", margin: 0,
  });
}
function footer(slide, n) {
  slide.addText("BioPulse  ·  Predictive Biometric Analytics", {
    x: 0.6, y: PH - 0.42, w: 8, h: 0.3, fontFace: F.body, fontSize: 9,
    color: C.muted, align: "left", margin: 0,
  });
  slide.addText(String(n).padStart(2, "0"), {
    x: PW - 1.1, y: PH - 0.42, w: 0.6, h: 0.3, fontFace: F.body, fontSize: 9,
    color: C.muted, align: "right", margin: 0,
  });
}

// ============================================================
// SLIDE 1 — PORTADA
// ============================================================
{
  const s = pptx.addSlide();
  bg(s, C.bg);
  // logo mark
  iconCircle(s, 0.6, 0.6, 0.7, C.teal);
  s.addText("B", { x: 0.6, y: 0.6, w: 0.7, h: 0.7, fontFace: F.head, fontSize: 30, bold: true, color: C.bg, align: "center", valign: "middle", margin: 0 });
  s.addText("BioPulse", { x: 1.45, y: 0.6, w: 5, h: 0.7, fontFace: F.head, fontSize: 26, bold: true, color: C.text, align: "left", valign: "middle", margin: 0 });

  s.addText("De los datos del wearable a una\nalerta temprana de riesgo de salud", {
    x: 0.6, y: 2.5, w: 11, h: 1.8, fontFace: F.head, fontSize: 44, bold: true,
    color: C.text, align: "left", lineSpacingMultiple: 1.05, margin: 0,
  });
  s.addText("Plataforma de analitica biometrica predictiva para la prevencion de caidas,\nfatiga del sistema nervioso y procesos infecciosos en adultos mayores.", {
    x: 0.6, y: 4.4, w: 11, h: 1.0, fontFace: F.body, fontSize: 16, color: C.muted,
    align: "left", lineSpacingMultiple: 1.15, margin: 0,
  });

  // pill
  s.addShape(pptx.ShapeType.roundRect, { x: 0.6, y: 5.7, w: 4.6, h: 0.55, rectRadius: 0.27, fill: { color: C.card }, line: { color: C.teal, width: 1 } });
  s.addText("PITCH DECK  ·  SERIE SEMILLA  ·  MVP EN VIVO", {
    x: 0.6, y: 5.7, w: 4.6, h: 0.55, fontFace: F.body, fontSize: 11, bold: true, color: C.teal, align: "center", valign: "middle", margin: 0, charSpacing: 1,
  });
  s.addText("Emilio Cardona  ·  Miguel Vasquez  ·  Lucas Velez", {
    x: 0.6, y: 6.5, w: 11, h: 0.4, fontFace: F.body, fontSize: 12, color: C.muted, align: "left", margin: 0,
  });
}

// ============================================================
// SLIDE 2 — EL PROBLEMA
// ============================================================
{
  const s = pptx.addSlide();
  bg(s, C.bg);
  kicker(s, "El problema");
  title(s, "Los wearables miden todo. Nadie te avisa a tiempo.");

  const stats = [
    { big: "100k+", lab: "registros diarios por usuario en un\nFitbit o Whoop (HRV, sueno, pasos…)", c: C.teal },
    { big: "~0%", lab: "de esa señal se traduce en una\nalerta temprana acciónable", c: C.amber },
    { big: "1 de 4", lab: "adultos mayores sufre una caida\npor año; muchas son prevenibles", c: C.rose },
  ];
  const cw = 3.7, gap = 0.45, x0 = 0.6, y0 = 2.1, ch = 2.6;
  stats.forEach((st, i) => {
    const x = x0 + i * (cw + gap);
    card(s, x, y0, cw, ch);
    s.addText(st.big, { x: x + 0.3, y: y0 + 0.45, w: cw - 0.6, h: 1.1, fontFace: F.head, fontSize: 52, bold: true, color: st.c, align: "left", margin: 0 });
    s.addText(st.lab, { x: x + 0.3, y: y0 + 1.6, w: cw - 0.6, h: 0.9, fontFace: F.body, fontSize: 13, color: C.muted, align: "left", lineSpacingMultiple: 1.1, margin: 0 });
  });

  s.addText("Las empresas de hardware se quedan en promedios estaticos. Nosotros modelamos los patrones no lineales que anteceden un deterioro.", {
    x: 0.6, y: 5.1, w: 12.1, h: 0.8, fontFace: F.body, fontSize: 15, italic: true, color: C.text, align: "left", lineSpacingMultiple: 1.15, margin: 0,
  });
  footer(s, 2);
}

// ============================================================
// SLIDE 3 — LA SOLUCIÓN / MVP
// ============================================================
{
  const s = pptx.addSlide();
  bg(s, C.bg);
  kicker(s, "La solución");
  title(s, "BioPulse: un indice de riesgo predictivo en tu telefono");

  // Left text
  s.addText(
    "Combinamos tres motores de señal sobre tus propios datos de wearable y entregamos un unico Indice de Riesgo (0-100) con alertas explicables, no una caja negra.",
    { x: 0.6, y: 1.9, w: 5.6, h: 1.6, fontFace: F.body, fontSize: 16, color: C.text, align: "left", lineSpacingMultiple: 1.2, margin: 0 }
  );
  const pts = [
    "Control estadistico (z-score) vs. tu linea base de 7 dias",
    "Entropia aproximada (ApEn): pierde tu cuerpo su adaptabilidad",
    "Random Forest entrenado con 100k registros de wearable",
  ];
  pts.forEach((p, i) => {
    const y = 3.7 + i * 0.85;
    iconCircle(s, 0.6, y, 0.32, C.teal);
    s.addText(p, { x: 1.1, y: y - 0.05, w: 5.0, h: 0.7, fontFace: F.body, fontSize: 13.5, color: C.text, align: "left", valign: "middle", lineSpacingMultiple: 1.05, margin: 0 });
  });

  // Right: app mock panel
  card(s, 6.7, 1.9, 6.0, 4.8, C.cardAlt, C.border);
  iconCircle(s, 7.0, 2.25, 0.5, C.teal);
  s.addText("B", { x: 7.0, y: 2.25, w: 0.5, h: 0.5, fontFace: F.head, fontSize: 20, bold: true, color: C.bg, align: "center", valign: "middle", margin: 0 });
  s.addText("BioPulse", { x: 7.65, y: 2.25, w: 3, h: 0.5, fontFace: F.head, fontSize: 18, bold: true, color: C.text, valign: "middle", margin: 0 });
  // gauge mock
  s.addShape(pptx.ShapeType.ellipse, { x: 8.7, y: 3.2, w: 2.0, h: 2.0, fill: { type: "none" }, line: { color: C.borderSoft, width: 10 } });
  s.addShape(pptx.ShapeType.ellipse, { x: 8.7, y: 3.2, w: 2.0, h: 2.0, fill: { type: "none" }, line: { color: C.amber, width: 10 }, lineTail: 70, lineHead: 0 });
  s.addText("46", { x: 8.7, y: 3.85, w: 2.0, h: 0.9, fontFace: F.head, fontSize: 40, bold: true, color: C.text, align: "center", margin: 0 });
  s.addText("RIESGO MODERADO", { x: 7.2, y: 5.45, w: 5.0, h: 0.4, fontFace: F.body, fontSize: 12, bold: true, color: C.amber, align: "center", charSpacing: 1, margin: 0 });
  s.addText("Detectamos señales fuera de tu rango habitual en los ultimos dias.", { x: 7.2, y: 5.85, w: 5.0, h: 0.6, fontFace: F.body, fontSize: 11, color: C.muted, align: "center", lineSpacingMultiple: 1.1, margin: 0 });
  footer(s, 3);
}

// ============================================================
// SLIDE 4 — ARQUITECTURA DEL PIPELINE
// ============================================================
{
  const s = pptx.addSlide();
  bg(s, C.bg);
  kicker(s, "Arquitectura");
  title(s, "Tres motores, una sola señal combinada");

  const engines = [
    { n: "01", t: "Control Estadistico", d: "Z-score de cada metrica vs. tu propia linea base movil de 7 dias. Detecta anomalías reales, no ruido.", c: C.teal },
    { n: "02", t: "ApEn — Complejidad", d: "Entropia aproximada de HRV/RHR en ventana de 14 dias. Senal temprana de perdida de adaptabilidad.", c: C.purple },
    { n: "03", t: "Random Forest", d: "Modelo de arboles sobre 100k registros. Aprende la importancia de cada variable biometrica.", c: C.amber },
  ];
  const cw = 3.7, gap = 0.45, x0 = 0.6, y0 = 1.9, ch = 2.7;
  engines.forEach((e, i) => {
    const x = x0 + i * (cw + gap);
    card(s, x, y0, cw, ch);
    iconCircle(s, x + 0.3, y0 + 0.3, 0.6, e.c);
    s.addText(e.n, { x: x + 0.3, y: y0 + 0.3, w: 0.6, h: 0.6, fontFace: F.head, fontSize: 18, bold: true, color: C.bg, align: "center", valign: "middle", margin: 0 });
    s.addText(e.t, { x: x + 1.05, y: y0 + 0.32, w: cw - 1.3, h: 0.6, fontFace: F.head, fontSize: 15, bold: true, color: C.text, valign: "middle", margin: 0 });
    s.addText(e.d, { x: x + 0.3, y: y0 + 1.15, w: cw - 0.6, h: 1.4, fontFace: F.body, fontSize: 12.5, color: C.muted, align: "left", lineSpacingMultiple: 1.15, margin: 0 });
  });

  // combine arrow + risk index
  s.addShape(pptx.ShapeType.rightArrow, { x: 5.6, y: 5.0, w: 2.1, h: 0.5, fill: { color: C.border }, line: { type: "none" } });
  card(s, 4.0, 5.0, 1.6, 1.3, C.card, C.teal);
  s.addText("+", { x: 4.0, y: 5.0, w: 1.6, h: 1.3, fontFace: F.head, fontSize: 30, bold: true, color: C.teal, align: "center", valign: "middle", margin: 0 });
  card(s, 7.7, 4.7, 5.0, 1.9, C.cardAlt, C.teal);
  s.addText([
    { text: "INDICE DE RIESGO PREDICTIVO", options: { fontFace: F.body, fontSize: 12, bold: true, color: C.teal, charSpacing: 1, breakLine: true } },
    { text: "Cada motor aporta hasta 25 puntos. El total (0-100) define el nivel BAJO / MODERADO / ALTO y dispara alertas explicables.", options: { fontFace: F.body, fontSize: 13, color: C.text, lineSpacingMultiple: 1.15 } },
  ], { x: 7.95, y: 4.9, w: 4.5, h: 1.5, align: "left", margin: 0, valign: "middle" });
  footer(s, 4);
}

// ============================================================
// SLIDE 5 — MODELO 1: CONTROL ESTADISTICO
// ============================================================
{
  const s = pptx.addSlide();
  bg(s, C.bg);
  kicker(s, "Modelo 01 · Control estadistico", C.teal);
  title(s, "Z-score: tu propia linea base, no la de otro");

  s.addText(
    "Para cada dia calculamos el z-score de 6 metricas (HRV, RHR, recuperación, freq. respiratoria, temp. de piel, ef. de sueno) contra una ventana movil de 7 dias. Un |z| > 2 es una anomalía.",
    { x: 0.6, y: 1.85, w: 6.0, h: 1.7, fontFace: F.body, fontSize: 15, color: C.text, align: "left", lineSpacingMultiple: 1.2, margin: 0 }
  );
  // Bloque "En palabras simples" (mirada de cientifico de datos)
  card(s, 0.6, 3.55, 6.0, 1.0, C.cardAlt, C.teal);
  s.addText([
    { text: "EN PALABRAS SIMPLES  ·  ", options: { fontFace: F.body, fontSize: 10.5, bold: true, color: C.teal, charSpacing: 1 } },
    { text: "Es como medir tu estatura contra tu propio promedio de los ultimos 7 dias. Si siempre mides 1.70 y hoy mides 1.95, algo raro paso. No comparamos contigo mismo hace un ano, sino con tu 'yo normal' reciente.", options: { fontFace: F.body, fontSize: 11.5, color: C.text, lineSpacingMultiple: 1.1 } },
  ], { x: 0.85, y: 3.62, w: 5.5, h: 0.9, align: "left", valign: "middle", margin: 0 });
  const bullets = [
    "Basado en tu historial: se adapta a tu fisiologia unica",
    "No necesita datos etiquetados para detectar desviaciones",
    "Explicable: muestra exactamente que metrica se salio del rango",
    "Aporta hasta 25 puntos al indice cuando hay >=2 anomalías",
  ];
  bullets.forEach((b, i) => {
    const y = 4.75 + i * 0.6;
    iconCircle(s, 0.6, y, 0.26, C.teal);
    s.addText(b, { x: 1.05, y: y - 0.05, w: 5.6, h: 0.6, fontFace: F.body, fontSize: 13, color: C.text, valign: "middle", align: "left", margin: 0 });
  });

  // right: z-score bars mock
  card(s, 7.0, 1.9, 5.7, 4.7, C.cardAlt, C.border);
  s.addText("Ejemplo · z-score de hoy", { x: 7.3, y: 2.1, w: 5, h: 0.4, fontFace: F.body, fontSize: 12, bold: true, color: C.muted, margin: 0 });
  const zs = [
    { m: "HRV", v: -2.4 }, { m: "RHR", v: 1.1 }, { m: "Recuper.", v: -1.8 },
    { m: "Resp.", v: 0.6 }, { m: "Temp. piel", v: 2.3 }, { m: "Ef. sueno", v: -0.4 },
  ];
  const midX = 9.45, barW = 2.6, yTop = 2.7, rowH = 0.62;
  s.addShape(pptx.ShapeType.line, { x: midX, y: yTop - 0.1, w: 0, h: rowH * zs.length, line: { color: C.borderSoft, width: 1 } });
  zs.forEach((z, i) => {
    const y = yTop + i * rowH;
    s.addText(z.m, { x: 7.3, y, w: 1.9, h: 0.4, fontFace: F.body, fontSize: 11, color: C.muted, valign: "middle", margin: 0 });
    const flagged = Math.abs(z.v) > 2;
    const len = (Math.abs(z.v) / 3) * (barW / 2);
    const col = flagged ? C.rose : C.teal;
    if (z.v < 0) s.addShape(pptx.ShapeType.rect, { x: midX - len, y: y + 0.12, w: len, h: 0.22, fill: { color: col }, line: { type: "none" } });
    else s.addShape(pptx.ShapeType.rect, { x: midX, y: y + 0.12, w: len, h: 0.22, fill: { color: col }, line: { type: "none" } });
    s.addText((z.v > 0 ? "+" : "") + z.v, { x: midX + (z.v >= 0 ? len + 0.05 : -len - 0.7), y, w: 0.7, h: 0.4, fontFace: F.body, fontSize: 11, bold: true, color: flagged ? C.rose : C.muted, valign: "middle", align: "left", margin: 0 });
  });
  s.addText("Temp. piel y HRV fuera de rango (|z|>2) → anomalía real, no ruido.", { x: 7.3, y: 6.05, w: 5.1, h: 0.5, fontFace: F.body, fontSize: 10.5, italic: true, color: C.muted, margin: 0 });
  footer(s, 5);
}

// ============================================================
// SLIDE 6 — MODELO 2: ApEn
// ============================================================
{
  const s = pptx.addSlide();
  bg(s, C.bg);
  kicker(s, "Modelo 02 · Complejidad fisiologica", C.purple);
  title(s, "ApEn: cuando el ritmo se vuelve rigido, algo pasa");

  s.addText(
    "La Entropia Aproximada mide la complejidad de la serie de HRV/RHR en una ventana movil de 14 dias. Un cuerpo sano es variable y adaptativo; una caida de ApEn señala rigidez del sistema nervioso autotono — una señal temprana que los promedios simples no ven.",
    { x: 0.6, y: 1.85, w: 6.1, h: 2.2, fontFace: F.body, fontSize: 15, color: C.text, align: "left", lineSpacingMultiple: 1.2, margin: 0 }
  );
  // Bloque "En palabras simples"
  card(s, 0.6, 4.05, 6.0, 1.0, C.cardAlt, C.purple);
  s.addText([
    { text: "EN PALABRAS SIMPLES  ·  ", options: { fontFace: F.body, fontSize: 10.5, bold: true, color: C.purple, charSpacing: 1 } },
    { text: "Un cuerpo sano es como una conversacion variada: responde distinto cada dia. Cuando tus latidos se vuelven siempre iguales y 'roboticos', es que el sistema perdio flexibilidad. Eso es justo lo que la entropia mide: cuanta variedad hay en tu ritmo.", options: { fontFace: F.body, fontSize: 11.5, color: C.text, lineSpacingMultiple: 1.1 } },
  ], { x: 0.85, y: 4.12, w: 5.5, h: 0.9, align: "left", valign: "middle", margin: 0 });
  const pts = [
    "Captura no-linealidad: algo que la regresion y las medias ignoran",
    "Ventana de 14 dias → necesita al menos 2 semanas de datos",
    "Aporta hasta 25 puntos cuando la complejidad cae vs. tu propio promedio",
  ];
  pts.forEach((p, i) => {
    const y = 5.2 + i * 0.62;
    iconCircle(s, 0.6, y, 0.26, C.purple);
    s.addText(p, { x: 1.05, y: y - 0.05, w: 5.6, h: 0.65, fontFace: F.body, fontSize: 13, color: C.text, valign: "middle", align: "left", margin: 0 });
  });

  // right ribbon mock
  card(s, 7.0, 1.9, 5.7, 4.7, C.cardAlt, C.border);
  s.addText("ApEn de HRV a lo largo del tiempo", { x: 7.3, y: 2.1, w: 5, h: 0.4, fontFace: F.body, fontSize: 12, bold: true, color: C.muted, margin: 0 });
  // simple polyline of decreasing complexity
  const pts2 = [];
  const x0 = 7.4, x1 = 12.4, yBase = 6.2, yTop = 2.6;
  for (let i = 0; i <= 20; i++) {
    const t = i / 20;
    const noise = Math.sin(i * 1.3) * (1 - t) * 0.4 + (Math.random() - 0.5) * 0.15;
    const y = yBase - t * (yBase - yTop) + noise * 0.6;
    pts2.push(`${x0 + t * (x1 - x0)},${y.toFixed(2)}`);
  }
  s.addShape(pptx.ShapeType.line, { x: x0, y: yTop, w: x1 - x0, h: yBase - yTop, line: { color: C.borderSoft, width: 1, dashType: "dash" } });
  s.addShape(pptx.ShapeType.line, { x: x0, y: yTop, w: x1 - x0, h: yBase - yTop, line: { color: C.purple, width: 2.5 }, flipV: false });
  s.addText("HRV mas rigido (menor ApEn) en las ultimas semanas → perdida de adaptabilidad.", { x: 7.3, y: 6.05, w: 5.1, h: 0.5, fontFace: F.body, fontSize: 10.5, italic: true, color: C.muted, margin: 0 });
  footer(s, 6);
}

// ============================================================
// SLIDE 7 — MODELO 3: RANDOM FOREST
// ============================================================
{
  const s = pptx.addSlide();
  bg(s, C.bg);
  kicker(s, "Modelo 03 · Machine Learning", C.amber);
  title(s, "Random Forest: aprende que variable importa");

  s.addText(
    "Entrenamos un Random Forest (150 arboles, balanced) sobre 100k registros de wearable. No solo predice: nos dice que variables son mas predictivas, validando la intuicion clinica.",
    { x: 0.6, y: 1.85, w: 5.4, h: 1.6, fontFace: F.body, fontSize: 15, color: C.text, align: "left", lineSpacingMultiple: 1.2, margin: 0 }
  );
  // Bloque "En palabras simples"
  card(s, 0.6, 3.55, 5.4, 1.05, C.cardAlt, C.amber);
  s.addText([
    { text: "EN PALABRAS SIMPLES  ·  ", options: { fontFace: F.body, fontSize: 10.5, bold: true, color: C.amber, charSpacing: 1 } },
    { text: "Es como preguntar a 150 expertos (cada 'arbol' mira solo unas pocas variables) y votar en grupo. Como ninguno ve todo, entre todos no se dejan enganar por el ruido ni por una casualidad. Y al votar, nos dicen cuales variables pesaron mas.", options: { fontFace: F.body, fontSize: 11.5, color: C.text, lineSpacingMultiple: 1.1 } },
  ], { x: 0.82, y: 3.62, w: 5.0, h: 0.95, align: "left", valign: "middle", margin: 0 });
  const pts = [
    "ROC-AUC 0.69 en el set de produccion",
    "Bagging de arboles: robusto y estable",
    "Explicable via importancia de variables (Gini)",
  ];
  pts.forEach((p, i) => {
    const y = 4.8 + i * 0.62;
    iconCircle(s, 0.6, y, 0.26, C.amber);
    s.addText(p, { x: 1.05, y: y - 0.05, w: 5.0, h: 0.6, fontFace: F.body, fontSize: 13, color: C.text, valign: "middle", align: "left", margin: 0 });
  });

  // image real de feature importance
  s.addImage({ path: path.join(FILES, "feature_importance_rf.png"), x: 6.4, y: 1.95, w: 6.4, h: 4.4 });
  footer(s, 7);
}

// ============================================================
// SLIDE 8 — POR QUE 3 ALGORITMOS
// ============================================================
{
  const s = pptx.addSlide();
  bg(s, C.bg);
  kicker(s, "Rigor tecnico");
  title(s, "No elegimos RF a ciegas: comparamos 3 algoritmos");

  const rows = [
    { m: "Regresion Logistica", rol: "Baseline lineal", auc: "0.65", note: "Confirma que el problema NO es lineal", c: C.purple },
    { m: "Random Forest", rol: "Elegido (produccion)", auc: "0.66", note: "Mejor recall: no deja pasar riesgo real", c: C.teal },
    { m: "Gradient Boosting", rol: "Alternativa boosting", auc: "0.69", note: "Gana en AUC pero pierde recall (0.25)", c: C.amber },
  ];
  const x0 = 0.6, y0 = 2.0, rh = 1.25, cw = 12.1;
  rows.forEach((r, i) => {
    const y = y0 + i * (rh + 0.15);
    card(s, x0, y, cw, rh, i === 1 ? C.cardAlt : C.card, i === 1 ? C.teal : C.border);
    iconCircle(s, x0 + 0.3, y + 0.32, 0.6, r.c);
    s.addText(r.m, { x: x0 + 1.1, y: y + 0.2, w: 3.4, h: 0.5, fontFace: F.head, fontSize: 16, bold: true, color: C.text, valign: "middle", margin: 0 });
    s.addText(r.rol.toUpperCase(), { x: x0 + 1.1, y: y + 0.7, w: 3.4, h: 0.4, fontFace: F.body, fontSize: 11, bold: true, color: r.c, charSpacing: 1, margin: 0 });
    s.addText("ROC-AUC", { x: x0 + 4.7, y: y + 0.2, w: 1.2, h: 0.35, fontFace: F.body, fontSize: 11, color: C.muted, margin: 0 });
    s.addText(r.auc, { x: x0 + 4.7, y: y + 0.5, w: 1.4, h: 0.6, fontFace: F.head, fontSize: 26, bold: true, color: C.text, margin: 0 });
    s.addText(r.note, { x: x0 + 6.4, y: y + 0.2, w: 5.4, h: 0.9, fontFace: F.body, fontSize: 13, color: C.muted, valign: "middle", align: "left", lineSpacingMultiple: 1.1, margin: 0 });
  });
  s.addText([
    { text: "EN PALABRAS SIMPLES  ·  ", options: { fontFace: F.body, fontSize: 11, bold: true, color: C.teal, charSpacing: 1 } },
    { text: "El 'recall' es cuantas de las personas REALMENTE en riesgo logramos detectar. En salud, que se nos escape un caso (falso negativo) es peor que una alarma innecesaria (falso positivo). Por eso elegimos el modelo que detecta mas riesgo real, aunque a veces avise de mas.", options: { fontFace: F.body, fontSize: 12, italic: true, color: C.text, lineSpacingMultiple: 1.1 } },
  ], {
    x: 0.6, y: 6.15, w: 12.1, h: 0.6, fontFace: F.body, align: "left", margin: 0,
  });
  footer(s, 8);
}

// ============================================================
// SLIDE 9 — ROC
// ============================================================
{
  const s = pptx.addSlide();
  bg(s, C.bg);
  kicker(s, "Validación · Curvas ROC", C.teal);
  title(s, "Capacidad discriminativa real (test 80/20, n=100k)");
  s.addImage({ path: path.join(FILES, "roc_control_estadistico.png"), x: 0.8, y: 1.95, w: 6.6, h: 4.6 });
  card(s, 7.8, 1.95, 4.9, 4.6, C.cardAlt, C.border);
  s.addText([
    { text: "AUC por motor (dataset real Whoop 100k)", options: { fontFace: F.body, fontSize: 12.5, bold: true, color: C.teal, breakLine: true, charSpacing: 1 } },
    { text: "• Control estadístico: 0.994", options: { fontFace: F.body, fontSize: 13, color: C.text, breakLine: true, lineSpacingMultiple: 1.15 } },
    { text: "• Patrón agudo: 0.995", options: { fontFace: F.body, fontSize: 13, color: C.text, breakLine: true, lineSpacingMultiple: 1.15 } },
    { text: "• Proceso infeccioso: 1.000*", options: { fontFace: F.body, fontSize: 13, color: C.amber, breakLine: true, lineSpacingMultiple: 1.15 } },
    { text: "*El flag de infección se deriva de temp. y respiración; el modelo lo aprende casi determinísticamente (ver nota slide 11).", options: { fontFace: F.body, fontSize: 10.5, italic: true, color: C.muted, breakLine: true, lineSpacingMultiple: 1.1 } },
    { text: "Método: Random Forest (120 árboles), 13 features fisiológicas, split 80/20 estratificado.", options: { fontFace: F.body, fontSize: 11, color: C.muted, lineSpacingMultiple: 1.1 } },
  ], { x: 8.05, y: 2.2, w: 4.4, h: 4.0, align: "left", valign: "top", margin: 0 });
  footer(s, 9);
}

// ============================================================
// SLIDE 10 — 5-FOLD CV
// ============================================================
{
  const s = pptx.addSlide();
  bg(s, C.bg);
  kicker(s, "Validación · Cross-validation", C.teal);
  title(s, "No un solo split: 5-fold estratificada real (n=100k)");

  const cv = [
    { t: "Control estadístico", auc: "0.994", sd: "0.000", c: C.teal },
    { t: "Patrón agudo", auc: "0.993", sd: "0.001", c: C.purple },
    { t: "Proceso infeccioso", auc: "1.000", sd: "0.000", c: C.amber },
  ];
  cv.forEach((m, i) => {
    const x = 0.8 + i * 4.0;
    card(s, x, 2.1, 3.8, 2.6, C.card, C.border);
    s.addText(m.t, { x: x + 0.2, y: 2.25, w: 3.4, h: 0.7, fontFace: F.head, fontSize: 14, bold: true, color: C.text, align: "left", margin: 0 });
    s.addText(m.auc, { x: x + 0.2, y: 2.95, w: 3.4, h: 0.9, fontFace: F.head, fontSize: 38, bold: true, color: m.c, align: "left", margin: 0 });
    s.addText(`AUC medio ± desv. (5 folds): ${m.sd}`, { x: x + 0.2, y: 3.95, w: 3.4, h: 0.6, fontFace: F.body, fontSize: 11, color: C.muted, align: "left", margin: 0 });
  });

  card(s, 0.8, 5.0, 11.9, 1.6, C.cardAlt, C.border);
  s.addText([
    { text: "Por que importa  ·  ", options: { fontFace: F.body, fontSize: 12, bold: true, color: C.teal, charSpacing: 1, breakLine: false } },
    { text: "La desviación estándar entre los 5 folds es ~0.000-0.001: los números son estables, no suerte de un split. Entrenamos sobre 100,000 filas reales de Whoop; las prevalencias son bajas (0.36%-17.2%), por eso el AUC (no la accuracy) es la métrica honesta.", options: { fontFace: F.body, fontSize: 12.5, color: C.text, lineSpacingMultiple: 1.15 } },
  ], { x: 1.0, y: 5.15, w: 11.5, h: 1.3, align: "left", valign: "middle", margin: 0 });
  footer(s, 10);
}

// ============================================================
// SLIDE 11 — MATRIZ DE CONFUSION (honestidad)
// ============================================================
{
  const s = pptx.addSlide();
  bg(s, C.bg);
  kicker(s, "Validación · Honestidad", C.rose);
  title(s, "Matriz de confusion: somos transparentes");

  s.addImage({ path: path.join(FILES, "confusion_control_estadistico.png"), x: 0.8, y: 2.0, w: 5.0, h: 3.8 });

  // callout numbers (hold-out 20% del motor control estadistico)
  const data = [
    { v: "15,631", l: "Negativos bien clasificados (TN)", c: C.teal },
    { v: "925", l: "Falsas alarmas (FP)", c: C.amber },
    { v: "75", l: "Riesgo NO detectado (FN)", c: C.rose },
    { v: "3,369", l: "Riesgo detectado (TP)", c: C.teal },
  ];
  const x0 = 6.6, y0 = 2.0, cw = 6.1, ch = 0.82, gap = 0.14;
  data.forEach((d, i) => {
    const y = y0 + i * (ch + gap);
    card(s, x0, y, cw, ch, C.cardAlt, C.border);
    s.addText(d.v, { x: x0 + 0.25, y, w: 1.7, h: ch, fontFace: F.head, fontSize: 26, bold: true, color: d.c, valign: "middle", align: "left", margin: 0 });
    s.addText(d.l, { x: x0 + 2.0, y, w: cw - 2.2, h: ch, fontFace: F.body, fontSize: 12.5, color: C.text, valign: "middle", align: "left", margin: 0 });
  });
  s.addText([
    { text: "Nota de honestidad  ·  ", options: { fontFace: F.body, fontSize: 11, bold: true, color: C.amber, breakLine: false } },
    { text: "El motor de proceso infeccioso alcanza AUC 1.000 porque su etiqueta se deriva de temperatura y respiración (casi determinista). No es 'predicción aprendida', es una regla clínica; lo declaramos así. Los motores de control y patrón agudo sí son aprendizaje real (AUC 0.99).", options: { fontFace: F.body, fontSize: 11, color: C.muted, lineSpacingMultiple: 1.1 } },
  ], { x: 6.6, y: 5.75, w: 6.1, h: 1.0, align: "left", valign: "top", margin: 0 });
  footer(s, 11);
}

// ============================================================
// SLIDE 12 — EL INDICE DE RIESGO
// ============================================================
{
  const s = pptx.addSlide();
  bg(s, C.bg);
  kicker(s, "El producto");
  title(s, "El Indice de Riesgo: 4 señales, 100 puntos");

  const contrib = [
    { t: "Control estadistico", d: "Anomalías z-score vs. tu base", c: C.teal, x: 0.6 },
    { t: "ApEn complejidad", d: "Caida de variabilidad HRV/RHR", c: C.purple, x: 3.55 },
    { t: "Patron agudo", d: "Recup. + HRV bajos, RHR alto", c: C.amber, x: 6.5 },
    { t: "Proceso infeccioso", d: "Temp. y resp. elevadas", c: C.rose, x: 9.45 },
  ];
  contrib.forEach((c) => {
    card(s, c.x, 2.1, 2.95, 2.4, C.card, C.border);
    iconCircle(s, c.x + 0.3, 2.4, 0.55, c.c);
    s.addText("+25", { x: c.x + 0.3, y: 2.4, w: 0.55, h: 0.55, fontFace: F.head, fontSize: 14, bold: true, color: C.bg, align: "center", valign: "middle", margin: 0 });
    s.addText(c.t, { x: c.x + 0.3, y: 3.1, w: 2.4, h: 0.6, fontFace: F.head, fontSize: 14, bold: true, color: C.text, align: "left", margin: 0 });
    s.addText(c.d, { x: c.x + 0.3, y: 3.7, w: 2.4, h: 0.7, fontFace: F.body, fontSize: 11.5, color: C.muted, align: "left", lineSpacingMultiple: 1.1, margin: 0 });
  });

  // gauge summary
  card(s, 0.6, 4.9, 12.1, 1.6, C.cardAlt, C.teal);
  s.addText([
    { text: "NIVEL = ", options: { fontFace: F.body, fontSize: 14, color: C.muted, breakLine: false } },
    { text: "BAJO (0-29)  ·  MODERADO (30-59)  ·  ALTO (60+)", options: { fontFace: F.head, fontSize: 16, bold: true, color: C.text, breakLine: true } },
    { text: "Cada motor suma hasta 25 puntos. El total dispara una alerta con la causa exacta (no una caja negra) — listo para mostrar en la app y en el panel medico.", options: { fontFace: F.body, fontSize: 13, color: C.muted, lineSpacingMultiple: 1.15 } },
  ], { x: 0.9, y: 5.05, w: 11.5, h: 1.3, align: "left", valign: "middle", margin: 0 });
  footer(s, 12);
}

// ============================================================
// SLIDE 12B — EXPERIENCIA DE USUARIO (confort y control)
// ============================================================
{
  const s = pptx.addSlide();
  bg(s, C.bg);
  kicker(s, "El producto");
  title(s, "Pensado para el usuario: claridad, contexto y control");

  const feats = [
    { t: "Historial 7 / 14 / 30 días", d: "El usuario elige la ventana y la métrica (riesgo, HRV, RHR, recuperación...) y ve su evolución con su umbral marcado en la gráfica.", c: C.teal },
    { t: "Línea de tiempo de eventos", d: "Cada día con señal de alerta aparece con su fecha y su causa exacta (\"HRV 4 días bajo tu base\"), no solo un número.", c: C.purple },
    { t: "Alertas accionables + umbral propio", d: "El usuario define desde qué nivel de riesgo quiere ser alertado, y cada alerta llega con una recomendación concreta.", c: C.amber },
    { t: "Privacidad por diseño", d: "Todo se procesa y guarda en el dispositivo (localStorage). Nada viaja a un servidor, y el botón \"Borrar mis datos\" lo elimina todo.", c: C.rose },
  ];
  feats.forEach((f, i) => {
    const x = 0.6 + (i % 2) * 6.15;
    const y = 1.95 + Math.floor(i / 2) * 2.15;
    card(s, x, y, 5.85, 1.95, C.card, C.border);
    iconCircle(s, x + 0.3, y + 0.3, 0.45, f.c);
    s.addText(f.t, { x: x + 0.95, y: y + 0.25, w: 4.7, h: 0.55, fontFace: F.head, fontSize: 15, bold: true, color: C.text, align: "left", margin: 0 });
    s.addText(f.d, { x: x + 0.95, y: y + 0.8, w: 4.7, h: 1.05, fontFace: F.body, fontSize: 11.5, color: C.muted, align: "left", lineSpacingMultiple: 1.15, margin: 0 });
  });

  s.addText([
    { text: "POR QUÉ IMPORTA  ·  ", options: { fontFace: F.body, fontSize: 11, bold: true, color: C.teal, charSpacing: 1, breakLine: false } },
    { text: "Un modelo predictivo solo genera valor si el usuario lo entiende y confía en él. Estas funciones convierten el índice de riesgo en una herramienta diaria, y el feedback de uso alimenta el reentrenamiento del modelo (fase 6 del roadmap).", options: { fontFace: F.body, fontSize: 12.5, color: C.muted, lineSpacingMultiple: 1.15 } },
  ], { x: 0.6, y: 6.3, w: 12.1, h: 0.85, align: "left", valign: "top", margin: 0 });
  footer(s, 13);
}

// ============================================================
// SLIDE 13 — ROADMAP
// ============================================================
{
  const s = pptx.addSlide();
  bg(s, C.bg);
  kicker(s, "Roadmap");
  title(s, "De la idea al despliegue en la nube");

  const phases = [
    { n: "1-2", t: "Definicion y desarrollo", d: "Metricas y algoritmos", c: C.teal, done: true },
    { n: "3", t: "Pruebas con usuarios", d: "Datos de otros usuarios", c: C.teal, done: true },
    { n: "4", t: "MVP (HOY)", d: "App en vivo + 3 modelos", c: C.amber, done: true },
    { n: "5", t: "API Fitbit/Whoop", d: "Integracion directa", c: C.purple, done: false },
    { n: "6", t: "Usuarios en vivo", d: "Mejorar recall con datos reales", c: C.purple, done: false },
    { n: "7-8", t: "Cambios y nube", d: "Despliegue produccion", c: C.rose, done: false },
  ];
  const cw = 1.9, gap = 0.16, x0 = 0.6, y0 = 2.3, ch = 3.0;
  phases.forEach((p, i) => {
    const x = x0 + i * (cw + gap);
    card(s, x, y0, cw, ch, p.done ? C.cardAlt : C.card, p.done ? C.teal : C.border);
    iconCircle(s, x + cw / 2 - 0.3, y0 + 0.3, 0.6, p.c);
    s.addText(p.n, { x: x + cw / 2 - 0.3, y: y0 + 0.3, w: 0.6, h: 0.6, fontFace: F.head, fontSize: 15, bold: true, color: C.bg, align: "center", valign: "middle", margin: 0 });
    s.addText(p.t, { x: x + 0.15, y: y0 + 1.1, w: cw - 0.3, h: 0.8, fontFace: F.head, fontSize: 13, bold: true, color: C.text, align: "center", valign: "top", margin: 0 });
    s.addText(p.d, { x: x + 0.15, y: y0 + 1.9, w: cw - 0.3, h: 0.9, fontFace: F.body, fontSize: 11, color: C.muted, align: "center", lineSpacingMultiple: 1.1, margin: 0 });
  });
  s.addText("Estamos en la Fase 4: el MVP funciona y los modelos estan validados. Buscamos capital para acelerar Fases 5-8.", {
    x: 0.6, y: 5.7, w: 12.1, h: 0.7, fontFace: F.body, fontSize: 14, italic: true, color: C.teal, align: "left", lineSpacingMultiple: 1.15, margin: 0,
  });
  footer(s, 14);
}

// ============================================================
// SLIDE 14 — THE ASK
// ============================================================
{
  const s = pptx.addSlide();
  bg(s, C.bg);
  kicker(s, "La inversion", C.teal);
  title(s, "Lo que buscamos y para que");

  const asks = [
    { big: "$X", lab: "Ronda Serie Semilla", c: C.teal },
    { big: "Fase 5-8", lab: "Integracion API + datos en vivo + nube", c: C.amber },
    { big: "75+", lab: "Cobertura de adultos mayores que hoy excluimos del dataset", c: C.rose },
  ];
  const cw = 3.7, gap = 0.45, x0 = 0.6, y0 = 2.0, ch = 2.3;
  asks.forEach((a, i) => {
    const x = x0 + i * (cw + gap);
    card(s, x, y0, cw, ch, C.cardAlt, a.c);
    s.addText(a.big, { x: x + 0.3, y: y0 + 0.35, w: cw - 0.6, h: 1.0, fontFace: F.head, fontSize: 40, bold: true, color: a.c, align: "left", margin: 0 });
    s.addText(a.lab, { x: x + 0.3, y: y0 + 1.4, w: cw - 0.6, h: 0.8, fontFace: F.body, fontSize: 13, color: C.text, align: "left", lineSpacingMultiple: 1.15, margin: 0 });
  });

  card(s, 0.6, 4.6, 12.1, 1.9, C.card, C.teal);
  s.addText([
    { text: "Nuestra ventaja", options: { fontFace: F.body, fontSize: 13, bold: true, color: C.teal, breakLine: true, charSpacing: 1 } },
    { text: "Modelo explicables (no caja negra) + validación tecnica rigurosa (3 algoritmos, 5-fold CV, ROC, matriz de confusion) + un MVP ya funcionando sobre datos reales de wearable. El mercado de wearables crece; la capa de inteligencia predictiva de salud es el cuello de botella que resolvemos.", options: { fontFace: F.body, fontSize: 14, color: C.text, lineSpacingMultiple: 1.2 } },
  ], { x: 0.9, y: 4.75, w: 11.5, h: 1.6, align: "left", valign: "middle", margin: 0 });

  s.addText("BioPulse  ·  Predictive Biometric Analytics  ·  gracias", {
    x: 0.6, y: 6.7, w: 12, h: 0.4, fontFace: F.head, fontSize: 14, bold: true, color: C.muted, align: "center", margin: 0,
  });
}

// ---------- write ----------
const out = "C:/Users/ecard/Desktop/BIOPULSE PROYECTO CIENCIA DE DATOS/pitch/BioPulse_Pitch.pptx";
pptx.writeFile({ fileName: out }).then(() => {
  console.log("DECK WRITTEN:", out);
}).catch((e) => {
  console.error("ERROR:", e);
  process.exit(1);
});
