# Interviewr 🎙️

Una app de entrevistas adaptativas con IA: en lugar de un cuestionario fijo, una entrevistadora virtual (Claude) escucha, repregunta y decide cuándo cerrar la conversación. Todo es mobile-first, con captura de voz y resúmenes automáticos para tu equipo.

## TL;DR
- **Admin** crea entrevistas con objetivo + contexto en la vista privada (`/`).
- **Participantes** reciben un link único (`/interview/[id]`) y responden por voz o texto.
- **Dashboard** (`/dashboard/[id]`) muestra respuestas en vivo y puede pedir resúmenes AI bajo demanda.

## Características principales
- 🎙️ **Entrevistadora adaptativa** con Anthropic Claude: sin árbol de preguntas rígido.
- 🗣️ **Entrada por voz** (MediaRecorder en el navegador) + transcripción local con Whisper (`python3 -m whisper`).
- 📱 **Mobile-first** con gestos (swipe-to-delete en admin, botones táctiles grandes, tipografías fluidas).
- 📊 **Dashboard en tiempo real** (auto-refresh cada 15 s + resumen AI bajo demanda).
- 🧠 **Memoria local** con SQLite (no dependes de servicios externos para persistencia básica).
- 🔐 **Auth sencilla**: contraseña admin (`ADMIN_PASSWORD`) + Clerk listo para integraciones futuras.
- ☁️ **Deploy listo para Railway** (`railway.json` + `nixpacks.toml`) y script `start.sh` con túnel Cloudflare para demos rápidas.

## Arquitectura
| Capa | Tecnología |
|------|------------|
| UI | Next.js 16 (App Router) + Tailwind 4 + shadcn/ui|
| IA | Anthropic Claude (entrevistas + resúmenes) |
| Audio | Whisper local para transcribir `webm` → texto |
| Base de datos | SQLite (`better-sqlite3`) persistida en `data/interviewr.db` |
| Auth | Cookie propia + Clerk (opcional) |
| Infra recomendada | Railway (Nixpacks) o cualquier Node 20+ con disco persistente |

## Requisitos
- Node.js 20+ y npm 10+
- Python 3 + `openai-whisper` (para transcripción local)
- `ffmpeg` (necesario para Whisper)
- Cuenta y API Key de Anthropic (Claude)
- Opcional: cuenta de Railway para deploy gestionado

## Variables de entorno
Guárdalas en `.env.local` o en el panel de tu proveedor.

| Variable | Descripción |
|----------|-------------|
| `ANTHROPIC_API_KEY` | Requerida. Clave para invocar a Claude. |
| `ADMIN_PASSWORD` | Contraseña para la vista `/` (admin). Por defecto `interviewr`. |
| `OPENAI_API_KEY` | Necesaria sólo si usas Whisper vía API; para Whisper local no hace falta. |
| `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` / `CLERK_SECRET_KEY` | Sólo si activas Clerk. |
| `NEXT_PUBLIC_CLERK_*` | URLs de callbacks de Clerk. |

> 📌 Si despliegas en Railway, define al menos `ANTHROPIC_API_KEY`, `ADMIN_PASSWORD` y (si aplica) tus claves de Clerk.

## Desarrollo local
```bash
# 1. Dependencias
npm install

# 2. Variables de entorno
cp .env.example .env.local   # crea uno si no existe
# edita .env.local y añade tus claves (ver tabla)

# 3. Ejecuta Whisper local (una vez)
pip install openai-whisper

# 4. Dev server
npm run dev
# http://localhost:3000
```

### Script de demo + túnel
```bash
./start.sh
```
- Compila si hace falta, arranca `npm run start` y abre un túnel Cloudflare (`https://*.trycloudflare.com`).
- Imprime la URL pública para compartir entrevistas sin configurar DNS.

## Base de datos y almacenamiento
- SQLite vive en `data/interviewr.db` (creada al primer run).
- Para producción (Railway), monta un volumen persistente y apunta `DATABASE_PATH` si cambias la ruta.
- Puedes resetear datos borrando el archivo `.db`.

## Pipeline de audio
1. El navegador graba `webm` (MediaRecorder) cuando la persona presiona **Hablar**.
2. Se envía a `/api/transcribe`.
3. El servidor dispara Whisper (tiny) local → texto.
4. Se guarda la transcripción y se envía a Claude como siguiente turno.

## Deploy en Railway 🚀
El repo ya incluye `railway.json` y `nixpacks.toml`, así que basta con conectar GitHub.

1. `railway up` o crea un servicio Web y conecta `vitaxxbot-glitch/interviews`.
2. Railway detectará Nixpacks → Node.
3. Comandos (ya definidos):
   - **Build**: automático via Nixpacks.
   - **Start**: `npm run start`.
4. Variables → pega las de la tabla.
5. Añade un volumen de al menos 1 GB montado en `/app/data` para el SQLite.
6. Opcional: configura un dominio y HTTPS desde Railway Dashboard.

## Scripts útiles
| Comando | Uso |
|---------|-----|
| `npm run dev` | Dev server con HMR |
| `npm run build` | Compila Next.js |
| `npm run start` | Sirve `/.next` (usado en prod + Railway) |
| `npm run lint` | ESLint |
| `./start.sh` | Producción local + túnel Cloudflare |
| `run.sh` | Helper para lanzar servicios auxiliares |

## Roadmap próximo
- [ ] Mejorar controles accesibles para usuarios sin voz.
- [ ] Editor visual de flujo para admins.
- [ ] Webhooks para enviar resultados a Slack/Notion.
- [ ] Multi-idioma (Claude + UI).

---
Hecho con cariño y obsesión por el craft ✶