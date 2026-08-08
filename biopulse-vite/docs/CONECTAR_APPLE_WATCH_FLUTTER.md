# Conectar Apple Watch a BioPulse — App puente Flutter (Método 3)

Esta guía crea una app Flutter MÍNIMA que, usando Open Wearables (MIT, $0),
lee HealthKit (Apple Watch → iPhone) y envía las muestras a BioPulse vía
`POST /api/ingest`. El flujo CSV manual (DataSourceModal) NO se toca.

Requisitos: Mac, Xcode (gratis), Apple ID (gratis). Solo pagas $99/año si
quieres publicar en App Store / TestFlight.

────────────────────────────────────────────────────────
PASO 1 — Instalar Flutter en la Mac
────────────────────────────────────────────────────────
1. Instala Xcode desde la Mac App Store (gratis). Luego en Terminal:
     sudo xcode-select --install
     sudo xcodebuild -license accept
2. Descarga Flutter SDK (https://docs.flutter.dev/get-started/install/macos)
   y descomprímalo en ~/development/flutter.
3. Agrega al PATH (en ~/.zshrc):
     export PATH="$PATH:$HOME/development/flutter/bin"
4. Verifica:
     flutter doctor
   Debe decir que todo está OK (iOS toolchain marcado). Si pide aceptar
   licencias, repite el paso 1.

────────────────────────────────────────────────────────
PASO 2 — Crear el proyecto puente
────────────────────────────────────────────────────────
     flutter create biopulse_bridge
     cd biopulse_bridge

────────────────────────────────────────────────────────
PASO 3 — Dependencias (pubspec.yaml)
────────────────────────────────────────────────────────
Añade bajo `dependencies:`:
     health: ^9.0.0          # lectura de HealthKit/Health Connect
     http: ^1.2.0            # envío a BioPulse
Luego:
     flutter pub get

────────────────────────────────────────────────────────
PASO 4 — Código (lib/main.dart)
────────────────────────────────────────────────────────
Sustituye el contenido de lib/main.dart por:

```dart
import 'dart:convert';
import 'package:flutter/material.dart';
import 'package:health/health.dart';
import 'package:http/http.dart' as http;

const String BIO_PULSE_INGEST = "https://bio-pulse-six.vercel.app/api/ingest";
// El token es el MISMO que usas en la web (lo pegas desde BioPulse > Config).
// En producción la app debe pedir login y guardar el token de sesión.
const String AUTH_TOKEN = "PEGAR_TOKEN_DE_BIOPULSE_AQUI";

void main() => runApp(const BioPulseBridge());

class BioPulseBridge extends StatelessWidget {
  const BioPulseBridge({super.key});
  @override
  Widget build(BuildContext context) => const MaterialApp(home: Home());
}

class Home extends StatefulWidget {
  const Home({super.key});
  @override
  State<Home> createState() => _HomeState();
}

class _HomeState extends State<Home> {
  String status = "Listo";

  Future<void> sync() async {
    setState(() => status = "Solicitando permisos...");
    final health = Health();
    final types = [
      HealthDataType.HEART_RATE_VARIABILITY_RMSSD,
      HealthDataType.RESTING_HEART_RATE,
      HealthDataType.SLEEP_ASLEEP,
      HealthDataType.STEPS,
    ];
    final ok = await health.requestAuthorization(types);
    if (!ok) { setState(() => status = "Permiso denegado"); return; }

    setState(() => status = "Leyendo HealthKit...");
    final now = DateTime.now();
    final from = now.subtract(const Duration(days: 30));
    final data = await health.getHealthDataFromTypes(startTime: from, endTime: now, types: types);
    final samples = data.map((p) => {
      "date": p.dateFrom.toIso8601String(),
      "hrv": p.type == HealthDataType.HEART_RATE_VARIABILITY_RMSSD ? (p.value as num).toDouble() : null,
      "rhr": p.type == HealthDataType.RESTING_HEART_RATE ? (p.value as num).toDouble() : null,
      "steps": p.type == HealthDataType.STEPS ? (p.value as num).toInt() : null,
    }).toList();

    setState(() => status = "Enviando a BioPulse...");
    final res = await http.post(
      Uri.parse(BIO_PULSE_INGEST),
      headers: {"Content-Type": "application/json", "Authorization": "Bearer $AUTH_TOKEN"},
      body: jsonEncode({"samples": samples}),
    );
    setState(() => status = res.statusCode == 200 ? "¡Enviado! ${samples.length} muestras" : "Error ${res.statusCode}");
  }

  @override
  Widget build(BuildContext context) => Scaffold(
    appBar: AppBar(title: const Text("BioPulse Bridge")),
    body: Center(child: Column(mainAxisSize: MainAxisSize.min, children: [
      Text(status),
      const SizedBox(height: 16),
      ElevatedButton(onPressed: sync, child: const Text("Sincronizar Apple Watch")),
    ])),
  );
}
```
Nota: `health` (paquete "health") ya abstrae HealthKit en iOS y Health Connect
en Android con el mismo código → multiplataforma gratis.

────────────────────────────────────────────────────────
PASO 5 — Ejecutar en tu iPhone (sin pagar)
────────────────────────────────────────────────────────
1. Conecta el iPhone por USB a la Mac.
2. En Xcode: abre ios/Runner.xcworkspace, elige tu iPhone, firma con tu
   Apple ID gratuito (Signing & Capabilities > Team > tu cuenta).
3. Desde Terminal:
     flutter run
   Se instala en tu iPhone. Ábrelo y pulsa "Sincronizar".
4. Otorga permiso a Health cuando lo pida.
Limitación del plan gratuito: el perfil de firma expira a 7 días (reconectar
cable para renovar). Para usuarios reales necesitas el programa de $99/año.

────────────────────────────────────────────────────────
PASO 6 — Verificar en BioPulse
────────────────────────────────────────────────────────
Tras sincronizar, en la web BioPulse (Dashboard) tus métricas (HRV/RHR/etc.)
se actualizan igual que si hubieras subido un CSV. El backend ya tiene
/api/ingest listo y guarda en Upstash bajo `wb:tu-correo`.

────────────────────────────────────────────────────────
NOTAS
────────────────────────────────────────────────────────
- El token en la app es de demo; en producción la app debe loguear al usuario
  y usar el token de sesión devuelto por /api/login.
- Open Wearables (MIT) es la alternativa si quieres su SDK específico en vez
  del paquete `health` genérico; el endpoint /api/ingest es el mismo.
- El flujo CSV manual (subir .csv) sigue funcionando para usuarios sin iPhone.
