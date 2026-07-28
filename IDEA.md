**Proyecto Ciencia De Datos EIA Primer Semestre**

Plataforma de Analitica Biometrica Predictiva y Prevencion de Riesgos de Salud

Nombre del proyecto: BIO PULSE  
Por: Emilio Cardona, Miguel Vasquez, Lucas Velez

Planteamiento De La Necesidad:  
Los dispositivos biométricos portatiles (wearables) como Fitbit o Whoop generan un gran volumen de datos diarios. Sin embargo estas mismas empresas se limitan a mostrar metricas estaticas o analisis superficiales (como promedios simples de pasos, sueño y fatiga) omitiendo patrones no lineales de salud que podrian dar alertas sobre un deterioro fisico temprano, fatiga del sistema nervioso o riesgo incrementado de caidas y enfermedades en adultos mayores.

Solucion Propuesta:  
Usando estos wearables se pueden extraer todos los datos necesarios usando las API KEYS de los dispositivos para crear sistemas de predicción usando la ciencia de datos.

Se analizan metricas como: HR, HRV, RHR, VO2 Max, SpO2, variabilidad del sueño, asimetria de pasos y el giroscopio de los propios wearables para crear modelos predictivos de tipo: Random Forest Classifier, Modelo Estadistico De Control (deteccion de anomalias por desviacion estandar) y ApEn (Algoritmo Analitico No Lineal) los cuales calculan y identifican un porcentaje de riesgo.

ROADMAP:

Fase 1: Definicion de metricas de salud y algoritmos analiticos  
Fase 2: Desarrolo  
Fase 3: Pruebas con datos generados por otros usuarios  
Fase 4: Creacion del MVP  
Fase 5: Integracion directa con API de Fitbit y Whoop  
Fase 6: Pruebas con usuarios en vivo  
Fase 7: Cambios finales  
Fase 8: Despliegue en la nube

Notas:  
Dataset usado para los datos de fitbit y whoop: FitBit Fitness Tracker Data  
Whoop trackerdataset  
(De Kaggle)
