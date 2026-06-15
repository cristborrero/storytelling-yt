# Storytelling 🎙️

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
