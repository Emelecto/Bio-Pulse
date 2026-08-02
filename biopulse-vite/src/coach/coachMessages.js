// ============================================================
// COACH MESSAGES — banco de >100 mensajes utiles y coherentes
// con las metricas del usuario. Se usan como fallback cuando no
// hay LLM (o como capa de seguridad si el LLM falla).
// Cada banco representa un "perfil del dia" derivado de metricas.
// El motor (coachEngine.js) elige el banco y rota el mensaje.
// ============================================================

export const COACH_BANKS = {
  riesgoAlto: [
    { t: "Riesgo alto hoy", a: "Tu indice de riesgo esta en zona alta. Reduce la carga fisica 48 h, prioriza sueno y vigila si aparecen sintomas. No entrenes en intensidad alta hoy." },
    { t: "Cuerpo en alerta", a: "Varias senales apuntan a estres fisiologico. Baja el ritmo: caminata suave, hidratacion y 8 h de sueno. Reevalua manana." },
    { t: "Prioriza recuperar", a: "Con el riesgo alto, el mejor entrenamiento es el descanso. Movilidad ligera y respiracion 4-7-8 antes de dormir." },
    { t: "No fuerces hoy", a: "Tu sistema lo senala: hoy toca recuperar. Sustituye el HIIT por estiramiento y una cena ligera." },
    { t: "Escucha al cuerpo", a: "Riesgo elevado = senal de no pasar. Haz algo suave y observa como te sientes en 24 h." },
    { t: "Protege tu salud", a: "Con riesgo alto, lo prudente es pausar. Recupera y reevalua manana con datos nuevos." },
    { t: "Menos hoy", a: "El riesgo alto indica capacidad reducida. Menos volumen hoy protege tu progreso a largo plazo." },
  ],
  fatigaAguda: [
    { t: "Fatiga aguda", a: "HRV baja y RHR alta: recuperacion insuficiente. Baja la carga 24-48 h y duerme 8 h antes de volver a intensidad." },
    { t: "Recuperacion baja", a: "Tus marcadores de recuperacion estan por debajo de lo habitual. Evita el entrenamiento duro hoy; enfocate en descanso activo." },
    { t: "Cuerpo cansado", a: "La fatiga aguda pide pausa. Una sesion suave de 20 min ayuda a circular sin sumar fatiga." },
    { t: "No es el dia de PR", a: "Con fatiga aguda, empujar trae mas riesgo que beneficio. Repite el estimulo cuando la HRV repunte." },
    { t: "Deja que repare", a: "Tu cuerpo necesita tiempo de reparacion. Sueno profundo y nutricion son el entrenamiento de hoy." },
    { t: "Pausa inteligente", a: "La fatiga aguda no se entrena: se respeta. Una pausa de 48 h acelera tu vuelta fuerte." },
    { t: "Senas claras", a: "HRV y RHR lo dicen alto: hoy el cuerpo pide menos. Obedece la senal." },
  ],
  suenoMalo: [
    { t: "Sueno corto", a: "Dormiste poco. Hoy evita HIIT y prioriza ir a dormir temprano; la deuda de sueno se paga durmiendo, no entrenando." },
    { t: "Eficiencia baja", a: "Tu sueno fue fragmentado. Baja la intensidad y crea rutina nocturna: luz baja y sin pantallas 1 h antes." },
    { t: "Recupera durmiendo", a: "Pocas horas de sueno limitan la recuperacion. Un dia de menor carga protege tu rendimiento de manana." },
    { t: "Cuidado con el sueno", a: "La falta de sueno eleva el riesgo de lesiones. Haz movilidad y duerme 8 h para cerrar la brecha." },
    { t: "Prioriza dormir", a: "Hoy el entrenamiento mas potente es acostarte pronto. La adaptacion ocurre mientras duermes." },
    { t: "Deuda de sueno", a: "La deuda de sueno baja tu HRV. Recuperala durmiendo mas, no entrenando mas." },
    { t: "Rutina nocturna", a: "Crea una rutina: misma hora, luz baja, sin pantallas. Tu sueno lo agradecera." },
  ],
  recuperacionBuena: [
    { t: "Buen margen hoy", a: "Recuperacion alta y HRV estable: tu cuerpo tiene margen. Es un buen dia para estímulo de calidad." },
    { t: "Dia para empujar", a: "Tus marcadores de recuperacion estan fuertes. Aprovéchalo para un trabajo de intensidad moderada-alta." },
    { t: "Listo para carga", a: "Buena base de recuperacion: entrena con confianza, pero manten progresion gradual." },
    { t: "Cuerpo dispuesto", a: "Todo indica recuperacion sólida. Un dia asi es ideal para tecnica o volumen de calidad." },
    { t: "Aprovecha el estado", a: "Tu sistema esta listo. Entrena hoy sabiendo que tienes margen para adaptarte." },
    { t: "Ventana abierta", a: "Recuperacion buena = ventana de adaptacion. Aprovechala con trabajo de calidad." },
    { t: "Confianza", a: "Tus marcadores estan fuertes. Entrena con confianza y manten progresion." },
  ],
  hrvAlta: [
    { t: "HRV alta", a: "Tu variabilidad esta alta: el sistema parasimpatico domina. Buen momento para entrenamiento de calidad o estimulo nuevo." },
    { t: "Sistema calmado y fuerte", a: "HRV alta sugiere buen equilibrio autonomico. Puedes pedir un poco mas hoy sin riesgo excesivo." },
    { t: "Margen amplio", a: "Con HRV alta tienes margen de adaptacion. Empuja en el trabajo clave de la sesion." },
    { t: "Dia de calidad", a: "La HRV alta indica reserva. Usala en el segmento mas exigente de tu entrenamiento." },
    { t: "Ventana favorable", a: "Tu HRV sugiere ventana favorable. Aprovecha para estimulo que demande recuperacion." },
    { t: "Reserva disponible", a: "HRV alta indica reserva parasimpatica. Buen dia para reto controlado." },
    { t: "Tono alto", a: "Tu tono vagal esta alto: el cuerpo esta en modo recuperar y crecer, no sobrevivir." },
  ],
  hrvBaja: [
    { t: "HRV baja", a: "Tu variabilidad esta reducida: el cuerpo en modo supervivencia. Reduce estres y prioriza sueno profundo." },
    { t: "Poco margen", a: "HRV baja limita la capacidad de adaptacion. Sesion suave hoy y observa tendencia en 48 h." },
    { t: "Protege tu sistema", a: "Con HRV baja, evita estimulos fuertes. Respiracion lenta 10 min ayuda a recuperar el tono parasimpatico." },
    { t: "No es dia de mas", a: "La HRV baja pide menos, no mas. Camina, estira y duerme bien." },
    { t: "Senal de cautela", a: "HRV baja es senal de cautela. Baja la carga y revisa sueno y estres." },
    { t: "Recupera el tono", a: "HRV baja indica tono vagal bajo. Sueno y respiracion lenta lo restauran." },
    { t: "No ignores la senal", a: "HRV baja persistente merece atencion: ajusta carga y observa 48 h." },
  ],
  estresAlto: [
    { t: "Estrés alto", a: "Tu frecuencia respiratoria esta elevada. 5 min de respiracion 4-7-8 antes de dormir bajan la activacion simpatica." },
    { t: "Sistema activado", a: "Marcadores de estres altos: evita cafeina tarde y haz descarga de tension con estiramiento suave." },
    { t: "Baja la presion", a: "El estres eleva el riesgo. Una caminata en naturaleza o 10 min de respiracion consciente ayudan hoy." },
    { t: "Desactivar", a: "Tu cuerpo esta en alerta. Baja estímulos fuertes y crea un final de dia tranquilo." },
    { t: "Gestiona la carga mental", a: "Estrés alto suma al fisiologico. Prioriza sueno y desconexion para recuperar el equilibrio." },
    { t: "Pausa mental", a: "El estres alto tambien es mental. 10 min de desconexion bajan la activacion simpatica hoy." },
    { t: "Equilibrio", a: "Mantener el equilibrio entre carga y recuperacion es la clave cuando el estres esta alto." },
  ],
  rhrAlta: [
    { t: "RHR elevada", a: "Tu frecuencia cardiaca en reposo subio. Puede ser fatiga, deshidratacion o estres. Hidratate y baja la carga hoy." },
    { t: "Corazon mas rapido", a: "RHR alta sugiere menor recuperacion. Evita esfuerzo duro y vigila como evoluciona en reposo." },
    { t: "Senal de cautela", a: "RHR elevada = menor margen. Sesion suave y mas sueno para normalizarla." },
    { t: "Vigila la RHR", a: "Tu RHR alta pide precaucion. Si persiste varios dias, revisa sueno, hidratacion y estres." },
    { t: "Menos hoy", a: "Con RHR alta, menos es mas. Movilidad y descanso aceleran la normalizacion." },
  ],
  rhrBaja: [
    { t: "RHR baja", a: "Tu frecuencia en reposo esta baja: buen signo de eficiencia cardiaca y recuperacion." },
    { t: "Corazon eficiente", a: "RHR baja indica buen estado de fondo. Aprovecha para trabajo aerobico de calidad." },
    { t: "Buena base", a: "Tu RHR baja sugiere preparacion sólida. Un dia asi tolera bien carga moderada." },
    { t: "Signo positivo", a: "RHR baja es senal de adaptacion. Entrena con confianza hoy." },
    { t: "Eficiencia cardiaca", a: "Tu RHR baja refleja buen acondicionamiento. Manten tu rutina y progresa." },
  ],
  strainAlto: [
    { t: "Strain alto", a: "Mucha carga acumulada. Programa una zona de recuperacion hoy; tu cuerpo lo agradecera." },
    { t: "Cuerpo cargado", a: "Strain elevado: baja intensidad y prioriza sueno profundo para cerrar la brecha." },
    { t: "Compensa", a: "Dia de alto esfuerzo: compensa con nutricion y estiramiento, no sumes fatiga." },
    { t: "Reduce hoy", a: "El strain alto pide reducir. Sesion suave o descanso activo para equilibrar." },
    { t: "Protege tu rendimiento", a: "Strain alto sin recuperacion lleva al sobreentrenamiento. Hoy toca menos." },
  ],
  respAlta: [
    { t: "Resp. elevada", a: "Tu frecuencia respiratoria subio: puede ser estres o proceso inflamatorio. Observa y descansa hoy." },
    { t: "Respiracion rapida", a: "Resp. alta sugiere activacion. Respiracion lenta 4-7-8 y ambiente calmo ayudan." },
    { t: "Senal de vigilancia", a: "Resp. elevada sumada a otras senales puede indicar proceso infeccioso. Si hay fiebre, consulta." },
    { t: "Vigila", a: "Tu resp. alta pide cautela. Baja la carga y mantente hidratado y en reposo." },
    { t: "Cuidado", a: "Resp. alta es senal de posible sobrecarga. Prioriza recuperacion y sueno." },
  ],
  procesoInfeccioso: [
    { t: "Posible proceso infeccioso", a: "Temperatura y frec. respiratoria elevadas sugieren respuesta inflamatoria. Reposo y hidratacion; si hay fiebre, consulta." },
    { t: "No entrenes hoy", a: "Senales de proceso infeccioso: el ejercicio intenso empeora la recuperacion. Descansa y vigila sintomas." },
    { t: "Reposo medical", a: "Tus marcadores apuntan a posible infeccion. Reposo, liquidos y consulta si empeoras en 24 h." },
    { t: "Cuerpo combatiendo", a: "Posible proceso infeccioso detectado. No entrenes; deja que tu sistema inmune trabaje." },
    { t: "Vigilancia medica", a: "Resp. y temp. elevadas: evita esfuerzo y considera atencion medica si aparecen sintomas claros." },
  ],
  diaBueno: [
    { t: "Dia en tu rango", a: "Tus metricas estan dentro de lo habitual. Manten tu rutina y vigila el sueno para cerrar fuerte." },
    { t: "Todo coherente", a: "Todo coherente con tu base: un dia asi es ideal para progresion suave." },
    { t: "Estabilidad", a: "Metricas estables: refuerza habitos (hidratacion, sueno, movilidad) y disfruta el dia." },
    { t: "Ritmo saludable", a: "Tu variabilidad se mantiene. Manten rutina y vigila el sueno para cerrar la semana bien." },
    { t: "Buen momento", a: "Sin desviaciones vs tu base. Aprovecha para movimiento activo y comida nutritiva." },
    { t: "Dia estable", a: "Tu cuerpo esta en equilibrio. Manten lo simple y consistente hoy." },
    { t: "Rumbo firme", a: "Metricas en rango: sigue tu plan. La constancia es el musculo mas importante." },
  ],
  hidratacion: [
    { t: "Hidratate", a: "Buen momento para reforzar hidratacion: incide en HRV, recuperacion y regulacion termica." },
    { t: "Liquidos", a: "Mantener hidratacion ayuda a la recuperacion y al control de la frec. cardiaca en reposo." },
    { t: "Agua y recuperacion", a: "La hidratacion es base de la recuperacion. Lleva una botella y bebe de forma constante." },
    { t: "No olvides el agua", a: "Un dia estable es buen momento para afinar habitos: hidratacion constante y sueno regular." },
    { t: "Habeito clave", a: "Hidratarte bien hoy protege tu HRV manana. Pequenas acciones, gran efecto acumulado." },
  ],
  calor: [
    { t: "Exposicion al calor", a: "Si entrenas con calor, anticipa perdida de liquidos: hidratate antes, durante y despues." },
    { t: "Calor y HRV", a: "El calor puede bajar HRV temporalmente. Reduce intensidad y vigila recuperacion." },
    { t: "Ambiente calido", a: "En dias calurosos, entrena temprano o en sombra y prioriza enfriamiento posterior." },
    { t: "Precaucion termica", a: "El estres termico suma al fisiologico. Baja carga y protege tu recuperacion." },
    { t: "Enfriamiento", a: "Tras exposicion al calor, enfriamiento gradual ayuda a normalizar RHR y HRV." },
  ],
  tecnicos: [
    { t: "Tu indice es heurístico", a: "El indice 0-100 combina control estadistico (z-scores), complejidad ApEn, fatiga aguda e infeccion. No es diagnostico." },
    { t: "Sobre los modelos", a: "Usamos 3 enfoques: control estadistico (tu linea base), ApEn (complejidad de la HRV) y patrones agudo/infeccioso. Detalle en la pestaña Técnico." },
    { t: "Por que z-scores", a: "Comparar contra TU linea base, no contra poblacion, detecta desviaciones tempranas personales." },
    { t: "Limite honesto", a: "El flag de infeccion se deriva de temperatura y respiracion (casi deterministico). Es regla clinica, no prediccion aprendida." },
    { t: "No es caja negra", a: "Puedes ver el peso de cada variable en la pestaña Técnico. La trazabilidad importa." },
  ],
  motivacion: [
    { t: "Pequeño paso", a: "La consistencia vence a la intensidad. Un paso hoy suma al cambio de largo plazo." },
    { t: "Progreso real", a: "No compares tu dia malo con el mejor de otro. Compara contra tu propia linea base." },
    { t: "Construyendo", a: "Cada dia en rango es ladrillo de tu resiliencia. Sigue construyendo." },
    { t: "Enfoque", a: "El cuerpo mejora en el descanso, no solo en el esfuerzo. Equilibra ambos." },
    { t: "A largo plazo", a: "Las variables que sigues hoy son las que deciden tu salud de manana." },
  ],
};

// Perfiles de dia -> banco. El engine decide segun metricas.
export const COACH_PROFILE_ORDER = [
  "procesoInfeccioso", "riesgoAlto", "fatigaAguda", "suenoMalo",
  "estresAlto", "rhrAlta", "respAlta", "strainAlto", "hrvBaja",
  "recuperacionBuena", "hrvAlta", "rhrBaja", "calor", "hidratacion", "diaBueno", "motivacion",
];
