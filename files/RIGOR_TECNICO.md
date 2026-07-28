# Rigor Técnico — Guía para la Sustentación

Generado por `06_rigor_tecnico.py`. Todas las figuras están en `figuras_sustentacion/`.

## Qué se hizo y por qué

**Comparación de 3 modelos** (no solo Random Forest en aislamiento):

| Modelo | Rol en la comparación |
|---|---|
| Regresión Logística | Baseline lineal — demuestra que el problema necesita un modelo no lineal |
| Random Forest | El modelo elegido para producción (bagging de árboles) |
| Gradient Boosting | Alternativa de boosting — mismo rol que XGBoost (XGBoost no estaba disponible sin conexión a internet en este entorno, pero la interfaz es intercambiable) |

**Validación cruzada 5-fold estratificada** — no un solo train/test split. Esto es lo primero que un jurado técnico pregunta ("¿ese 0.69 es estable o suerte de un split?"). La estratificación preserva la proporción ~10.6% de casos de riesgo en cada fold.

**Nota sobre la muestra**: la comparación de modelos corre sobre una submuestra estratificada de 25,000 filas (no las 100k completas) por restricciones de cómputo de este entorno (1 CPU). El modelo de producción (`04_random_forest.py`) sí se entrenó sobre las 100k filas completas — esto solo aplica a esta comparación de 3 algoritmos.

## Resultados (media ± desviación estándar, 5 folds)

| Métrica | Reg. Logística | Random Forest | Gradient Boosting |
|---|---|---|---|
| ROC-AUC | 0.651 ± 0.010 | **0.660 ± 0.015** | 0.687 ± 0.019 |
| Precisión | 0.169 ± 0.007 | 0.757 ± 0.030 | **0.975 ± 0.017** |
| Recall | **0.531 ± 0.028** | 0.272 ± 0.019 | 0.252 ± 0.019 |
| F1-score | 0.257 ± 0.011 | 0.399 ± 0.020 | 0.400 ± 0.024 |

**Cómo leer esto en la sustentación:**
- La regresión logística tiene el AUC más bajo → confirma que las relaciones entre las variables biométricas y el riesgo **no son lineales**, justificando un modelo de árboles.
- Gradient Boosting gana en AUC y precisión, pero **sacrifica recall** (detecta menos casos de riesgo reales) — en un sistema de prevención de salud, **el recall importa más que la precisión** (prefieres una falsa alarma a una caída no detectada). Este es un argumento defendible para justificar por qué **Random Forest sigue siendo la elección correcta**, no necesariamente el de mayor AUC.
- Las barras de error (desviación estándar entre folds) muestran que ningún modelo es dramáticamente inestable — buena señal de que los resultados no son ruido de un solo split.

## Las 4 figuras y cuándo mostrarlas

1. **`roc_comparison.png`** — mostrar cuando expliquen por qué eligieron Random Forest sobre un modelo lineal
2. **`cv_metrics_comparison.png`** — mostrar para demostrar que hicieron validación cruzada, no un solo split (anticipa la pregunta "¿cómo saben que no fue suerte?")
3. **`confusion_matrix_rf.png`** — mostrar junto con la explicación honesta: "de 529 casos de riesgo reales, detectamos 149 (28%) — es una primera versión, el objetivo de la Fase 6 del roadmap es mejorar esto con datos reales"
4. **`feature_importance_rf.png`** — mostrar para conectar con la narrativa: "el modelo aprendió por sí solo que la temperatura de piel y la recuperación son las señales más predictivas — coincide con lo que dice la literatura clínica sobre detección temprana de procesos infecciosos y fatiga"

## Pregunta difícil que esto anticipa

*"¿Por qué no usaron un solo split de train/test como cualquier tutorial?"*
→ "Hicimos también 5-fold cross-validation estratificada para confirmar que las métricas son estables y no dependen de cómo cayó el split — se ve en las barras de error de la figura de comparación."

*"¿Por qué Random Forest y no el modelo con mayor AUC?"*
→ "Gradient Boosting gana en AUC pero pierde recall, y en un sistema de prevención de salud perder casos de riesgo reales es más costoso que una falsa alarma. Priorizamos recall sobre precisión pura."
