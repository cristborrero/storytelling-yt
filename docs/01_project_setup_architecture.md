# 📁 Doc 01 — Project Setup & Architecture

> **Instrucciones para Antigravity:** Lee este documento completo antes de ejecutar cualquier comando. Tu objetivo en este paso es crear la estructura base del proyecto, inicializar Git, y preparar todos los archivos de configuración. No escribas código de lógica de negocio todavía — solo estructura, configuración y archivos vacíos con sus comentarios de propósito.

---

## Contexto del Proyecto

Estamos construyendo **VoxForge** — una aplicación self-hosted de Text-to-Speech (TTS) similar a ElevenLabs, pero completamente propia. El usuario puede:

- Pegar o escribir texto en inglés
- Seleccionar o subir una voz de referencia (clip `.wav` de ~10s)
- Ajustar parámetros de expresividad y pacing
- Generar y descargar el audio narrado en `.wav` / `.mp3`
- Ver historial de generaciones

El engine de TTS es **Chatterbox-Turbo** de Resemble AI (open-source, modelo de 350M parámetros, solo inglés).

---

## Stack Técnico

| Capa | Tecnología | Razón |
|---|---|---|
| **Frontend** | Next.js 15 (App Router) + Tailwind CSS v3 | UI moderna, SSR, fácil deploy |
| **Backend** | FastAPI (Python 3.11) | Conocido por el equipo, ideal para ML |
| **TTS Engine** | Chatterbox-Turbo (`chatterbox-tts`) | Open-source, SoTA, clonación de voz |
| **Audio storage** | Sistema de archivos local + `/static` | Simple, sin dependencias externas |
| **Containerización** | Docker + Docker Compose | Deploy en Coolify |
| **Base de datos** | SQLite (via SQLModel) | Sin overhead, perfecto para empezar |

---

## Estructura de Carpetas a Crear

Crea exactamente esta estructura. Cada archivo debe existir (puede estar vacío o con comentario de propósito):

```
voxforge/
├── backend/
│   ├── app/
│   │   ├── __init__.py
│   │   ├── main.py                  # Entry point FastAPI
│   │   ├── config.py                # Variables de entorno y settings
│   │   ├── database.py              # SQLite + SQLModel setup
│   │   ├── models/
│   │   │   ├── __init__.py
│   │   │   └── generation.py        # Modelo Generation (tabla DB)
│   │   ├── routers/
│   │   │   ├── __init__.py
│   │   │   ├── tts.py               # POST /generate, GET /audio/{id}
│   │   │   ├── voices.py            # GET /voices, POST /voices/upload
│   │   │   └── history.py           # GET /history
│   │   ├── services/
│   │   │   ├── __init__.py
│   │   │   ├── tts_service.py       # Lógica de Chatterbox-Turbo
│   │   │   └── audio_service.py     # Conversión WAV→MP3, utilidades
│   │   └── utils/
│   │       ├── __init__.py
│   │       └── file_utils.py        # Helpers para manejo de archivos
│   ├── storage/
│   │   ├── voices/                  # Clips de referencia de voz (.wav)
│   │   └── outputs/                 # Audios generados (.wav / .mp3)
│   ├── Dockerfile
│   ├── requirements.txt
│   └── .env.example
│
├── frontend/
│   ├── app/
│   │   ├── layout.tsx               # Root layout
│   │   ├── page.tsx                 # Página principal (generador)
│   │   ├── history/
│   │   │   └── page.tsx             # Página de historial
│   │   └── voices/
│   │       └── page.tsx             # Gestión de voces de referencia
│   ├── components/
│   │   ├── ui/
│   │   │   ├── Button.tsx
│   │   │   ├── Slider.tsx
│   │   │   ├── TextArea.tsx
│   │   │   ├── AudioPlayer.tsx      # Player custom con waveform
│   │   │   └── Badge.tsx
│   │   ├── GeneratorForm.tsx        # Formulario principal de generación
│   │   ├── VoiceSelector.tsx        # Selección de voz de referencia
│   │   ├── HistoryList.tsx          # Lista de generaciones previas
│   │   └── Navbar.tsx
│   ├── lib/
│   │   ├── api.ts                   # Cliente HTTP hacia FastAPI
│   │   └── types.ts                 # TypeScript types compartidos
│   ├── public/
│   ├── Dockerfile
│   ├── next.config.ts
│   ├── tailwind.config.ts
│   ├── tsconfig.json
│   └── package.json
│
├── docker-compose.yml               # Orquestación completa
├── docker-compose.dev.yml           # Override para desarrollo local
├── .gitignore
├── .env.example                     # Variables de entorno globales
└── README.md
```

---

## Paso 1 — Inicializar el repositorio Git

Ejecuta estos comandos en tu terminal:

```bash
mkdir voxforge && cd voxforge
git init
git branch -M main
```

---

## Paso 2 — Crear el archivo `.gitignore`

Crea el archivo `voxforge/.gitignore` con este contenido exacto:

```gitignore
# Python
__pycache__/
*.py[cod]
*.pyo
.venv/
venv/
*.egg-info/
dist/
build/
.pytest_cache/

# Entorno
.env
*.env.local

# Node
node_modules/
.next/
out/
.npm

# Storage (no subir audios ni voces al repo)
backend/storage/voices/*.wav
backend/storage/outputs/*.wav
backend/storage/outputs/*.mp3

# Base de datos local
*.db
*.sqlite

# OS
.DS_Store
Thumbs.db

# Docker
*.log
```

---

## Paso 3 — Crear el archivo `requirements.txt` del backend

Crea el archivo `voxforge/backend/requirements.txt`:

```txt
# Web framework
fastapi==0.115.0
uvicorn[standard]==0.30.6

# TTS Engine
chatterbox-tts

# Audio processing
torchaudio
pydub==0.25.1

# Database
sqlmodel==0.0.21
aiosqlite==0.20.0

# Utils
python-multipart==0.0.12
python-dotenv==1.0.1
aiofiles==23.2.1

# Type hints
pydantic==2.8.2
pydantic-settings==2.4.0
```

---

## Paso 4 — Crear `package.json` del frontend

Crea el archivo `voxforge/frontend/package.json`:

```json
{
  "name": "voxforge-frontend",
  "version": "0.1.0",
  "private": true,
  "scripts": {
    "dev": "next dev --turbopack",
    "build": "next build",
    "start": "next start",
    "lint": "next lint"
  },
  "dependencies": {
    "next": "15.3.0",
    "react": "^19.0.0",
    "react-dom": "^19.0.0",
    "axios": "^1.7.7",
    "wavesurfer.js": "^7.8.6",
    "lucide-react": "^0.462.0",
    "clsx": "^2.1.1",
    "tailwind-merge": "^2.5.4"
  },
  "devDependencies": {
    "@types/node": "^22",
    "@types/react": "^19",
    "@types/react-dom": "^19",
    "typescript": "^5",
    "tailwindcss": "^3.4.14",
    "postcss": "^8",
    "autoprefixer": "^10",
    "eslint": "^9",
    "eslint-config-next": "15.3.0"
  }
}
```

---

## Paso 5 — Variables de entorno

Crea el archivo `voxforge/.env.example` (este es el template, el real será `.env`):

```env
# ── Backend ──────────────────────────────────────────
# Puerto donde corre FastAPI
BACKEND_PORT=8000

# Ruta interna donde se guardan los archivos generados
STORAGE_PATH=/app/storage

# Dispositivo para el modelo TTS: "cuda" o "cpu"
TTS_DEVICE=cpu

# Parámetros por defecto del modelo
DEFAULT_EXAGGERATION=0.5
DEFAULT_CFG_WEIGHT=0.5

# ── Frontend ─────────────────────────────────────────
# URL del backend (desde el browser del usuario)
NEXT_PUBLIC_API_URL=http://localhost:8000

# ── Coolify (producción) ─────────────────────────────
# Estas variables las sobreescribe Coolify automáticamente
# NEXT_PUBLIC_API_URL=https://api.voxforge.tudominio.com
```

---

## Paso 6 — Crear el `README.md`

Crea el archivo `voxforge/README.md`:

```markdown
# VoxForge 🎙️

Self-hosted Text-to-Speech platform powered by Chatterbox-Turbo.

## Stack
- **Frontend:** Next.js 15 + Tailwind CSS
- **Backend:** FastAPI + Python 3.11
- **TTS Engine:** Chatterbox-Turbo (Resemble AI)
- **Deploy:** Docker Compose + Coolify

## Quick Start (desarrollo local)

```bash
cp .env.example .env
docker compose -f docker-compose.dev.yml up --build
```

Frontend: http://localhost:3000  
Backend API: http://localhost:8000  
API Docs: http://localhost:8000/docs

## Deploy en Coolify

Ver `Doc 04 — Docker Compose & Coolify Deploy`.
```

---

## Paso 7 — Crear todos los directorios y archivos vacíos

Ejecuta este bloque de bash para crear toda la estructura de una vez:

```bash
# Desde la raíz del proyecto voxforge/
mkdir -p backend/app/models
mkdir -p backend/app/routers
mkdir -p backend/app/services
mkdir -p backend/app/utils
mkdir -p backend/storage/voices
mkdir -p backend/storage/outputs
mkdir -p frontend/app/history
mkdir -p frontend/app/voices
mkdir -p frontend/components/ui
mkdir -p frontend/lib
mkdir -p frontend/public

# Crear __init__.py vacíos
touch backend/app/__init__.py
touch backend/app/models/__init__.py
touch backend/app/routers/__init__.py
touch backend/app/services/__init__.py
touch backend/app/utils/__init__.py

# Crear archivos frontend vacíos
touch frontend/app/layout.tsx
touch frontend/app/page.tsx
touch frontend/app/history/page.tsx
touch frontend/app/voices/page.tsx
touch frontend/components/ui/Button.tsx
touch frontend/components/ui/Slider.tsx
touch frontend/components/ui/TextArea.tsx
touch frontend/components/ui/AudioPlayer.tsx
touch frontend/components/ui/Badge.tsx
touch frontend/components/GeneratorForm.tsx
touch frontend/components/VoiceSelector.tsx
touch frontend/components/HistoryList.tsx
touch frontend/components/Navbar.tsx
touch frontend/lib/api.ts
touch frontend/lib/types.ts

# Crear archivos backend vacíos
touch backend/app/main.py
touch backend/app/config.py
touch backend/app/database.py
touch backend/app/models/generation.py
touch backend/app/routers/tts.py
touch backend/app/routers/voices.py
touch backend/app/routers/history.py
touch backend/app/services/tts_service.py
touch backend/app/services/audio_service.py
touch backend/app/utils/file_utils.py

# Archivos raíz
touch docker-compose.yml
touch docker-compose.dev.yml
touch backend/Dockerfile
touch frontend/Dockerfile
touch backend/.env.example

echo "✅ Estructura creada correctamente"
```

---

## Paso 8 — Primer commit

```bash
git add .
git commit -m "chore: initial project structure for VoxForge"
```

---

## Paso 9 — Crear el repositorio en GitHub

1. Ve a [github.com/new](https://github.com/new)
2. Nombre del repo: `voxforge`
3. Visibilidad: **Private** (recomendado mientras está en desarrollo)
4. **No** inicialices con README ni .gitignore (ya los tienes)
5. Copia la URL del repo (ej: `https://github.com/TU_USUARIO/voxforge.git`)

Luego en tu terminal:

```bash
git remote add origin https://github.com/TU_USUARIO/voxforge.git
git push -u origin main
```

---

## ✅ Verificación — Checklist antes de continuar

Antes de pasar al **Doc 02**, confirma que:

- [ ] El comando `git log` muestra 1 commit con el mensaje `chore: initial project structure for VoxForge`
- [ ] El repositorio existe en GitHub y tiene los archivos subidos
- [ ] La estructura de carpetas coincide exactamente con el árbol mostrado arriba
- [ ] El archivo `.env.example` existe en la raíz del proyecto
- [ ] Los directorios `backend/storage/voices/` y `backend/storage/outputs/` existen

---

> **Cuando completes todos los puntos del checklist, dile a Cristian que estás listo para el Doc 02.**
