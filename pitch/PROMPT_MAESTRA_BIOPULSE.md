# PROMPT MAESTRA — GENERADOR DEL PITCH DECK DE BIOPULSE

> Instrucción para una IA generadora de presentaciones (tipo diseñador de decks / generador pptx).
> La IA que recibe este prompt **NO conoce el proyecto**. Todo lo que necesita saber está aquí abajo, de forma autocontenida.
> Idioma de salida obligatorio: **ESPAÑOL** (Latinoamérica). No uses inglés en el contenido visible del deck salvo nombres propios de productos (Whoop, Oura, Apple Watch, Vercel, Groq, Llama).

---

## 0. TU ROL

Eres un **director de arte + redactor senior especializado en pitch decks de inversionistas y defensas académicas de ciencia de datos**. Tu trabajo es producir un deck de 13 diapositivas (formato 16:9) que cumpla TODAS las especificaciones de este documento: contenido, tono, estructura, paleta de colores, tipografía, logo, layout y formato de salida. No inventes métricas. No agregues slides fuera de las 13 especificadas. No cambies el orden.

---

## 1. CONTEXTO DEL PROYECTO (todo lo que debes saber de BioPulse)

**Nombre:** BioPulse.
**Tagline / posicionamiento:** "El laboratorio de recuperación personal basado en ciencia de datos."
**Qué es:** una aplicación web (mobile-first) que toma los datos biométricos que un usuario ya genera con su wearable (Whoop, Apple Watch, Garmin, Fitbit) o con su propio archivo CSV, y los convierte en **decisiones explicables** mediante un motor de ciencia de datos y un coach de IA. BioPulse NO fabrica hardware; es la capa de inteligencia que le falta a los wearables.
**Estado:** MVP en producción, desplegado en Vercel → `https://bio-pulse-six.vercel.app`. No es un mockup.
**Origen:** nació como proyecto de ciencia de datos en la EIA (Escuela de Ingeniería de Antioquia, Colombia) y evolucionó a producto de software funcional.
**Costo para el usuario:** $0 en su versión base (gratis).
**Stack técnico:** React 18 + Vite en el frontend; funciones serverless en Vercel; Coach IA con motor Groq (Llama 3.3 70B) con streaming en vivo (SSE) y fallback local por motor de reglas si no hay red/API key.

### La app tiene 5 pestañas (mobile-first, estética "liquid glass")
1. **Técnico** — curva de energía, proyección de riesgo y modelos de predicción avanzados.
2. **Live** — frecuencia cardíaca (HR), variabilidad cardíaca (HRV), frecuencia respiratoria y métricas en vivo.
3. **Inicio (Dashboard)** — BioScore, riesgo del día, coach asistente IA, sesión de respiración.
4. **Sueño** — sleep score, eficiencia, HRV nocturna, frecuencia cardíaca en sueño (HRH) y métricas nocturnas.
5. **Ajustes (Config)** — configuración, fuentes de datos, umbrales.

### El motor de ciencia de datos (lo que lo hace creíble)
Combina 4 señales en un Score de Riesgo 0–100:
- **Control estadístico (z-scores)** — desviaciones de la línea base personal.
- **Entropía aproximada (ApEn)** — regularidad/complejidad de la señal de HRV.
- **Fatiga aguda** — caída reciente de recuperación y carga (strain).
- **Regla clínica** — temperatura + frecuencia respiratoria (umbrales fisiológicos).
Luego un **Random Forest** aprende la importancia real de las variables fisiológicas. Cada predicción distingue explícitamente entre "regla clínica" y "modelo aprendido" (honestidad por diseño). Siempre visible un disclaimer de no-diagnóstico médico.

### Datos reales disponibles (ÚSALOS TAL CUAL, no los inventes)
- **Dataset:** `whoop_fitness_dataset_100k.csv` → **100.000 registros reales** de usuarios Whoop, 39 columnas biométricas (recovery_score, day_strain, sleep_hours, sleep_efficiency, hrv, resting_heart_rate, skin_temp_deviation, respiratory_rate, age, etc.).
- **Validación del modelo** (archivo `training_results.json`, 3 modelos sobre los 100K):
  - `control_estadistico`: n=100000, prevalencia 0.1722, **CV AUC = 0.9944**, **holdout AUC = 0.9941**, accuracy = 0.95. Importancia de variables: HRV 53.9%, day_strain 20.5%, hrv_baseline 15.5%, recovery_score 5.5%, RHR 1.6%, age 0.75%, resto <1%.
  - `patron_agudo`: n=100000, prevalencia 0.018, CV AUC = 0.9926, holdout AUC = 0.9948, accuracy = 0.9421.
  - `proceso_infeccioso`: AUC = 1.0 — **tratar como CASO DE ESTUDIO interno, NO como métrica de producto** (es sospechosamente perfecto y no representa el producto general).
- **Tracción HOY (honesto):** seguidores = 0, waitlist = 0, usuarios = 0. El deck debe mostrar esto con transparencia, no ocultarlo.

---

## 2. AUDIENCIA Y OBJETIVO

- **Audiencia mixta:** staff/profesores de la EIA, posibles inversores, y otros estudiantes. Presentación híbrida.
- **Duración de la presentación oral:** 12–15 minutos.
- **Estilo de las diapositivas:** POCAS PALABRAS. El presentador habla y explica; el slide es apoyo visual, no un documento que se lee solo. Máximo ~25–35 palabras de texto por slide (titulares + 3–5 bullet cortos). Excepción: la slide de solución/problema pueden tener 4 cards con una frase cada una.
- **Objetivo:** interesar a los inversores (mostrar mercado, producto real, modelo de negocio, equipo) y satisfacer a los profesores (mostrar rigor científico, método, datos reales). No se pide un "ask" de inversión en este deck (no incluyas monto ni equity).
- **Entrega:** al final el deck debe existir en dos formatos — (a) **PPTX 16:9** para proyectar, y (b) **PDF con speaker notes** (notas del orador debajo de cada slide) para el jurado y para que el presentador sepa qué decir.

---

## 3. TONO Y VOZ

- **Tono:** confiado, científico pero accesible, honesto, sin humo. Ni infantil ni académico denso.
- **Voz:** "nosotros" (el equipo). Directo. Cada afirmación debe poder sostenerse con dato real.
- **Ganchos (hooks):** frases cortas, pegajosas, que generen tensión o curiosidad. Ver slide 1.
- **Prohibido:** jerga vacía de wellness ("potencia tu energía vibracional"), promesas médicas ("cura el insomnio"), superlativos sin respaldo ("el mejor del mundo").
- **Lenguaje:** español neutro latinoamericano. "Aplicación" o "app" (no "aplicativo"). "Wearable" se acepta. "Ciencia de datos" (no "data science" en el texto visible).

---

## 4. SISTEMA DE DISEÑO (obligatorio, no negociable)

### 4.1 Paleta "Liquid Pulse" (usa SOLO estos colores)
| Rol | Hex | Uso |
|-----|-----|-----|
| Fondo base | `#070B16` | Fondo near-black azulado de todas las slides |
| Primario "pulso" | `#22D3EE` | Cian eléctrico: acentos, líneas de pulso, números clave, logo |
| Secundario "bio" | `#8B5CF6` | Violeta: gradientes, bloques secundarios, glow |
| Éxito / energía | `#34D399` | Verde menta: estados buenos, scores altos |
| Alerta / riesgo | `#FB7185` | Rosa: riesgo, alertas, métricas bajas |
| Texto principal | `#F1F5F9` | Blanco roto para titulares y texto |
| Texto secundario | `#94A3B8` | Gris azulado para subtítulos y notas |

**Regla de vidrio (glassmorphism / "liquid glass"):** tarjetas y chips con fondo blanco al **8% de opacidad** + `backdrop-filter: blur(12px)` + borde blanco al 12%. Sombras suaves con glow cian/violeta. Fondos con degradados radiales sutiles (cián→violeta) a muy baja opacidad.

### 4.2 Tipografía
- **Familia:** `Manrope` (ya usada en la app). Si no está disponible, usa `Inter` o `Segoe UI` como fallback sans-serif limpio.
- **Titulares:** Manrope Bold (700), tamaño grande (40–54 pt en 16:9), interlineado ajustado (leading 1.05–1.1), a veces en dos líneas para crear ritmo.
- **Cuerpo / bullets:** Manrope Medium (500), 16–20 pt.
- **Números / KPIs:** Manrope ExtraBold, en cian o verde, bien grandes (usar para 100K, AUC 0.9941, $0).
- **No uses:** Comic Sans, fuentes serif decorativas, cursivas en titulares.

### 4.3 Logo BioPulse (concepto a dibujar)
- **Forma:** un **anillo** estilizado (como el BioScore de la app) atravesado por una **línea de ECG / pulso cardíaco** que se curva como una hoja (lo "bio").
- **Color:** monocromo cian `#22D3EE` (glow sutil).
- **Requisito:** debe verse bien incluso a 32 px (en esquina de slide y en portada grande).
- Dibújalo como SVG propio (no busques en internet; créalo con formas básicas: círculo + polilínea de pulso).

### 4.4 Layout y composición
- Formato **16:9** (1280×720 o 1920×1080 lógico).
- Espacio en blanco (negativo) generoso; no saturar.
- Una "zona de título" arriba-izquierda con el titular; una "zona de contenido" central; pie discreto con `BIOPULSE · NN` (número de slide) y el logo pequeño.
- Para mockups de la app usa un **marco tipo teléfono** (rounded, borde glass) centrado o en grid 2×2.
- **Profundidad:** capas sutiles (glow detrás de tarjetas, línea de pulso animada-sugerida con gradiente).
- Coherencia: misma grilla y mismos márgenes en las 13 slides.

### 4.5 Anti-patrones (PROHIBIDO)
- Clip-art, iconos de biblioteca genérica feos, o emojis como reemplazo de diseño.
- Fotos stock de personas desconectadas del producto.
- Muros de texto / párrafos largos.
- Métricas inventadas o redondeos engañosos (usa los números reales de la sección 1).
- Testimonios falsos ("Juan P. dice...").
- Fondos blancos planos o plantillas corporativas aburridas (el deck es oscuro por diseño).
- Mezclar el tema claro/oscuro: TODO el deck es fondo oscuro `#070B16`.

---

## 5. ESTRUCTURA DE LA PRESENTACIÓN (13 SLIDES — ORDEN FIJO)

A continuación el contenido exacto que debe aparecer en cada slide. El texto entre comillas es el copy sugerido (puedes pulir gramática pero mantén el mensaje y los datos). Los bullets son guías de lo que va en la slide, no necesariamente todo el texto literal.

### SLIDE 1 — PORTADA + HOOK
- **Titular (hook):** *"Tu muñeca ya conoce tu salud. BioPulse la desbloquea."*
- **Sub:** BioPulse — El laboratorio de recuperación personal basado en ciencia de datos.
- **Elementos visuales:** logo BioPulse grande o centro-arriba; línea de pulso ECG decorativa; 3 chips pequeños de credibilidad: `100K datos reales` · `$0 para el usuario` · `MVP en producción`.
- **Pie:** `bio-pulse-six.vercel.app` · `CONFIDENCIAL · BIOPULSE 2026`.
- **Nota diseño:** esta es la slide más "wow"; glow fuerte, mucho espacio negativo, el hook en texto grande cian/blanco.

### SLIDE 2 — EL PROBLEMA (enfoque MERCADO, con un toque de usuario)
- **Titular:** *"Los wearables te venden un número. No una respuesta."*
- **Cards (4), cada una con ícono + una frase:**
  1. **Monopolio de datos** — Whoop, Oura y Apple encierran tus biométricas en su nube; tú no las controlas.
  2. **Cajas negras** — un score sin explicación no cambia tu comportamiento, solo genera ansiedad.
  3. **Suscripciones caras** — $30+/mes para "quizás" entender tus propios datos.
  4. **Cero prevención real** — ningún wearable de consumo detecta fatiga temprana con estadística real.
- **Nota:** el dolor principal es de MERCADO (secuestro de datos, monopolio); el punto 2 y 4 rozan el dolor del usuario. No hables de BioPulse aquí.

### SLIDE 3 — LA SOLUCIÓN
- **Titular:** *"BioPulse: tu laboratorio de recuperación personal."*
- **4 pilares (cards):**
  1. **Motor DS real** — control estadístico + entropía ApEn + Random Forest. No promedios de marketing.
  2. **Coach IA** — traduce tus métricas a UNA acción clara para mañana, en dos frases, sin jerga.
  3. **100% gratis** — funciona con Whoop, Apple Watch, Garmin, Fitbit o tu propio CSV.
  4. **Honestidad radical** — cada score dice de dónde viene: regla clínica vs. predicción aprendida.
- **Cierre:** "Tu laboratorio de recuperación personal."

### SLIDE 4 — CÓMO FUNCIONA
- **Titular:** *"De datos crudos a una decisión en 4 pasos."*
- **Paso 01 · Datos** — Wearable conectado o CSV propio: HRV, RHR, sueño, respiración, temperatura.
- **Paso 02 · Motor de riesgo** — Z-scores (25 pts) + entropía ApEn (25 pts) + fatiga aguda (25 pts) + regla clínica (25 pts).
- **Paso 03 · Scores** — BioScore, Sleep Score y Score de Riesgo (0–100), explicados en lenguaje humano.
- **Paso 04 · Coach IA** — una recomendación accionable para hoy, no un número más.
- **Nota pie:** Todo el pipeline corre en cliente/servidor propio — sin depender de la nube cerrada del fabricante.
- **Visual:** 4 nodos conectados por una línea de pulso (flechas suaves).

### SLIDE 5 — EL PRODUCTO (enfoque de la app, 5 secciones)
- **Titular:** *"Un producto, cinco vistas de tu cuerpo."*
- **Las 5 pestañas (breve, una línea cada una):**
  - **Técnico** — curva de energía, proyección de riesgo y modelos de predicción avanzados.
  - **Live** — HR, HRV, frecuencia respiratoria y métricas en vivo.
  - **Inicio** — BioScore, riesgo del día, Coach IA y respiración.
  - **Sueño** — sleep score, eficiencia, HRV y HRH nocturnas.
  - **Ajustes** — configuración y fuentes de datos.
- **Nota:** mobile-first, estética liquid glass. Esta slide explica QUÉ es cada sección; la siguiente muestra CÓMO se ve.

### SLIDE 6 — PRODUCTO EN VIVO (screenshots reales)
- **Titular:** *"Esto no es un mockup. Es un producto en producción."*
- **Visual:** grid 2×2 de **screenshots reales** del deploy (`https://bio-pulse-six.vercel.app`): Dashboard/Inicio, Coach IA, Sueño, Live. Usa capturas reales, no ilustraciones.
- **Pie:** `bio-pulse-six.vercel.app` · MVP en Vercel.
- **Nota:** si no puedes capturar, describe claramente que faltan las 4 capturas reales y deja los marcos tipo teléfono reservados.

### SLIDE 7 — MOTOR DS / ML (con badge de validación)
- **Titular:** *"Ciencia de datos real, no wellness genérico."*
- **Señales del modelo (chips):** z-score · ApEn · fatiga aguda · regla clínica · Random Forest.
- **BADGE DE VALIDACIÓN (destacado):** *"Validado sobre 100.000 registros reales de Whoop · AUC 0.9941 (holdout) · 5-fold CV AUC 0.9944 · Accuracy 0.95"*.
- **Importancia de variables (mini-barra real):** HRV 53.9% · day_strain 20.5% · hrv_baseline 15.5% · recovery_score 5.5% · RHR 1.6% · age 0.75%.
- **Transparencia:** nota pequeña — "Proceso infeccioso: AUC 1.0 en caso de estudio interno (no es métrica de producto)."
- **Disclaimer visible:** "Sin diagnóstico médico. Cada predicción distingue regla clínica de modelo aprendido."

### SLIDE 8 — KPIs (biométricos + tracción, fusión)
- **Titular:** *"Medimos lo que importa — y somos honestos sobre dónde estamos."*
- **Mitad A — KPIs biométricos (como dashboard de proyecto):** HRV, RHR, eficiencia de sueño, Score de Riesgo. Muestra cómo se visualizan como anillos/barras (puedes usar datos demo del producto).
- **Mitad B — Tracción HOY (HONESTO):** seguidores `0` · waitlist `0` · usuarios `0`. Acompaña con una línea: "Punto de partida real. El plan de crecimiento está en el roadmap."
- **Nota:** no maquilles estos ceros; la honestidad es un diferenciador frente a pitches inflados.

### SLIDE 9 — EL EQUIPO
- **Titular:** *"Quién construye BioPulse."*
- **3 tarjetas (plain, se llenan después):** 
  - **Emilio** — Fundador · Ciencia de Datos (EIA).
  - **Miguel** — [ROL PENDIENTE DE CONFIRMAR].
  - **Lucas** — [ROL PENDIENTE DE CONFIRMAR].
- **Nota:** mantenerlo simple (nombre + rol). Si hay foto/avatar, úsala; si no, círculo con inicial. No inventes roles ni biografías.

### SLIDE 10 — DIFERENCIAL vs COMPETENCIA (matriz)
- **Titular:** *"Mismo problema, enfoque distinto."*
- **Mensaje:** BioPulse no compite en hardware; convierte los datos que tu wearable ya genera en decisiones explicables.
- **Matriz (filas = competidores, columnas = capacidades), marca ✔/✘ o ●:**
  - Capacidades: ¿Explica el score? · ¿Gratis para el usuario? · ¿Multi-wearable? · ¿Coach IA? · ¿Ciencia DS abierta/honesta?
  - Filas: **BioPulse** (✔✔✔✔✔), **Whoop** (✘, ✘ paga, parcial, ✘, ✘), **Oura** (✘, ✘ paga, parcial, ✘, ✘), **Apple Watch** (parcial, ✘, solo Apple, ✘, ✘), **Visible** (parcial, ✘, limitado, parcial, parcial), **Athlytic** (parcial, ✘, Apple, ✘, parcial).
- **Nota:** la matriz debe dejar claro que BioPulse es el único que explica + es gratis + es multi-wearable + tiene coach IA + es honesto.

### SLIDE 11 — MODELO DE NEGOCIO
- **Titular:** *"Cómo generamos valor (y ingresos)."*
- **3 fuentes (cards):**
  1. **Freemium** — gratis para scores básicos; suscripción para predicciones avanzadas, gemelo digital de salud y exportar reporte a médico.
  2. **B2B** — licencia por usuario para clínicas, coaches y equipos deportivos que monitorean pacientes/atletas.
  3. **Datos agregados anonimizados** — panel de tendencias de salud poblacional para investigación/aseguradoras, SIN vender datos personales.
- **Cierre:** el usuario base sigue siendo $0. El ingreso viene de valor agregado y B2B.

### SLIDE 12 — ROADMAP
- **Titular:** *"De MVP en Vercel a referente de biohacking en LatAm."*
- **Línea de tiempo (5 hitos):**
  - **HOY** — MVP en producción, motor de riesgo validado, plan de marketing $0 listo.
  - **Q1** — 0 → 100K seguidores + embudo de adquisición (TikTok, Reels, SEO).
  - **Q2** — Lanzamiento freemium abierto + comunidad activa.
  - **Q3** — 2.000 en waitlist + YouTube y blog SEO (conversión web→waitlist >8%).
  - **Q4** — Referente LatAm en biohacking cuantificado.
- **Nota:** usa una línea de pulso como eje temporal.

### SLIDE 13 — DEMO + LLAMADA A LA ACCIÓN
- **Titular:** *"Construyamos el laboratorio de recuperación que Latinoamérica merece."*
- **Elementos:** **QR gigante** que lleve a `https://bio-pulse-six.vercel.app` (el presentador hace demo en vivo desde el deploy); texto "Hablemos →".
- **Pie:** `bio-pulse-six.vercel.app` · `CONFIDENCIAL · BIOPULSE 2026`.
- **Nota:** no incluyas monto de inversión ni equity (no aplica en este deck).

---

## 6. REGLAS DE DATOS Y HONESTIDAD (crítico)

- Usa **100.000** (no 150K) registros reales de Whoop de forma consistente en todo el deck.
- Las métricas de validación vienen del `training_results.json`: reporta AUC 0.9941 (holdout) y 0.9944 (CV) de `control_estadistico`, y menciona `patron_agudo` (AUC 0.9948) como segundo modelo. El de `proceso_infeccioso` (AUC 1.0) SOLO como caso de estudio, nunca como métrica de producto.
- Tracción = 0 hoy; preséntalo con transparencia, no lo ocultes ni lo infles.
- Nunca inventes usuarios, ingresos, testimonios ni partnership.
- El dataset sintético en la carpeta "Datasets generados artificalmente realistas" NO debe presentarse como datos reales de usuarios; el deck se apoya en el dataset de 100K reales.

---

## 7. INSTRUCCIONES DE SALIDA / FORMATO

1. **Render en PPTX 16:9** usando python-pptx (o tu herramienta equivalente). Aplica la paleta, tipografía Manrope, glassmorphism y logo de la sección 4.
2. **Cada slide debe tener speaker notes** (notas del orador) con un guion corto de 3–5 frases de qué decir al presentar esa slide (tono confiado, para 12–15 min total). Estas notas deben ir al PDF.
3. **Exportar también a PDF** (con las speaker notes visibles o en anexo) para entrega al jurado.
4. **No agregar ni quitar slides.** Respeta el orden 1→13.
5. **No cambiar los titulares hooks** (especialmente el de la slide 1).
6. Entrega final: archivo `BioPulse_Pitch.pptx` + `BioPulse_Pitch.pdf` (más el logo SVG si lo generas).

---

## 8. CHECKLIST DE CALIDAD (verifica antes de entregar)

- [ ] 13 slides, orden correcto, 16:9.
- [ ] Fondo oscuro `#070B16` en todas; paleta Liquid Pulse respetada.
- [ ] Logo BioPulse (anillo + pulso ECG) presente en portada y pie.
- [ ] Hook de slide 1 literal: *"Tu muñeca ya conoce tu salud. BioPulse la desbloquea."*
- [ ] Datos reales: 100K, AUC 0.9941/0.9944, accuracy 0.95, tracción 0 honesta.
- [ ] Slide 6 con screenshots reales (o marcos reservados claramente marcados).
- [ ] Slide 10 con matriz de competencia completa.
- [ ] Slide 11 con las 3 fuentes de negocio (freemium/B2B/datos agregados), sin ask de inversión.
- [ ] Slide 13 con QR a bio-pulse-six.vercel.app.
- [ ] Pocas palabras por slide; speaker notes incluidas; PDF generado.
- [ ] Cero métricas inventadas, cero testimonios falsos, cero muros de texto.
