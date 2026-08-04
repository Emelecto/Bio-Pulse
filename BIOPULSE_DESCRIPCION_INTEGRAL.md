# BioPulse — Documento Integral del Proyecto

*Redactado por el agente Scribe · enfoque profesional, exhaustivo y basado en el código y diseño reales del repositorio `biopulse-vite`.*

---

## 1. Foco y propósito

BioPulse es una plataforma de **analítica biométrica predictiva y prevención de riesgos de salud**, concebida originalmente como proyecto de Ciencia de Datos del primer semestre en la EIA (Escuela de Ingeniería de Antioquia) y evolucionada hoy en un producto de software real: una aplicación móvil web (PWA) de monitorización de recuperación, sueño y señales fisiológicas, con un **coach de inteligencia artificial** integrado.

El foco central es convertir el ruido de datos que generan los wearables (Whoop, Apple Watch, Garmin, Fitbit) en **señales accionables y comprensibles**. Los dispositivos comerciales muestran métricas estáticas o promedios superficiales; BioPulse aplica ciencia de datos real —control estadístico, entropía aproximada (ApEn) y modelos de aprendizaje automático— para detectar patrones no lineales de deterioro fisiológico temprano: fatiga del sistema nervioso autónomo, pérdida de variabilidad y riesgo incrementado de enfermedad.

La promesa de valor se resume en una frase rectora del proyecto: *"Tu laboratorio de recuperación personal — ciencia de datos real sobre tu sueño, HRV y energía, con un coach IA que te dice qué hacer mañana."*

---

## 2. Meta

La meta de BioPulse es doble y honesta:

1. **Producto:** entregar una aplicación gratuita (free-tier, costo casi nulo) que analice el cuerpo mejor que suscripciones de \$30/mes (Whoop/Oura), explicando *qué* señal importa y *por qué*, en lenguaje humano, no como una caja negra de números.
2. **Ciencia:** demostrar que un estudiante de ciencia de datos puede construir un motor de predicción de riesgo fisiológico sobre datos reales de wearables (100.000 registros reales de Whoop), con validación rigurosa (ROC, 5-fold cross-validation, matriz de confusión) y transparencia total sobre lo que es regla clínica y lo que es predicción aprendida.

El producto actual es un **MVP pre-despliegue** (en fase de prueba en Vercel, URL `https://bio-pulse-six.vercel.app`), 100% honesto: no inventa métricas ni promete curaciones.

---

## 3. Público objetivo

La audiencia inicial, definida en el plan de marketing orgánico, es:

- **Estudiantes** universitarios preocupados por su rendimiento y sueño (conexión auténtica con el creador).
- **Atletas amateur** que quieren entender su recuperación y evitar lesiones.
- **Biohackers** que aman los datos duros y rechazan el lifestyle vacío.
- **Personas con sueño o estrés problemáticos** en habla hispana (Colombia + LatAm).

La voz de marca ("el científico de datos que te habla claro") busca cercanía, curiosidad y evidencia por encima del mito. El posicionamiento competitivo es explícito y honesto: BioPulse no ataca a Whoop/Oura, sino que diferencia su enfoque (motor de ciencia de datos real + coach IA explicativo + costo casi nulo).

---

## 4. Diseño y sistema visual

### 4.1 Esquema de colores

BioPulse implementa dos paletas completas (oscura y clara) como *design tokens* centralizados en `src/components/ui.jsx`, compartidos por todos los componentes mediante un único objeto mutable `C`.

**Modo oscuro (por defecto):**
| Token | Hex | Uso |
|-------|-----|-----|
| `bg` | `#050A10` | Fondo base casi negro azulado |
| `bgSoft` | `#0A121D` | Superficies elevadas |
| `card` | `rgba(13,24,40,0.55)` | Tarjetas translúcidas (glass) |
| `teal` | `#00F5D4` | **Color de marca** — acentos, acción |
| `amber` | `#FFB703` | Advertencia / moderado |
| `rose` | `#FF0055` | Riesgo alto / alerta |
| `purple` | `#818CF8` | Métricas secundarias |
| `text` | `#F3F7FA` | Texto primario |
| `textMuted` | `#91A8BE` | Texto secundario |
| `textFaint` | `#56728C` | Texto terciario |

**Modo claro:** invierte a un fondo `#F0F4F8` / `#FFFFFF` con el teal cambiando a `#059669` (verde esmeralda) y los semánticos a rojo `#DC2626`, ámbar `#D97706` y púrpura `#6366F1`, manteniendo coherencia de significado.

El **teal de marca embebido** (`BRAND_TEAL = #22d3c5`) se usa como ancla en el 100% de todos los anillos de score. La función `scoreColor(score, kind)` interpola en HSL por tramos: teal → verde → amarillo → naranja → rojo, de modo que un score alto es "verde/teal" (calidad) y un riesgo alto es "rojo". Es una escala de *calidad*, no de intensidad.

### 4.2 Tipografías

Tres familias, cargadas vía Google Fonts y definidas en `tailwind.config.js` y en el `GLOBAL_STYLE`:

- **Space Grotesk** (display, 500–700): títulos, marca, números de sección.
- **Manrope** (sans, 400–800): texto de interfaz, cuerpo, botones.
- **IBM Plex Mono** (mono, 400–600): cifras, métricas, valores numéricos (`tabular-nums`).

Esta combinación aporta un aire técnico-científico (mono para datos) con calidez legible (Manrope) y carácter de producto (Space Grotesk).

### 4.3 Estética "iOS 26 Liquid Glass"

La app adopta el lenguaje **glassmorphism de nueva generación** (iOS 26):

- **Cajas translúcidas** con `backdrop-filter: blur(20px) saturate(140%)` y bordes sutiles de luz.
- **Fondo animado** (`body::before`): blobs de luz en teal, púrpura y ámbar que derivan lentamente (18 s de animación `ios26-drift`) y **se desplazan según la pestaña activa** mediante la variable CSS `--bg-x/--bg-y` que `TabBar` actualiza al navegar.
- **Barra inferior flotante** tipo cápsula redonda con indicador deslizante translúcido que "respira" con la navegación.
- **Granos y capas de profundidad** (`body::after`) para dar sensación de vidrio real.
- **Accesibilidad:** respeta `prefers-reduced-motion` (desactiva animaciones para usuarios sensibles).

Micro-animaciones: `pulse-ribbon` (ondas de VCF dibujándose), `tab-fade-in` (entrada de pestañas), `typing-dot` (indicador de escritura del coach), `dt-breathe` (respiración guiada).

---

## 5. Arquitectura de la aplicación

### 5.1 Estructura general

BioPulse es una **SPA React (Vite 6)**, mobile-first (ancho máximo `max-w-md`, 384 px), con cinco pestañas en la barra inferior:

`Técnico | Live | Inicio | Sueño | Ajustes`

El shell (`src/App.jsx`) envuelve toda la app en tres *providers*:
1. `ThemeProvider` — tema claro/oscuro persistente en `localStorage`.
2. `CoachProvider` — estado del coach IA **vivo y persistente entre pestañas** (montado una sola vez, fuera del contenido de tabs).
3. Hook `useBiopulseData` — aisla todo el estado de datos (fuente demo/CSV/wearable, periodo, conexiones, CSV, persistencia).

### 5.2 Las cinco pestañas

- **Inicio (Dashboard):** Héroe con `BioScoreRing` (índice de bienestar 0–100), medidor de riesgo configurable, *Plan de hoy* (3 pasos accionables cuando el riesgo ≠ BAJO), CTA al coach y tarjetas de métricas secundarias con sparklines de 7 días y delta vs. semana previa.
- **Live:** Frecuencia cardíaca "en vivo" **simulada** (onda tipo ECG generada desde el RHR), con etiqueta honesta `SIMULADO`;HRV, respiración, RHR y recuperación en tarjetas animadas. Al conectar un wearable real vía backend, estos valores pasarían a sensores en tiempo real.
- **Sueño (Sleep):** `Sleep Score` inferido desde métricas reales de la noche, con fracción de sueño profundo y RHR-en-sueño **inferenciados** (no inventados) desde HRV, RHR, eficiencia y despertares.
- **Técnico (Technical):** El "laboratorio" — mapa de energía del día, proyección de riesgo a +1/+3 días (regresión lineal honesta sobre 7 días), curvas ROC, 5-fold CV, matriz de confusión y **importancia de variables** de Random Forest. Incluye un bloque de *honestidad*: el flag de infección es regla clínica (temperatura + respiración), no predicción aprendida.
- **Ajustes (Config):** Fuente de datos (Whoop/Apple/Garmin/CSV/Fitbit), umbral de riesgo, periodo histórico, tema y privacidad.

### 5.3 Componentes de soporte

- `BioScoreRing`, `RiskScoreRing`, `EnergyMap`, `RiskForecast` — visualizaciones especializadas.
- `DataSourceModal` — importación CSV con **auto-detección de columnas** por sinónimos (`autoDetectMapping`), mapeo manual y validación (mínimo 3 días con HRV/RHR numéricos).
- `BreathSession` — respiración guiada de 2 minutos, overlay global abierto desde cualquier tab.
- `Coach` — FAB flotante + bottom-sheet de chat con streaming en vivo.
- `TabBar` — navegación glass con luz reactiva.

---

## 6. Código e ingeniería de datos

### 6.1 Pipeline de métricas (`lib/bioUtils.js`)

El corazón analítico. `computePipeline(rawDays)` enriquece datos crudos en dos fases:

1. **Scores derivados:** `sleepScore`, `stressScore`, `fatigueScore`, desviaciones `hrvDev`/`rhrDev` vs. línea base.
2. **Índice de riesgo 0–100** por contribuciones sumadas:
   - **Control estadístico (25 pts):** z-scores de 6 métricas (HRV, RHR, recuperación, respiración, temp. piel, eficiencia) en ventana de 7 días; anomalía si |z|>2.
   - **Complejidad ApEn (25 pts):** caída de entropía aproximada de la HRV (ventana 14 días) respecto al promedio — pérdida de variabilidad fisiológica.
   - **Fatiga aguda (25 pts):** regla `recuperación<40 ∧ HRV↓ ∧ RHR↑`.
   - **Proceso infeccioso (25 pts):** regla `tempPiel>1.0 ∧ resp>16`.

`riskLevel`: ALTO ≥60, MODERADO ≥30, BAJO <30.

**BioScore (0–100, mayor = mejor):** bienestar/rendimiento ponderado: 30% HRV, 20% RHR, 25% recuperación, 25% sueño.

**Datos sintéticos demo:** `generateSyntheticRawDays()` usa `mulberry32` (PRNG con semilla fija `20260724`) y distribución gaussiana reproducible, con eventos inyectados (caída de recuperación, noche de infección) para demostrar el motor sin necesidad de wearables.

### 6.2 Coach IA (`api/coach.js` + `coach/`)

Motor de dos capas con **fallback elegante**:

- **Backend Vercel Function (Node):** usa el SDK de **Groq** (modelo gratuito `llama-3.3-70b-versatile`) con **streaming SSE** (Server-Sent Events). El frontend va "escribiendo" la respuesta letra por letra.
- **Contexto por pestaña (D2):** el `system prompt` cambia según la pantalla del usuario (Inicio/Live/Sueño/Técnico/Ajustes) para dar respuestas coherentes.
- **Seguridad multicapa:** `GROQ_API_KEY` solo en servidor; rate-limit por IP (chat 10/min, advice 20/min); validación estricta de input (1–280 chars, sin inyección de prompt vía regex); sanitización de métricas (solo numéricos acotados); **stateless** (no persiste historial ni datos de salud); filtro de temas fuera de alcance y aviso de no-diagnóstico.
- **Fallback local:** si no hay API key o falla el stream, `coachEngine.js` selecciona un perfil (`selectCoachProfile`) según las métricas del día y rota mensajes de bancos (`coachMessages.js`), manteniendo la experiencia personalizada sin red.

El tono del coach es **corto y natural** (máx. 2 frases, un consejo accionable), en español, sin repetir el disclaimer ni leer números crudos.

### 6.3 Persistencia y estado

- `useBiopulseData` usa `window.storage` (abstracción tipo localStorage) para persistir conexiones, fuente personalizada (rawDays serializados), periodo histórico y umbral de riesgo.
- Importación CSV vía `papaparse` con auto-mapeo por sinónimos y validación de mínimos.

### 6.4 Stack técnico

- **Frontend:** React 18, Vite 6, Tailwind CSS 3, `recharts` (gráficos), `lucide-react` (íconos), `papaparse` (CSV).
- **Backend:** Vercel Functions (Node), `groq-sdk`, `@supabase/supabase-js` (preparado para persistencia futura).
- **Despliegue:** Vercel (`vercel.json`: build `npm run build`, rewrite SPA a `index.html`).

---

## 7. Desarrollo y metodología

El repositorio refleja una evolución disciplinada: desde el `IDEA.md` (planteamiento de necesidad y roadmap de 8 fases) hasta un MVP funcional con ingeniería de calidad. Decisiones de diseño notables:

- **Tema reactivo:** `theme.jsx` usa un contador `forceVersion` para forzar re-render global al cambiar de tema, solucionando el problema de mutar un objeto compartido sin disparar render.
- **Coach persistente:** el chat no se desmonta al cambiar de pestaña (montado una sola vez en `App`), preservando historial y estado.
- **Honestidad por diseño:** etiquetas `SIMULADO` en Live, notas de "regla clínica vs. predicción aprendida" en Técnico, y disclaimer de no-diagnóstico siempre visible.
- **Curvas suaves:** `buildSmoothPath` (Catmull-Rom → Bézier cúbica) imita Apple Health/Oura, evitando picos irrealistas.

El flujo de trabajo usa Git (rama `main`, commits en español), GitHub (`Emelecto`/`ecardona1304-5447`) y despliegue continuo en Vercel.

---

## 8. Marketing y crecimiento

BioPulse tiene un **master plan de marketing orgánico \$0** (TikTok + Instagram Reels + SEO), documentado en `ROADMAP_MARKETING_BIOPULSE.md` y `PLAN_MERCADEO_ORGANICO.md`, orquestado por un *crew* de agentes (REACH, SCOUT, SCRIBE, DEV, TONY).

### 8.1 Estrategia

- **Posicionamiento:** "Fitness Tech / Biohacking cuantificado" (datos duros, no lifestyle). Nicho primario entrenado algorítmicamente desde una cuenta nueva.
- **Brand Persona:** "el científico de datos que te habla claro" — voz de hermano mayor experto, sin jerga.
- **Pilares (regla 80/20):** Educativo 40%, Entretenimiento 25%, Emocional 20%, Evidencia 15%.
- **Ganchos:** 10 visuales + 10 verbales de alto impacto (ej. *"Tu smartwatch te está mintiendo sobre tu recuperación"*).
- **Calendario 90 días:** Mes 1 (0→10k seguidores), Mes 2 (10k→40k, comunidad), Mes 3 (40k→100k, embudo web + waitlist).
- **Embudo:** Reels → linktr.ee → landing (Vercel) → waitlist → newsletter → blog SEO.
- **Tácticas \$0:** UGC (#BioPulseChallenge), micro-colabs, Lives semanales, carruseles guardables, cross-post a YouTube Shorts.

### 8.2 KPIs

Watch time >50%, completion >40%, shares >50/video, saves >30/video, waitlist 2.000 en Mes 3, conversión web→waitlist >8%. **Visión anual:** Q1 100k seguidores + embudo; Q2 lanzamiento abierto (freemium); Q3 YouTube + blog SEO; Q4 referente LatAm en biohacking cuantificado y material de inversión con cifras reales.

---

## 9. Ideas visionarias y creativas

BioPulse no es solo una app de métricas; es una **propuesta de producto de impacto alto**:

- **Gemelo digital de recuperación:** el mapa de energía del día y la proyección de riesgo a 3 días son una primera forma de "predecir tu cuerpo" sin magia.
- **Coach IA contextual y honesto:** no vende diagnóstos, sino un "hermano mayor biohacker" que explica *por qué* y *qué hacer*, con fallback local que nunca rompe la UX.
- **Democratización:** un Whoop de \$30/mes reconstruido gratis por un estudiante, con código abierto y ciencia transparente.
- **Diferenciación vs. Whoop:** motor de ciencia de datos real (ApEn + Random Forest + control estadístico) que dice QUÉ importa y POR QUÉ, no solo un número.
- **Contenido como producto:** el plan de marketing "construyendo en público" convierte el desarrollo mismo en tracción orgánica.
- **Escalabilidad:** backend serverless listo para Supabase (persistencia multiusuario) y conexión OAuth real a wearables (Fitbit/Whoop) en el roadmap.

---

## 10. Conclusión

BioPulse es un proyecto donde la **ciencia de datos rigurosa**, el **diseño de producto de alta calidad** (iOS 26 glass, paleta teal, tipografías técnicas) y una **estrategia de marketing honesta y orgánica** convergen en un MVP funcional y desplegable. Su valor diferencial no es solo técnico —es la transparencia: cada score explica su origen, cada límite es declarado, y el coach acompaña sin diagnósticos falsos. Es, en esencia, el laboratorio de recuperación personal que la audiencia hispanohablante estaba esperando.

---

*Documento generado por Scribe · basado en inspección directa del repositorio `biopulse-vite` (App.jsx, ui.jsx, bioUtils.js, coach/, componentes, api/coach.js, documentos de marketing y IDEA.md).*
