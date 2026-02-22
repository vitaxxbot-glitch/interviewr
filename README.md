# Interviewr 🎙️

Plataforma de entrevistas adaptativas con IA. En lugar de formularios estáticos, una IA entrevista a cada persona y adapta las preguntas según sus respuestas.

## Setup rápido (local)

```bash
# 1. Instala dependencias
npm install

# 2. Añade tu API key de Anthropic
echo "ANTHROPIC_API_KEY=sk-ant-tu-clave" > .env.local

# 3. Arranca
npm run dev
```

Abre http://localhost:3000

---

## Deploy en Render.com (gratis, siempre online)

1. **Sube el código a GitHub:**
   ```bash
   cd ai-interviewer
   git init && git add . && git commit -m "init"
   gh repo create interviewr --public --push --source=.
   ```

2. **En render.com → New Web Service:**
   - Connect tu repo de GitHub
   - Runtime: Node
   - Build command: `npm install && npm run build`
   - Start command: `npm run start`
   - Añade **Disk** → Mount path: `/app/data` → 1GB

3. **Environment variables:**
   - `ANTHROPIC_API_KEY` → tu clave de Anthropic
   - `NODE_ENV` → `production`

4. Deploy → en 2 minutos tienes una URL pública.

---

## Cómo funciona

- **Admin** (tú): creas una entrevista con título, objetivo e instrucciones opcionales
- **Comparte el link** con las personas que quieres entrevistar
- **La IA entrevista** a cada persona de forma adaptativa — sin preguntas fijas
- **Dashboard**: ve todas las respuestas y pide un resumen AI cuando quieras

## Stack

- Next.js 16 + Tailwind CSS
- Anthropic Claude (entrevistador + resúmenes)
- SQLite (base de datos local con better-sqlite3)
