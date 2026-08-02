const pptxgen = require("pptxgenjs");
const path = require("path");

const FILES = path.join(__dirname, "..", "files");

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
function title(slide, text, color = C.text, size = 34, y = 1.0, x = 0.7) {
  slide.addText(text, {
    x, y, w: PW - 2 * x, h: 1.1, fontFace: F.head, fontSize: size, bold: true,
    color, align: "left", valign: "top", margin: 0, lineSpacingMultiple: 1.0,
  });
}
function kicker(slide, text, color = C.teal, x = 0.7, y = 0.5) {
  slide.addText(text.toUpperCase(), {
    x, y, w: PW - 2 * x, h: 0.3, fontFace: F.body, fontSize: 12, bold: true,
    color, charSpacing: 2, align: "left", margin: 0,
  });
}
function footer(slide, n) {
  slide.addText("BioPulse  ·  Predictive Biometric Analytics", {
    x: 0.7, y: PH - 0.42, w: 8, h: 0.3, fontFace: F.body, fontSize: 9,
    color: C.muted, align: "left", margin: 0,
  });
  slide.addText(String(n).padStart(2, "0"), {
    x: PW - 1.1, y: PH - 0.42, w: 0.6, h: 0.3, fontFace: F.body, fontSize: 9,
    color: C.muted, align: "right", margin: 0,
  });
}

// ============================================================
// SLIDE 1 — PORTADA / HOOK
// ============================================================
{
  const s = pptx.addSlide();
  bg(s, C.bg);
  // logo mark
  iconCircle(s, 0.7, 0.65, 0.7, C.teal);
  s.addText("B", { x: 0.7, y: 0.65, w: 0.7, h: 0.7, fontFace: F.head, fontSize: 30, bold: true, color: C.bg, align: "center", valign: "middle", margin: 0 });
  s.addText("BioPulse", { x: 1.55, y: 0.65, w: 5, h: 0.7, fontFace: F.head, fontSize: 26, bold: true, color: C.text, align: "left", valign: "middle", margin: 0 });

  s.addText([
    { text: "Tus wearables recogen ", options: { color: C.text } },
    { text: "100.000 datos al día.", options: { color: C.teal } },
    { text: "\nNinguno te salva la vida.", options: { color: C.rose } },
  ], {
    x: 0.7, y: 2.4, w: 11.8, h: 2.2, fontFace: F.head, fontSize: 50, bold: true,
    align: "left", lineSpacingMultiple: 1.05, margin: 0,
  });

  s.addText("Convertimos los datos de tu reloj inteligente en una alerta temprana que dice qué está pasando y qué hacer — antes de que sea tarde.", {
    x: 0.7, y: 4.9, w: 11.2, h: 1.0, fontFace: F.body, fontSize: 17, color: C.muted,
    align: "left", lineSpacingMultiple: 1.2, margin: 0,
  });

  // pill
  s.addShape(pptx.ShapeType.roundRect, { x: 0.7, y: 6.15, w: 4.9, h: 0.55, rectRadius: 0.27, fill: { color: C.card }, line: { color: C.teal, width: 1 } });
  s.addText("PITCH DECK  ·  SERIE SEMILLA  ·  MVP EN VIVO", {
    x: 0.7, y: 6.15, w: 4.9, h: 0.55, fontFace: F.body, fontSize: 11, bold: true, color: C.teal, align: "center", valign: "middle", margin: 0, charSpacing: 1,
  });
  s.addText("Emilio Cardona  ·  Miguel Vasquez  ·  Lucas Velez", {
    x: 0.7, y: 6.85, w: 11, h: 0.4, fontFace: F.body, fontSize: 12, color: C.muted, align: "left", margin: 0,
  });
}

// ============================================================
// SLIDE 2 — EL PROBLEMA (con rostro)
// ============================================================
{
  const s = pptx.addSlide();
  bg(s, C.bg);
  kicker(s, "El problema");
  title(s, "Los dispositivos lo ven todo. Nadie avisa a tiempo.");

  const stats = [
    { big: "100k+", lab: "datos diarios que tu wearable\ncaptura y deja sin usar", c: C.teal },
    { big: "1 de 4", lab: "adultos mayores sufre una\ncaída al año; muchas se previenen", c: C.rose },
    { big: "~0%", lab: "de esa señal se vuelve una\nalerta accionable a tiempo", c: C.amber },
  ];
  const cw = 3.8, gap = 0.4, x0 = 0.7, y0 = 2.0, ch = 2.5;
  stats.forEach((st, i) => {
    const x = x0 + i * (cw + gap);
    card(s, x, y0, cw, ch);
    s.addText(st.big, { x: x + 0.3, y: y0 + 0.35, w: cw - 0.6, h: 1.1, fontFace: F.head, fontSize: 54, bold: true, color: st.c, align: "left", margin: 0 });
    s.addText(st.lab, { x: x + 0.3, y: y0 + 1.5, w: cw - 0.6, h: 0.9, fontFace: F.body, fontSize: 13.5, color: C.muted, align: "left", lineSpacingMultiple: 1.1, margin: 0 });
  });

  s.addText("Una infección, una caída o el agotamiento del sistema nervioso no aparecen de la noche a la mañana. Dejan señales semanas antes. Hoy esas señales se pierden en un mar de promedios.", {
    x: 0.7, y: 4.95, w: 12.1, h: 1.2, fontFace: F.body, fontSize: 16, italic: true, color: C.text, align: "left", lineSpacingMultiple: 1.2, margin: 0,
  });
  footer(s, 2);
}

// ============================================================
// SLIDE 3 — LA SOLUCIÓN EN UNA FRASE
// ============================================================
{
  const s = pptx.addSlide();
  bg(s, C.bg);
  kicker(s, "La solución");
  title(s, "BioPulse: un número que entiendes,\nuna acción que puedes tomar.");

  // big statement block
  card(s, 0.7, 2.1, 11.9, 2.0, C.cardAlt, C.teal);
  s.addText([
    { text: "Tu wearable ya sabe que algo va mal.\n", options: { fontFace: F.head, fontSize: 22, bold: true, color: C.text, breakLine: true } },
    { text: "Nosotros lo traducimos a un ", options: { fontFace: F.body, fontSize: 17, color: C.muted } },
    { text: "Índice de Riesgo (0-100)", options: { fontFace: F.head, fontSize: 17, bold: true, color: C.teal } },
    { text: " con el ", options: { fontFace: F.body, fontSize: 17, color: C.muted } },
    { text: "por qué", options: { fontFace: F.head, fontSize: 17, bold: true, color: C.amber } },
    { text: " y el ", options: { fontFace: F.body, fontSize: 17, color: C.muted } },
    { text: "qué hacer", options: { fontFace: F.head, fontSize: 17, bold: true, color: C.rose } },
    { text: ". Sin ser científico, sin ser médico.", options: { fontFace: F.body, fontSize: 17, color: C.muted } },
  ], { x: 1.0, y: 2.3, w: 11.3, h: 1.6, align: "left", valign: "middle", margin: 0, lineSpacingMultiple: 1.15 });

  const pts = [
    { t: "Personal", d: "Compara contigo mismo, no con un extraño.", c: C.teal },
    { t: "Explicable", d: "Muestra la causa exacta, no una caja negra.", c: C.purple },
    { t: "Accionable", d: "Cada alerta llega con una recomendación.", c: C.rose },
  ];
  const cw2 = 3.8, gap2 = 0.4, x02 = 0.7, y02 = 4.4, ch2 = 1.9;
  pts.forEach((p, i) => {
    const x = x02 + i * (cw2 + gap2);
    card(s, x, y02, cw2, ch2);
    iconCircle(s, x + 0.3, y02 + 0.3, 0.5, p.c);
    s.addText(p.t, { x: x + 0.95, y: y02 + 0.25, w: cw2 - 1.1, h: 0.6, fontFace: F.head, fontSize: 16, bold: true, color: C.text, valign: "middle", margin: 0 });
    s.addText(p.d, { x: x + 0.3, y: y02 + 1.0, w: cw2 - 0.6, h: 0.8, fontFace: F.body, fontSize: 13, color: C.muted, align: "left", lineSpacingMultiple: 1.1, margin: 0 });
  });
  footer(s, 3);
}

// ============================================================
// SLIDE 4 — EL PRODUCTO EN ACCIÓN
// ============================================================
{
  const s = pptx.addSlide();
  bg(s, C.bg);
  kicker(s, "El producto");
  title(s, "Así se ve en tu teléfono");

  // Left: narrative
  s.addText(
    "Una sola pantalla. El riesgo de hoy, por qué subió y qué hacer ahora mismo.",
    { x: 0.7, y: 2.0, w: 5.4, h: 1.2, fontFace: F.body, fontSize: 17, color: C.text, align: "left", lineSpacingMultiple: 1.2, margin: 0 }
  );
  const pts = [
    "Gauge de riesgo claro: BAJO / MODERADO / ALTO",
    "Causa exacta: “HRV 4 días bajo tu base”",
    "Recomendación del día lista para actuar",
    "Historial 7 / 14 / 30 días a un toque",
  ];
  pts.forEach((p, i) => {
    const y = 3.4 + i * 0.78;
    iconCircle(s, 0.7, y, 0.3, C.teal);
    s.addText(p, { x: 1.15, y: y - 0.05, w: 5.0, h: 0.7, fontFace: F.body, fontSize: 14, color: C.text, align: "left", valign: "middle", lineSpacingMultiple: 1.05, margin: 0 });
  });

  // Right: app mock panel
  card(s, 6.9, 1.85, 5.8, 4.9, C.cardAlt, C.border);
  iconCircle(s, 7.25, 2.25, 0.5, C.teal);
  s.addText("B", { x: 7.25, y: 2.25, w: 0.5, h: 0.5, fontFace: F.head, fontSize: 20, bold: true, color: C.bg, align: "center", valign: "middle", margin: 0 });
  s.addText("BioPulse", { x: 7.85, y: 2.25, w: 3, h: 0.5, fontFace: F.head, fontSize: 18, bold: true, color: C.text, valign: "middle", margin: 0 });
  // gauge mock
  s.addShape(pptx.ShapeType.ellipse, { x: 8.75, y: 3.15, w: 2.0, h: 2.0, fill: { type: "none" }, line: { color: C.borderSoft, width: 10 } });
  s.addShape(pptx.ShapeType.ellipse, { x: 8.75, y: 3.15, w: 2.0, h: 2.0, fill: { type: "none" }, line: { color: C.amber, width: 10 }, lineTail: 70, lineHead: 0 });
  s.addText("46", { x: 8.75, y: 3.8, w: 2.0, h: 0.9, fontFace: F.head, fontSize: 40, bold: true, color: C.text, align: "center", margin: 0 });
  s.addText("RIESGO MODERADO", { x: 7.3, y: 5.4, w: 5.0, h: 0.4, fontFace: F.body, fontSize: 12, bold: true, color: C.amber, align: "center", charSpacing: 1, margin: 0 });
  s.addText("HRV 4 días bajo tu base. Baja la carga 24-48 h.", { x: 7.3, y: 5.8, w: 5.0, h: 0.7, fontFace: F.body, fontSize: 11.5, color: C.muted, align: "center", lineSpacingMultiple: 1.1, margin: 0 });
  footer(s, 4);
}

// ============================================================
// SLIDE 5 — DIFERENCIADOR (hero)
// ============================================================
{
  const s = pptx.addSlide();
  bg(s, C.bg);
  kicker(s, "Por qué somos distintos", C.rose);
  title(s, "Ellos te dan el dato.\nNosotros te decimos qué hacer.");

  // contrast row
  card(s, 0.7, 2.1, 5.75, 2.5, C.cardAlt, C.border);
  s.addText("WHOOP · FITBIT · APPLE", {
    x: 0.95, y: 2.3, w: 5.2, h: 0.5, fontFace: F.head, fontSize: 15, bold: true, color: C.muted, charSpacing: 1, margin: 0,
  });
  s.addText([
    { text: "• Millones de números y gráficas\n", options: { fontFace: F.body, fontSize: 15, color: C.muted, breakLine: true } },
    { text: "• Promedios estáticos que tú interpretas\n", options: { fontFace: F.body, fontSize: 15, color: C.muted, breakLine: true } },
    { text: "• Tú solo descubres lo malo cuando ya pasó", options: { fontFace: F.body, fontSize: 15, color: C.muted } },
  ], { x: 0.95, y: 2.85, w: 5.3, h: 1.6, align: "left", valign: "top", margin: 0, lineSpacingMultiple: 1.2 });

  card(s, 6.85, 2.1, 5.75, 2.5, C.cardAlt, C.teal);
  s.addText("BIOPULSE", {
    x: 7.1, y: 2.3, w: 5.2, h: 0.5, fontFace: F.head, fontSize: 15, bold: true, color: C.teal, charSpacing: 1, margin: 0,
  });
  s.addText([
    { text: "• Un índice de riesgo en lenguaje claro\n", options: { fontFace: F.body, fontSize: 15, color: C.text, breakLine: true } },
    { text: "• El por qué, con tus propias métricas\n", options: { fontFace: F.body, fontSize: 15, color: C.text, breakLine: true } },
    { text: "• Una acción concreta antes de que pase", options: { fontFace: F.body, fontSize: 15, color: C.text } },
  ], { x: 7.1, y: 2.85, w: 5.3, h: 1.6, align: "left", valign: "top", margin: 0, lineSpacingMultiple: 1.2 });

  // coach hero strip
  card(s, 0.7, 4.85, 11.9, 1.9, C.card, C.rose);
  s.addText([
    { text: "NUESTRO FOCO  ·  ", options: { fontFace: F.body, fontSize: 12, bold: true, color: C.rose, charSpacing: 1, breakLine: false } },
    { text: "El coach accionable personalizado.", options: { fontFace: F.head, fontSize: 20, bold: true, color: C.text, breakLine: true } },
    { text: "Cada alerta se compone con TUS datos del día (no es un texto fijo). Convertir datos en comportamiento es donde está el valor de mercado — y donde ellos no compiten.", options: { fontFace: F.body, fontSize: 14, color: C.muted, lineSpacingMultiple: 1.2 } },
  ], { x: 1.0, y: 5.05, w: 11.3, h: 1.5, align: "left", valign: "middle", margin: 0 });
  footer(s, 5);
}

// ============================================================
// SLIDE 6 — TRACCIÓN: YA FUNCIONA
// ============================================================
{
  const s = pptx.addSlide();
  bg(s, C.bg);
  kicker(s, "Tracción", C.teal);
  title(s, "No es una idea en papel. Ya funciona.");

  const facts = [
    { big: "MVP", lab: "en vivo y operando\nsobre datos reales", c: C.teal },
    { big: "100k", lab: "registros de wearable\nreales ya procesados", c: C.amber },
    { big: "3", lab: "motores de señal\nvalidados y combinados", c: C.purple },
  ];
  const cw = 3.8, gap = 0.4, x0 = 0.7, y0 = 2.0, ch = 2.3;
  facts.forEach((st, i) => {
    const x = x0 + i * (cw + gap);
    card(s, x, y0, cw, ch);
    s.addText(st.big, { x: x + 0.3, y: y0 + 0.3, w: cw - 0.6, h: 1.0, fontFace: F.head, fontSize: 44, bold: true, color: st.c, align: "left", margin: 0 });
    s.addText(st.lab, { x: x + 0.3, y: y0 + 1.35, w: cw - 0.6, h: 0.8, fontFace: F.body, fontSize: 14, color: C.muted, align: "left", lineSpacingMultiple: 1.1, margin: 0 });
  });

  card(s, 0.7, 4.6, 11.9, 1.9, C.cardAlt, C.teal);
  s.addText([
    { text: "EL PRODUCTO EXISTE  ·  ", options: { fontFace: F.body, fontSize: 12, bold: true, color: C.teal, charSpacing: 1, breakLine: false } },
    { text: "Tenemos una app funcionando, modelos entrenados y validados, y un índice de riesgo que corre de extremo a extremo. El riesgo de ejecución ya bajó: lo que sigue es escalar, no inventar.", options: { fontFace: F.body, fontSize: 15, color: C.text, lineSpacingMultiple: 1.2 } },
  ], { x: 1.0, y: 4.8, w: 11.3, h: 1.5, align: "left", valign: "middle", margin: 0 });
  footer(s, 6);
}

// ============================================================
// SLIDE 7 — [TÉCNICO 1/2] CÓMO FUNCIONA (simple)
// ============================================================
{
  const s = pptx.addSlide();
  bg(s, C.bg);
  kicker(s, "Cómo funciona (en simple)", C.purple);
  title(s, "Tres motores, una sola señal que entiendes");

  const engines = [
    { n: "01", t: "Tu línea base", d: "Compara tus métricas de hoy contra tu propio promedio de 7 días. Si tu “yo normal” cambia, avisamos.", c: C.teal },
    { n: "02", t: "Tu cuerpo perdiendo flexibilidad", d: "Mide cuánta variedad hay en tu ritmo cardíaco. Menos variedad = más rigidez = señal temprana.", c: C.purple },
    { n: "03", t: "150 expertos votando", d: "Un modelo de árboles aprende qué variable importa y valida la alerta con datos reales.", c: C.amber },
  ];
  const cw = 3.8, gap = 0.4, x0 = 0.7, y0 = 2.0, ch = 3.1;
  engines.forEach((e, i) => {
    const x = x0 + i * (cw + gap);
    card(s, x, y0, cw, ch);
    iconCircle(s, x + 0.3, y0 + 0.3, 0.65, e.c);
    s.addText(e.n, { x: x + 0.3, y: y0 + 0.3, w: 0.65, h: 0.65, fontFace: F.head, fontSize: 20, bold: true, color: C.bg, align: "center", valign: "middle", margin: 0 });
    s.addText(e.t, { x: x + 1.1, y: y0 + 0.3, w: cw - 1.3, h: 0.65, fontFace: F.head, fontSize: 15, bold: true, color: C.text, valign: "middle", margin: 0 });
    s.addText(e.d, { x: x + 0.3, y: y0 + 1.2, w: cw - 0.6, h: 1.7, fontFace: F.body, fontSize: 13, color: C.muted, align: "left", lineSpacingMultiple: 1.2, margin: 0 });
  });

  card(s, 0.7, 5.4, 11.9, 1.2, C.cardAlt, C.border);
  s.addText([
    { text: "EL RESULTADO  ·  ", options: { fontFace: F.body, fontSize: 12, bold: true, color: C.teal, charSpacing: 1, breakLine: false } },
    { text: "Cada motor suma hasta 25 puntos. El total (0-100) define BAJO / MODERADO / ALTO y dispara la alerta con su causa.", options: { fontFace: F.body, fontSize: 14, color: C.text, lineSpacingMultiple: 1.15 } },
  ], { x: 1.0, y: 5.55, w: 11.3, h: 0.9, align: "left", valign: "middle", margin: 0 });
  footer(s, 7);
}

// ============================================================
// SLIDE 8 — [TÉCNICO 2/2] VALIDACIÓN CREÍBLE (titulares)
// ============================================================
{
  const s = pptx.addSlide();
  bg(s, C.bg);
  kicker(s, "Validación", C.teal);
  title(s, "Esto es ciencia de verdad, no humo");

  const cards = [
    { big: "0.99", lab: "AUC de discriminación\nsobre datos reales (100k)", c: C.teal },
    { big: "5-fold", lab: "cross-validation\nestable, no suerte de un split", c: C.purple },
    { big: "Honestos", lab: "mostramos la matriz de\nconfusión, falsos positivos incluidos", c: C.amber },
  ];
  const cw = 3.8, gap = 0.4, x0 = 0.7, y0 = 2.0, ch = 2.1;
  cards.forEach((st, i) => {
    const x = x0 + i * (cw + gap);
    card(s, x, y0, cw, ch);
    s.addText(st.big, { x: x + 0.3, y: y0 + 0.25, w: cw - 0.6, h: 0.95, fontFace: F.head, fontSize: 42, bold: true, color: st.c, align: "left", margin: 0 });
    s.addText(st.lab, { x: x + 0.3, y: y0 + 1.25, w: cw - 0.6, h: 0.75, fontFace: F.body, fontSize: 13.5, color: C.muted, align: "left", lineSpacingMultiple: 1.1, margin: 0 });
  });

  // feature importance image (the one honest "proof" visual) — proporción nativa 1248x876 (≈1.425)
  const imgY = 4.4, imgH = 2.65, imgW = imgH * 1.425; // 3.78 x 2.65 → sin aplastar
  s.addImage({ path: path.join(FILES, "feature_importance_rf.png"), x: 0.7, y: imgY, w: imgW, h: imgH });
  card(s, 4.85, imgY, 7.75, imgH, C.cardAlt, C.border);
  s.addText([
    { text: "POR QUÉ CONFIAR  ·  ", options: { fontFace: F.body, fontSize: 11.5, bold: true, color: C.teal, charSpacing: 1, breakLine: true } },
    { text: "El modelo aprendió solo que la temperatura de piel y la recuperación son las señales más predictivas — justo lo que dice la literatura clínica sobre infecciones y fatiga tempranas. La máquina coincide con los médicos.", options: { fontFace: F.body, fontSize: 14, color: C.text, lineSpacingMultiple: 1.25 } },
  ], { x: 5.1, y: imgY + 0.15, w: 7.25, h: imgH - 0.3, align: "left", valign: "middle", margin: 0 });
  footer(s, 8);
}

// ============================================================
// SLIDE 9 — MERCADO Y POR QUÉ AHORA
// ============================================================
{
  const s = pptx.addSlide();
  bg(s, C.bg);
  kicker(s, "Mercado", C.amber);
  title(s, "Una ventana abierta, justo ahora");

  const cols = [
    { t: "Wearables en auge", d: "Cada vez más relojes y pulseras inteligentes en muñecas; la demanda de “más que pasos” crece.", c: C.teal },
    { t: "Población que envejece", d: "Más adultos mayores, más caídas e infecciones prevenibles que el sistema no detecta a tiempo.", c: C.rose },
    { t: "El cuello de botella", d: "La capa de IA predictiva de salud está vacía. El hardware existe; la inteligencia no.", c: C.purple },
  ];
  const cw = 3.8, gap = 0.4, x0 = 0.7, y0 = 2.0, ch = 3.1;
  cols.forEach((e, i) => {
    const x = x0 + i * (cw + gap);
    card(s, x, y0, cw, ch, C.card, e.c);
    iconCircle(s, x + 0.3, y0 + 0.35, 0.6, e.c);
    s.addText(e.t, { x: x + 1.05, y: y0 + 0.35, w: cw - 1.3, h: 0.6, fontFace: F.head, fontSize: 15, bold: true, color: C.text, valign: "middle", margin: 0 });
    s.addText(e.d, { x: x + 0.3, y: y0 + 1.25, w: cw - 0.6, h: 1.7, fontFace: F.body, fontSize: 13.5, color: C.muted, align: "left", lineSpacingMultiple: 1.25, margin: 0 });
  });

  s.addText("El hardware ya está en la muñeca de millones. Solo falta la capa que convierta esos datos en cuidado. Esa capa somos nosotros.", {
    x: 0.7, y: 5.4, w: 12.1, h: 1.1, fontFace: F.body, fontSize: 16, italic: true, color: C.text, align: "left", lineSpacingMultiple: 1.2, margin: 0,
  });
  footer(s, 9);
}

// ============================================================
// SLIDE 10 — MODELO DE NEGOCIO
// ============================================================
{
  const s = pptx.addSlide();
  bg(s, C.bg);
  kicker(s, "Modelo de negocio", C.teal);
  title(s, "Dos formas de ganar, un mismo motor");

  // B2C
  card(s, 0.7, 2.0, 5.75, 4.0, C.cardAlt, C.teal);
  s.addText("B2C · Suscripción", {
    x: 1.0, y: 2.25, w: 5.2, h: 0.6, fontFace: F.head, fontSize: 19, bold: true, color: C.teal, margin: 0,
  });
  const b2c = [
    "App de pago mensual para el usuario final",
    "Plan familiar: cuida a tus mayores a distancia",
    "Funciona con el wearable que ya tienes",
  ];
  b2c.forEach((p, i) => {
    const y = 3.1 + i * 0.85;
    iconCircle(s, 1.0, y, 0.28, C.teal);
    s.addText(p, { x: 1.45, y: y - 0.05, w: 4.8, h: 0.75, fontFace: F.body, fontSize: 14, color: C.text, valign: "middle", align: "left", lineSpacingMultiple: 1.05, margin: 0 });
  });

  // B2B
  card(s, 6.85, 2.0, 5.75, 4.0, C.cardAlt, C.amber);
  s.addText("B2B · Datos y riesgo", {
    x: 7.15, y: 2.25, w: 5.2, h: 0.6, fontFace: F.head, fontSize: 19, bold: true, color: C.amber, margin: 0,
  });
  const b2b = [
    "Aseguradoras: menos caídas = menos pagos",
    "Geriátricos y clínicas: alerta temprana",
    "Bienestar corporativo: prevenir bajas",
  ];
  b2b.forEach((p, i) => {
    const y = 3.1 + i * 0.85;
    iconCircle(s, 7.15, y, 0.28, C.amber);
    s.addText(p, { x: 7.6, y: y - 0.05, w: 4.8, h: 0.75, fontFace: F.body, fontSize: 14, color: C.text, valign: "middle", align: "left", lineSpacingMultiple: 1.05, margin: 0 });
  });

  s.addText("Una sola tecnología alimenta ambos ingresos: mientras más usuarios, mejor el modelo; mientras mejor el modelo, más clientes B2B.", {
    x: 0.7, y: 6.2, w: 12.1, h: 0.8, fontFace: F.body, fontSize: 14, italic: true, color: C.muted, align: "left", lineSpacingMultiple: 1.2, margin: 0,
  });
  footer(s, 10);
}

// ============================================================
// SLIDE 11 — THE ASK
// ============================================================
{
  const s = pptx.addSlide();
  bg(s, C.bg);
  kicker(s, "La inversión", C.teal);
  title(s, "Lo que buscamos y para qué");

  const asks = [
    { big: "$X", lab: "Ronda Serie Semilla", c: C.teal },
    { big: "Fase 5-8", lab: "API directa + datos en vivo + despliegue en la nube", c: C.amber },
    { big: "Escalar", lab: "Llevar el MVP a usuarios reales y crecer el modelo", c: C.rose },
  ];
  const cw = 3.8, gap = 0.4, x0 = 0.7, y0 = 2.0, ch = 2.3;
  asks.forEach((a, i) => {
    const x = x0 + i * (cw + gap);
    card(s, x, y0, cw, ch, C.cardAlt, a.c);
    s.addText(a.big, { x: x + 0.3, y: y0 + 0.35, w: cw - 0.6, h: 1.0, fontFace: F.head, fontSize: 40, bold: true, color: a.c, align: "left", margin: 0 });
    s.addText(a.lab, { x: x + 0.3, y: y0 + 1.4, w: cw - 0.6, h: 0.8, fontFace: F.body, fontSize: 13, color: C.text, align: "left", lineSpacingMultiple: 1.15, margin: 0 });
  });

  card(s, 0.7, 4.6, 11.9, 1.9, C.card, C.teal);
  s.addText([
    { text: "POR QUÉ AHORA  ·  ", options: { fontFace: F.body, fontSize: 13, bold: true, color: C.teal, charSpacing: 1, breakLine: true } },
    { text: "El producto funciona, los modelos están validados y el mercado de wearables no para de crecer. El siguiente paso es integrar los datos en vivo y escalar. Ese es el momento de entrar.", options: { fontFace: F.body, fontSize: 15, color: C.text, lineSpacingMultiple: 1.2 } },
  ], { x: 1.0, y: 4.8, w: 11.3, h: 1.5, align: "left", valign: "middle", margin: 0 });

  s.addText("BioPulse  ·  Predictive Biometric Analytics  ·  gracias", {
    x: 0.7, y: 6.75, w: 12, h: 0.4, fontFace: F.head, fontSize: 14, bold: true, color: C.muted, align: "center", margin: 0,
  });
  footer(s, 11);
}

// ---------- write ----------
const fs = require("fs");
const out = path.join(__dirname, "BioPulse_Pitch.pptx");
pptx.writeFile({ fileName: out }).then(() => {
  console.log("DECK WRITTEN:", out);
  // Copia de respaldo a la ruta primaria del proyecto para que el archivo
  // que el usuario abre normalmente también quede actualizado.
  const primary = "C:/Users/ecard/Desktop/BIOPULSE PROYECTO CIENCIA DE DATOS/pitch/BioPulse_Pitch.pptx";
  try {
    fs.copyFileSync(out, primary);
    console.log("COPIA EN RUTA PRIMARIA:", primary);
  } catch (e) {
    console.warn("No se pudo copiar a ruta primaria:", e.message);
  }
}).catch((e) => {
  console.error("ERROR:", e);
  process.exit(1);
});
