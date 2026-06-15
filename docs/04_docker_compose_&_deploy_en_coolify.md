# 🚀 Doc 04 — Docker Compose & Deploy en Coolify

> **Instrucciones para Antigravity:** Lee todo el documento antes de empezar. En este paso vas a configurar Docker Compose para desarrollo y producción, y luego conectar el repositorio GitHub con Coolify para que el proyecto **Storytelling** se despliegue automáticamente con una URL pública. Reemplaza cualquier referencia a "VoxForge" por "storytelling" en todos los archivos.

---

## Objetivo

Al terminar este documento tendrás:

- `docker-compose.yml` para producción (usado por Coolify)
- `docker-compose.dev.yml` para desarrollo local con hot-reload
- El proyecto corriendo en Coolify con una URL temporal pública
- Deploy automático cada vez que hagas `git push` a `main`

---

## Paso 1 — Renombrar referencias VoxForge → storytelling

Antes de continuar, haz un find & replace en todo el proyecto:

```bash
# Desde la raíz del proyecto
grep -rl "VoxForge\|voxforge" . --include="*.ts" --include="*.tsx" --include="*.py" --include="*.env" --include="*.md" --include="*.json" \
  | xargs sed -i 's/VoxForge/Storytelling/g; s/voxforge/storytelling/g'
```

Verifica manualmente estos archivos clave:
- `backend/app/config.py` → `app_name: str = "Storytelling API"`
- `frontend/app/layout.tsx` → título y descripción
- `backend/.env` → `APP_NAME=Storytelling API`
- `README.md`

---

## Paso 2 — docker-compose.yml (producción)

Crea o reemplaza el archivo `docker-compose.yml` en la raíz del proyecto:

```yaml
version: "3.9"

services:
  backend:
    build:
      context: ./backend
      dockerfile: Dockerfile
    container_name: storytelling-backend
    restart: unless-stopped
    environment:
      - APP_NAME=Storytelling API
      - APP_ENV=production
      - DEBUG=false
      - BACKEND_PORT=8000
      - TTS_DEVICE=${TTS_DEVICE:-cpu}
      - DEFAULT_EXAGGERATION=${DEFAULT_EXAGGERATION:-0.5}
      - DEFAULT_CFG_WEIGHT=${DEFAULT_CFG_WEIGHT:-0.5}
      - ALLOWED_ORIGINS=${ALLOWED_ORIGINS:-http://localhost:3000}
    volumes:
      - storytelling_voices:/app/storage/voices
      - storytelling_outputs:/app/storage/outputs
      - storytelling_db:/app/db
    ports:
      - "8000:8000"
    healthcheck:
      test: ["CMD", "curl", "-f", "http://localhost:8000/health"]
      interval: 30s
      timeout: 10s
      retries: 3
      start_period: 60s
    networks:
      - storytelling-net

  frontend:
    build:
      context: ./frontend
      dockerfile: Dockerfile
      args:
        - NEXT_PUBLIC_API_URL=${NEXT_PUBLIC_API_URL:-http://localhost:8000}
    container_name: storytelling-frontend
    restart: unless-stopped
    environment:
      - NODE_ENV=production
      - NEXT_PUBLIC_API_URL=${NEXT_PUBLIC_API_URL:-http://localhost:8000}
    ports:
      - "3000:3000"
    depends_on:
      backend:
        condition: service_healthy
    networks:
      - storytelling-net

volumes:
  storytelling_voices:
  storytelling_outputs:
  storytelling_db:

networks:
  storytelling-net:
    driver: bridge
```

---

## Paso 3 — docker-compose.dev.yml (desarrollo local)

Crea el archivo `docker-compose.dev.yml` en la raíz:

```yaml
version: "3.9"

services:
  backend:
    build:
      context: ./backend
      dockerfile: Dockerfile
    container_name: storytelling-backend-dev
    restart: unless-stopped
    environment:
      - APP_NAME=Storytelling API
      - APP_ENV=development
      - DEBUG=true
      - BACKEND_PORT=8000
      - TTS_DEVICE=cpu
      - DEFAULT_EXAGGERATION=0.5
      - DEFAULT_CFG_WEIGHT=0.5
      - ALLOWED_ORIGINS=http://localhost:3000,http://127.0.0.1:3000
    volumes:
      - ./backend/app:/app/app
      - ./backend/storage:/app/storage
      - storytelling_db_dev:/app/db
    ports:
      - "8000:8000"
    command: uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
    networks:
      - storytelling-dev-net

  frontend:
    image: node:20-alpine
    container_name: storytelling-frontend-dev
    working_dir: /app
    restart: unless-stopped
    environment:
      - NEXT_PUBLIC_API_URL=http://localhost:8000
    volumes:
      - ./frontend:/app
      - /app/node_modules
      - /app/.next
    ports:
      - "3000:3000"
    command: sh -c "npm install && npm run dev"
    networks:
      - storytelling-dev-net

volumes:
  storytelling_db_dev:

networks:
  storytelling-dev-net:
    driver: bridge
```

---

## Paso 4 — Archivo .env raíz para producción

Crea `.env` en la raíz del proyecto (este lo leerá Coolify):

```env
# Backend
TTS_DEVICE=cpu
DEFAULT_EXAGGERATION=0.5
DEFAULT_CFG_WEIGHT=0.5

# Se reemplaza con la URL real de Coolify en producción
NEXT_PUBLIC_API_URL=http://localhost:8000
ALLOWED_ORIGINS=http://localhost:3000
```

> Nota: Coolify sobreescribirá estas variables desde su panel. No subas este archivo a Git si tiene secretos. Agrégalo al `.gitignore`.

Agrega al `.gitignore` de la raíz:

```
.env
```

---

## Paso 5 — Ajustar el DB_PATH del backend para Docker

Abre `backend/app/config.py` y ajusta `DB_PATH` para que respete el volumen de Docker:

```python
import os

# Si estamos en Docker, la DB va en /app/db/, si no en la raíz del backend
_in_docker = os.path.exists("/.dockerenv")
DB_PATH = Path("/app/db/storytelling.db") if _in_docker else BASE_DIR / "storytelling.db"
```

Reemplaza la línea `DB_PATH = BASE_DIR / "voxforge.db"` por el bloque de arriba.

---

## Paso 6 — Ajustar el Dockerfile del backend para la carpeta DB

Actualiza `backend/Dockerfile` para crear la carpeta `/app/db`:

```dockerfile
FROM python:3.11-slim

WORKDIR /app

RUN apt-get update && apt-get install -y --no-install-recommends \
    ffmpeg git curl \
    && rm -rf /var/lib/apt/lists/*

COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

COPY app ./app
COPY storage ./storage
COPY .env ./.env

RUN mkdir -p /app/db /app/storage/voices /app/storage/outputs

EXPOSE 8000

CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000"]
```

---

## Paso 7 — Ajustar el Dockerfile del frontend para standalone

Abre `frontend/next.config.ts` y agrega `output: "standalone"`:

```ts
import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: "standalone",
  async rewrites() {
    return [
      {
        source: "/api/:path*",
        destination: `${process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000"}/:path*`,
      },
    ];
  },
};

export default nextConfig;
```

---

## Paso 8 — Probar Docker Compose localmente

Desde la raíz del proyecto:

```bash
# Build completo
docker compose -f docker-compose.dev.yml up --build

# O si quieres prod local
docker compose up --build
```

Verifica:
- `http://localhost:3000` → Frontend
- `http://localhost:8000/health` → Backend
- `http://localhost:8000/docs` → Swagger

---

## Paso 9 — Commit final antes de Coolify

```bash
git add .
git commit -m "feat: add Docker Compose config for storytelling deploy"
git push origin main
```

---

## Paso 10 — Configurar Coolify

### 10.1 — Entrar a tu panel Coolify

Abre tu Coolify en el servidor. Si aún no lo tienes instalado:

```bash
curl -fsSL https://cdn.coollabs.io/coolify/install.sh | bash
```

Accede desde `http://TU_IP_SERVIDOR:8000` (o el puerto que configuraste).

---

### 10.2 — Crear nuevo proyecto

1. En el panel izquierdo → **Projects** → **New Project**
2. Nombre: `storytelling`
3. Click en **Create**

---

### 10.3 — Agregar nueva aplicación

Dentro del proyecto `storytelling`:

1. Click en **New Resource**
2. Selecciona **Docker Compose**
3. Selecciona tu servidor

---

### 10.4 — Conectar GitHub

1. En la pantalla de fuente, selecciona **GitHub App** (o GitHub Public si el repo es público)
2. Si es primera vez, sigue el flujo de autorización con GitHub
3. Busca tu repositorio `storytelling` y selecciónalo
4. Branch: `main`
5. Docker Compose location: `docker-compose.yml` (el de la raíz)

---

### 10.5 — Configurar variables de entorno en Coolify

En la pestaña **Environment Variables** agrega:

| Variable | Valor |
|---|---|
| `TTS_DEVICE` | `cpu` |
| `DEFAULT_EXAGGERATION` | `0.5` |
| `DEFAULT_CFG_WEIGHT` | `0.5` |
| `NEXT_PUBLIC_API_URL` | *(déjalo vacío por ahora, lo actualizas después)* |
| `ALLOWED_ORIGINS` | *(déjalo vacío por ahora)* |

---

### 10.6 — Configurar dominios

En la pestaña **Domains**:

**Para el frontend (puerto 3000):**
1. Click en **Add Domain**
2. Coolify te asignará un dominio temporal tipo `storytelling-frontend.tuservidor.sslip.io`
3. Activa **HTTPS** (Coolify lo gestiona con Let's Encrypt automáticamente)

**Para el backend (puerto 8000):**
1. Click en **Add Domain**
2. Dominio temporal tipo `storytelling-api.tuservidor.sslip.io`
3. Activa **HTTPS**

---

### 10.7 — Actualizar variables con URLs reales

Una vez que tengas los dominios temporales, vuelve a **Environment Variables** y actualiza:

```
NEXT_PUBLIC_API_URL=https://storytelling-api.tuservidor.sslip.io
ALLOWED_ORIGINS=https://storytelling-frontend.tuservidor.sslip.io
```

---

### 10.8 — Primer deploy

1. Click en **Deploy** (botón azul)
2. Observa los logs en tiempo real
3. El primer deploy tardará varios minutos porque descarga el modelo de Chatterbox

Coolify mostrará ✅ cuando ambos servicios estén corriendo.

---

## Paso 11 — Activar deploy automático (CI/CD)

En la pestaña **General** de tu aplicación en Coolify:

1. Activa **Auto Deploy** → ON
2. Esto hará que cada `git push` a `main` dispare un nuevo deploy automáticamente

---

## Paso 12 — Verificar deploy en producción

Una vez desplegado, verifica:

```bash
# Health del backend
curl https://storytelling-api.tuservidor.sslip.io/health

# Respuesta esperada:
# {"status":"ok","environment":"production","device":"cpu"}
```

Luego abre en el navegador:
- `https://storytelling-frontend.tuservidor.sslip.io` → UI completa
- `https://storytelling-api.tuservidor.sslip.io/docs` → Swagger

---

## Paso 13 — Persistencia de datos

Los volúmenes Docker garantizan que las voces y audios generados sobrevivan a los redeploys:

| Volumen | Contenido |
|---|---|
| `storytelling_voices` | Clips de referencia `.wav` subidos |
| `storytelling_outputs` | Audios generados `.wav` y `.mp3` |
| `storytelling_db` | Base de datos SQLite con historial |

Coolify monta estos volúmenes automáticamente en el servidor.

---

## Paso 14 — Logs y monitoreo

Desde el panel de Coolify puedes ver los logs en tiempo real de cada servicio:

- **Backend logs**: errores del modelo TTS, requests a la API
- **Frontend logs**: errores de build o runtime de Next.js

También puedes hacer SSH al servidor y ver:

```bash
docker logs storytelling-backend -f
docker logs storytelling-frontend -f
```

---

## ✅ Checklist antes del Doc 05

- [ ] `docker compose up --build` corre sin errores localmente
- [ ] El frontend en `localhost:3000` conecta con el backend en `localhost:8000`
- [ ] El repositorio tiene el commit `feat: add Docker Compose config for storytelling deploy`
- [ ] El proyecto existe en Coolify como `storytelling`
- [ ] El repositorio GitHub está conectado en Coolify
- [ ] Las variables de entorno están configuradas en Coolify
- [ ] Los dominios temporales están asignados (frontend y backend)
- [ ] El primer deploy completó sin errores (✅ en Coolify)
- [ ] `GET /health` responde desde la URL pública del backend
- [ ] El frontend carga desde su URL pública
- [ ] Auto Deploy está activado

---

> **Cuando el checklist esté completo, dile a Cristian para continuar con el Doc 05 — Testing, QA y ajustes finales.**