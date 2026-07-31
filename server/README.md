# Backend proxy de BioPulse (Fase 5 del roadmap)

Backend mínimo en Node/Express que:

1. **Resuelve CORS** — las APIs de Fitbit y Whoop no aceptan llamadas
   desde el navegador (localhost), así que la app siempre habla con este
   proxy y el proxy habla con las APIs.
2. **Protege el OAuth** — el intercambio de `code` por `access_token`
   usa el `client_secret`, que jamás debe estar en el frontend. Vive en
   `server/.env`.
3. **Normaliza** — cada API devuelve JSON con su propia forma. El módulo
   `normalize.js` lo convierte al esquema canónico del pipeline
   (`{ date, hrv, rhr, recovery, sleepHours, ... }`) así los 3 modelos
   de BioPulse funcionan igual sin importar la fuente.

## Estructura
```
server/
  index.js            # Express: /api/:provider/{auth-url,token,daily}
  normalize.js        # Fitbit/Whoop/Google -> esquema canonico
  test-normalize.js   # Test con fixtures de la API real (node test-normalize.js)
  .env.example        # Plantilla de credenciales
  package.json
```

## Proveedores soportados

| Proveedor | Estado | Notas |
|-----------|--------|-------|
| `whoop`   | ✅ Listo | API REST abierta (developer.whoop.com). Requiere membresía Whoop. |
| `fitbit`  | ⚠️ Legado | Fitbit Web API en cierre (migra a Google Health). Por si acaso. |
| `google`  | ⚠️ Best-effort | Google Fit REST API en proceso de cierre/migración a Health Connect (solo Android). El proveedor está cableado pero la API puede no responder (devuelve 0 días o 4xx). Requiere habilitar "Fitness API" en Google Cloud y usar un `client_id` tipo "web". |

> **Nota honesta sobre Google**: el `client_id` tipo "web" de Google Cloud sirve
> para autenticar, pero Google Fit REST API está siendo desactivada. Health
> Connect (el reemplazo) es una API **solo Android** que no se consulta desde
> un servidor con un `access_token`. Por eso `google` es best-effort: el código
> está listo, pero es probable que no devuelva datos en producción.

## Arranque
```bash
cd server
npm install
cp .env.example .env      # pega tus credenciales
npm start                 # http://localhost:4000
```
Comprueba salud: `http://localhost:4000/api/health`

## Test de normalización (no requiere credenciales)
```bash
node test-normalize.js
```
Valida que la respuesta cruda de cada API se mapee bien al esquema del
pipeline, con fixtures que imitan la estructura exacta de Fitbit Web API
y Whoop API v1.

## Flujo OAuth real (cuando tengas credenciales)
Sustituye `:provider` por `fitbit`, `whoop` o `google`:
1. App pide `GET /api/:provider/auth-url` → abre la URL en el navegador.
2. El usuario autoriza → el proveedor redirige a `redirect_uri` con `?code=...`.
3. App hace `POST /api/:provider/token { code }` → recibe `access_token`.
4. App hace `GET /api/:provider/daily?days=30` con `Authorization: Bearer ***
   → recibe filas normalizadas listas para el pipeline.

Nota: para `google`, el `redirect_uri` debe coincidir exactamente con el
configurado en Google Cloud Console (ej. `https://bio-pulse-six.vercel.app/callback/google`).

## Credenciales (ver README del repo raíz, sección "Cuentas de desarrollador")
- Fitbit: https://dev.fitbit.com → Register an App (legado, en cierre)
- Whoop:  https://developer.whoop.com → Create Application (requiere membresía)
- Google: Google Cloud Console → crea un "OAuth client" tipo **web** →
  habilita **Fitness API**. Best-effort (ver tabla arriba).
