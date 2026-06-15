# 🎙️ Doc 02 — Backend FastAPI + Chatterbox-Turbo

> **Instrucciones para Antigravity:** Lee todo el documento antes de empezar. Tu objetivo es construir el backend completo de VoxForge con FastAPI, SQLite y Chatterbox-Turbo. Sigue los pasos en orden. Cuando copies código, úsalo exacto salvo donde el documento indique ajustes explícitos.

---

## Objetivo

En este documento vas a dejar funcionando una API backend capaz de:

- Registrar voces de referencia subidas por el usuario
- Listar voces disponibles
- Generar audio `.wav` a partir de texto usando Chatterbox-Turbo
- Convertir opcionalmente el `.wav` a `.mp3`
- Guardar historial de generaciones en SQLite
- Exponer URLs estáticas para reproducir o descargar los audios generados
- Servir documentación Swagger en `/docs`

---

## Resultado esperado

Al terminar este documento, estos endpoints deben responder:

- `GET /health`
- `GET /voices`
- `POST /voices/upload`
- `POST /generate`
- `GET /history`
- `GET /audio/{filename}`
- `GET /docs`

Backend levantado con:

```bash
cd backend
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

---

## Arquitectura backend

- `config.py` → settings y variables de entorno
- `database.py` → conexión SQLite + creación de tablas
- `models/generation.py` → tablas `Generation` y `Voice`
- `services/tts_service.py` → carga lazy del modelo y generación de audio
- `services/audio_service.py` → conversión a MP3 y helpers de audio
- `routers/voices.py` → subida y listado de voces
- `routers/tts.py` → generación TTS
- `routers/history.py` → historial de generaciones
- `main.py` → instancia FastAPI, CORS, static files, routers

---

## Paso 1 — requirements.txt

Reemplaza `backend/requirements.txt` por:

```txt
fastapi==0.115.0
uvicorn[standard]==0.30.6
chatterbox-tts
torch
torchaudio
pydub==0.25.1
sqlmodel==0.0.21
aiosqlite==0.20.0
python-multipart==0.0.12
python-dotenv==1.0.1
aiofiles==23.2.1
pydantic==2.8.2
pydantic-settings==2.4.0
```

Instala FFmpeg (necesario para exportar MP3):

```bash
# Ubuntu / Debian
sudo apt update && sudo apt install -y ffmpeg

# macOS
brew install ffmpeg
```

---

## Paso 2 — config.py

Crea `backend/app/config.py`:

```python
from pathlib import Path
from pydantic_settings import BaseSettings, SettingsConfigDict

BASE_DIR = Path(__file__).resolve().parent.parent
STORAGE_DIR = BASE_DIR / "storage"
VOICES_DIR = STORAGE_DIR / "voices"
OUTPUTS_DIR = STORAGE_DIR / "outputs"
DB_PATH = BASE_DIR / "voxforge.db"


class Settings(BaseSettings):
    app_name: str = "VoxForge API"
    app_env: str = "development"
    debug: bool = True
    backend_port: int = 8000
    storage_path: str = str(STORAGE_DIR)
    tts_device: str = "cpu"
    default_exaggeration: float = 0.5
    default_cfg_weight: float = 0.5
    allowed_origins: str = "http://localhost:3000,http://127.0.0.1:3000"

    model_config = SettingsConfigDict(
        env_file=BASE_DIR / ".env",
        env_file_encoding="utf-8",
        extra="ignore",
    )

    @property
    def allowed_origins_list(self) -> list[str]:
        return [o.strip() for o in self.allowed_origins.split(",") if o.strip()]


settings = Settings()
VOICES_DIR.mkdir(parents=True, exist_ok=True)
OUTPUTS_DIR.mkdir(parents=True, exist_ok=True)
```

---

## Paso 3 — database.py

Crea `backend/app/database.py`:

```python
from sqlmodel import SQLModel, Session, create_engine
from app.config import DB_PATH

sqlite_url = f"sqlite:///{DB_PATH}"
engine = create_engine(sqlite_url, echo=False, connect_args={"check_same_thread": False})


def create_db_and_tables() -> None:
    SQLModel.metadata.create_all(engine)


def get_session():
    with Session(engine) as session:
        yield session
```

---

## Paso 4 — models/generation.py

Crea `backend/app/models/generation.py`:

```python
from typing import Optional
from datetime import datetime, timezone
from sqlmodel import SQLModel, Field


def utcnow() -> datetime:
    return datetime.now(timezone.utc)


class Voice(SQLModel, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    name: str
    original_filename: str
    stored_filename: str
    file_path: str
    duration_seconds: Optional[float] = None
    created_at: datetime = Field(default_factory=utcnow)


class Generation(SQLModel, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    text: str
    voice_id: Optional[int] = None
    voice_name: Optional[str] = None
    output_wav_filename: str
    output_mp3_filename: Optional[str] = None
    output_wav_url: str
    output_mp3_url: Optional[str] = None
    exaggeration: float = 0.5
    cfg_weight: float = 0.5
    format: str = "wav"
    status: str = "completed"
    duration_seconds: Optional[float] = None
    created_at: datetime = Field(default_factory=utcnow)
```

---

## Paso 5 — utils/file_utils.py

Crea `backend/app/utils/file_utils.py`:

```python
import re
import uuid
from pathlib import Path
from fastapi import UploadFile
import aiofiles

SAFE_NAME_REGEX = re.compile(r"[^a-zA-Z0-9_-]+")


def slugify_filename(value: str) -> str:
    stem = Path(value).stem.lower().strip()
    stem = SAFE_NAME_REGEX.sub("-", stem)
    return re.sub(r"-+", "-", stem).strip("-") or "file"


def build_unique_filename(original_name: str, suffix: str) -> str:
    return f"{slugify_filename(original_name)}-{uuid.uuid4().hex[:10]}{suffix}"


async def save_upload_file(upload_file: UploadFile, destination: Path) -> None:
    destination.parent.mkdir(parents=True, exist_ok=True)
    async with aiofiles.open(destination, "wb") as out_file:
        while chunk := await upload_file.read(1024 * 1024):
            await out_file.write(chunk)
    await upload_file.close()
```

---

## Paso 6 — services/audio_service.py

Crea `backend/app/services/audio_service.py`:

```python
from pathlib import Path
from pydub import AudioSegment
import torchaudio


class AudioService:
    @staticmethod
    def wav_duration_seconds(file_path: Path) -> float:
        metadata = torchaudio.info(str(file_path))
        if metadata.sample_rate == 0:
            return 0.0
        return round(metadata.num_frames / metadata.sample_rate, 2)

    @staticmethod
    def convert_wav_to_mp3(wav_path: Path, mp3_path: Path) -> Path:
        audio = AudioSegment.from_wav(wav_path)
        audio.export(mp3_path, format="mp3", bitrate="192k")
        return mp3_path
```

---

## Paso 7 — services/tts_service.py

Crea `backend/app/services/tts_service.py`:

```python
import threading
from pathlib import Path
import torchaudio as ta
from chatterbox.tts import ChatterboxTTS
from app.config import settings

# Nota: si el paquete instalado exporta ChatterboxTurboTTS,
# cambia la importación a: from chatterbox.tts_turbo import ChatterboxTurboTTS
# y reemplaza ChatterboxTTS por ChatterboxTurboTTS abajo.


class TTSService:
    _model = None
    _lock = threading.Lock()

    @classmethod
    def get_model(cls):
        if cls._model is None:
            with cls._lock:
                if cls._model is None:
                    cls._model = ChatterboxTTS.from_pretrained(device=settings.tts_device)
        return cls._model

    @classmethod
    def generate_wav(
        cls,
        text: str,
        output_path: Path,
        audio_prompt_path: str | None = None,
        exaggeration: float | None = None,
        cfg_weight: float | None = None,
    ) -> Path:
        model = cls.get_model()
        kwargs = {
            "exaggeration": exaggeration if exaggeration is not None else settings.default_exaggeration,
            "cfg_weight": cfg_weight if cfg_weight is not None else settings.default_cfg_weight,
        }
        if audio_prompt_path:
            kwargs["audio_prompt_path"] = audio_prompt_path
        wav = model.generate(text, **kwargs)
        ta.save(str(output_path), wav, model.sr)
        return output_path
```

---

## Paso 8 — routers/voices.py

Crea `backend/app/routers/voices.py`:

```python
from pathlib import Path
from fastapi import APIRouter, Depends, File, HTTPException, UploadFile
from sqlmodel import Session, select
from app.config import VOICES_DIR
from app.database import get_session
from app.models.generation import Voice
from app.services.audio_service import AudioService
from app.utils.file_utils import build_unique_filename, save_upload_file

router = APIRouter(prefix="/voices", tags=["voices"])
ALLOWED_EXTENSIONS = {".wav"}


@router.get("")
def list_voices(session: Session = Depends(get_session)):
    voices = session.exec(select(Voice).order_by(Voice.created_at.desc())).all()
    return {"items": voices}


@router.post("/upload")
async def upload_voice(
    file: UploadFile = File(...),
    name: str | None = None,
    session: Session = Depends(get_session),
):
    ext = Path(file.filename or "").suffix.lower()
    if ext not in ALLOWED_EXTENSIONS:
        raise HTTPException(status_code=400, detail="Only .wav reference clips are allowed")

    stored_filename = build_unique_filename(file.filename or "voice", ".wav")
    destination = VOICES_DIR / stored_filename
    await save_upload_file(file, destination)

    duration = AudioService.wav_duration_seconds(destination)
    voice = Voice(
        name=name or Path(file.filename or stored_filename).stem,
        original_filename=file.filename or stored_filename,
        stored_filename=stored_filename,
        file_path=str(destination),
        duration_seconds=duration,
    )
    session.add(voice)
    session.commit()
    session.refresh(voice)
    return {"item": voice}
```

---

## Paso 9 — routers/history.py

Crea `backend/app/routers/history.py`:

```python
from fastapi import APIRouter, Depends
from sqlmodel import Session, select
from app.database import get_session
from app.models.generation import Generation

router = APIRouter(prefix="/history", tags=["history"])


@router.get("")
def list_history(session: Session = Depends(get_session), limit: int = 50):
    items = session.exec(
        select(Generation).order_by(Generation.created_at.desc()).limit(limit)
    ).all()
    return {"items": items}
```

---

## Paso 10 — routers/tts.py

Crea `backend/app/routers/tts.py`:

```python
import uuid
from typing import Literal, Optional
from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel, Field
from sqlmodel import Session, select
from app.config import OUTPUTS_DIR
from app.database import get_session
from app.models.generation import Generation, Voice
from app.services.audio_service import AudioService
from app.services.tts_service import TTSService

router = APIRouter(tags=["tts"])


class GenerateRequest(BaseModel):
    text: str = Field(min_length=1, max_length=5000)
    voice_id: Optional[int] = None
    exaggeration: float = Field(default=0.5, ge=0.0, le=2.0)
    cfg_weight: float = Field(default=0.5, ge=0.0, le=1.0)
    output_format: Literal["wav", "mp3", "both"] = "both"


@router.post("/generate")
def generate_audio(payload: GenerateRequest, session: Session = Depends(get_session)):
    text = payload.text.strip()
    if not text:
        raise HTTPException(status_code=400, detail="Text is required")

    selected_voice = None
    audio_prompt_path = None
    if payload.voice_id is not None:
        selected_voice = session.exec(select(Voice).where(Voice.id == payload.voice_id)).first()
        if not selected_voice:
            raise HTTPException(status_code=404, detail="Voice not found")
        audio_prompt_path = selected_voice.file_path

    token = uuid.uuid4().hex[:12]
    wav_filename = f"gen-{token}.wav"
    mp3_filename = f"gen-{token}.mp3"
    wav_path = OUTPUTS_DIR / wav_filename
    mp3_path = OUTPUTS_DIR / mp3_filename

    TTSService.generate_wav(
        text=text,
        output_path=wav_path,
        audio_prompt_path=audio_prompt_path,
        exaggeration=payload.exaggeration,
        cfg_weight=payload.cfg_weight,
    )

    wav_url = f"/audio/{wav_filename}"
    mp3_url = None

    if payload.output_format in {"mp3", "both"}:
        AudioService.convert_wav_to_mp3(wav_path, mp3_path)
        mp3_url = f"/audio/{mp3_filename}"

    duration = AudioService.wav_duration_seconds(wav_path)

    record = Generation(
        text=text,
        voice_id=selected_voice.id if selected_voice else None,
        voice_name=selected_voice.name if selected_voice else None,
        output_wav_filename=wav_filename,
        output_mp3_filename=mp3_filename if mp3_url else None,
        output_wav_url=wav_url,
        output_mp3_url=mp3_url,
        exaggeration=payload.exaggeration,
        cfg_weight=payload.cfg_weight,
        format=payload.output_format,
        duration_seconds=duration,
    )
    session.add(record)
    session.commit()
    session.refresh(record)

    return {
        "item": record,
        "audio": {
            "wav_url": wav_url,
            "mp3_url": mp3_url,
            "duration_seconds": duration,
        },
    }
```

---

## Paso 11 — main.py

Crea `backend/app/main.py`:

```python
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse, JSONResponse
from fastapi.staticfiles import StaticFiles
from app.config import OUTPUTS_DIR, settings
from app.database import create_db_and_tables
from app.routers import history, tts, voices

app = FastAPI(
    title=settings.app_name,
    version="0.1.0",
    description="Self-hosted TTS API powered by Chatterbox",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.allowed_origins_list,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(voices.router)
app.include_router(tts.router)
app.include_router(history.router)
app.mount("/static", StaticFiles(directory=str(OUTPUTS_DIR)), name="static")


@app.on_event("startup")
def on_startup():
    create_db_and_tables()


@app.get("/health", tags=["health"])
def health():
    return {"status": "ok", "environment": settings.app_env, "device": settings.tts_device}


@app.get("/audio/{filename}", tags=["audio"])
def get_audio(filename: str):
    file_path = OUTPUTS_DIR / filename
    if not file_path.exists() or not file_path.is_file():
        return JSONResponse(status_code=404, content={"detail": "File not found"})
    media_type = "audio/mpeg" if file_path.suffix.lower() == ".mp3" else "audio/wav"
    return FileResponse(path=file_path, media_type=media_type, filename=file_path.name)
```

---

## Paso 12 — routers/__init__.py

Reemplaza `backend/app/routers/__init__.py`:

```python
from . import history, tts, voices
__all__ = ["history", "tts", "voices"]
```

---

## Paso 13 — backend/.env

Crea `backend/.env`:

```env
APP_NAME=VoxForge API
APP_ENV=development
DEBUG=true
BACKEND_PORT=8000
STORAGE_PATH=/app/storage
TTS_DEVICE=cpu
DEFAULT_EXAGGERATION=0.5
DEFAULT_CFG_WEIGHT=0.5
ALLOWED_ORIGINS=http://localhost:3000,http://127.0.0.1:3000
```

---

## Paso 14 — backend/Dockerfile

Crea `backend/Dockerfile`:

```dockerfile
FROM python:3.11-slim

WORKDIR /app

RUN apt-get update && apt-get install -y --no-install-recommends \
    ffmpeg git \
    && rm -rf /var/lib/apt/lists/*

COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

COPY app ./app
COPY storage ./storage
COPY .env ./.env

EXPOSE 8000
CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000"]
```

---

## Paso 15 — Prueba local sin Docker

```bash
cd backend
python3.11 -m venv .venv
source .venv/bin/activate
pip install --upgrade pip
pip install -r requirements.txt
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

Verifica:
- `http://localhost:8000/health`
- `http://localhost:8000/docs`

---

## Paso 16 — Subir voz de prueba

```bash
curl -X POST "http://localhost:8000/voices/upload" \
  -F "file=@/RUTA/A/reference_voice.wav" \
  -F "name=English Narrator"
```

---

## Paso 17 — Probar generación TTS

```bash
curl -X POST "http://localhost:8000/generate" \
  -H "Content-Type: application/json" \
  -d '{
    "text": "Once upon a time [chuckle], a hero rose from the ashes.",
    "voice_id": 1,
    "exaggeration": 0.6,
    "cfg_weight": 0.4,
    "output_format": "both"
  }'
```

---

## Paso 18 — Presets de narración

| Caso | exaggeration | cfg_weight |
|---|---:|---:|
| Narración neutra | 0.5 | 0.5 |
| Narración dramática | 0.7 | 0.3 |
| Speaker rápido | 0.5 | 0.3 |
| Muy expresivo | 0.8 | 0.2 |

---

## Paso 19 — Errores comunes

| Error | Solución |
|---|---|
| `No module named 'chatterbox'` | Instala dentro del venv: `pip install chatterbox-tts` |
| FFmpeg no encontrado | `sudo apt install -y ffmpeg` |
| Lento en CPU | Normal. Usa textos cortos en pruebas |
| Acento raro en voz clonada | Usa clips de referencia en inglés |

---

## Paso 20 — Commit

```bash
git add backend
git commit -m "feat: implement FastAPI backend with Chatterbox TTS"
git push
```

---

## ✅ Checklist antes del Doc 03

- [ ] `GET /health` devuelve `status: ok`
- [ ] `/docs` abre Swagger
- [ ] `POST /voices/upload` sube un `.wav`
- [ ] `GET /voices` lista la voz
- [ ] `POST /generate` crea `.wav` y `.mp3`
- [ ] Archivos en `backend/storage/outputs/`
- [ ] `GET /history` devuelve registros
- [ ] Corre con `uvicorn` localmente
- [ ] Commit subido a GitHub

> **Cuando el checklist esté completo, avísale a Cristian para continuar con el Doc 03 — Frontend Next.js tipo ElevenLabs.**