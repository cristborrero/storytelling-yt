# Storytelling 🎙️

Self-hosted Text-to-Speech platform for English narration, powered by Chatterbox-Turbo.

## Stack

- **Frontend:** Next.js 15 + Tailwind CSS
- **Backend:** FastAPI + Python 3.11
- **TTS Engine:** Chatterbox (Resemble AI)
- **Database:** SQLite via SQLModel
- **Deploy:** Docker Compose + Coolify

## Features

- Voice cloning from a 10–15s WAV reference clip
- Expressive narration with tags: `[laugh]` `[chuckle]` `[cough]`
- WAV + MP3 output
- Generation history
- Voice library management
- Waveform audio player

## Narration Presets

| Preset | Expressiveness | Pace Control |
|---|---:|---:|
| Neutral | 0.5 | 0.5 |
| Dramatic | 0.7 | 0.3 |
| Expressive | 0.8 | 0.2 |

## Local Development

```bash
cp .env.example .env
docker compose -f docker-compose.dev.yml up --build
```

Frontend: http://localhost:3000
Backend: http://localhost:8000
API Docs: http://localhost:8000/docs

## Production Deploy

See Doc 04 — Docker Compose & Deploy en Coolify.
