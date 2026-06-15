# Skill Registry — voxforge

Generated: 2026-06-15

## Project Conventions
- No CLAUDE.md / GEMINI.md / .cursorrules detected yet
- Conventional commits enforced

## Compact Rules

### Backend (Python/FastAPI)
- Use async def for all route handlers
- Services layer holds business logic — routers are thin
- SQLModel for DB models (not raw SQLAlchemy)
- Config via pydantic-settings (not bare os.environ)

### Frontend (Next.js 15 / TypeScript)
- App Router — no pages/ directory
- Tailwind CSS v3 only (no inline styles)
- axios via lib/api.ts for all API calls (never fetch directly in components)
- Types shared in lib/types.ts

### General
- Docker Compose for all local dev — no bare `uvicorn` or `npm run dev` in production
- Audio storage local (no S3), under backend/storage/
