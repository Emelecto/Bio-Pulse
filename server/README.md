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
  normalize.js        # Fitbit -> esquema y Whoop -> esquema
  test-normalize.js   # Test con fixtures de la API real (node test-normalize.js)
  .env.example        # Plantilla de credenciales
  package.json
```

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
1. App pide `GET /api/fitbit/auth-url` → abre la URL en el navegador.
2. El usuario autoriza → Fitbit redirige a `redirect_uri` con `?code=...`.
3. App hace `POST /api/fitbit/token { code }` → recibe `access_token`.
4. App hace `GET /api/fitbit/daily?days=30` con `Authorization: Bearer <token>`
   → recibe filas normalizadas listas para el pipeline.

## Credenciales (ver README del repo raíz, sección "Cuentas de desarrollador")
- Fitbit: https://dev.fitbit.com → Register an App
- Whoop:  https://developer.whoop.com → Create Application
