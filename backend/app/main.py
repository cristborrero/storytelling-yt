from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse, JSONResponse
from app.config import OUTPUTS_DIR, settings
from app.database import create_db_and_tables
from app.routers import history, tts, voices


@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup: create DB tables
    create_db_and_tables()
    yield
    # Shutdown: nothing to clean up for now


app = FastAPI(
    title=settings.app_name,
    version="0.1.0",
    description="Self-hosted TTS API powered by Chatterbox",
    lifespan=lifespan,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.allowed_origins_list,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

import traceback
from fastapi import Request

@app.exception_handler(Exception)
async def global_exception_handler(request: Request, exc: Exception):
    print(f"Unhandled exception: {exc}")
    traceback.print_exc()
    return JSONResponse(
        status_code=500,
        content={"detail": f"Internal Server Error: {str(exc)}"},
    )

app.include_router(voices.router)
app.include_router(tts.router)
app.include_router(history.router)


@app.get("/health", tags=["health"])
def health():
    return {
        "status": "ok",
        "environment": settings.app_env,
        "device": settings.tts_device,
    }


@app.get("/audio/{filename}", tags=["audio"])
def get_audio(filename: str):
    # Prevent path traversal
    file_path = (OUTPUTS_DIR / filename).resolve()
    if not file_path.is_relative_to(OUTPUTS_DIR.resolve()):
        return JSONResponse(status_code=400, content={"detail": "Invalid filename"})
    if not file_path.exists() or not file_path.is_file():
        return JSONResponse(status_code=404, content={"detail": "File not found"})
    media_type = "audio/mpeg" if file_path.suffix.lower() == ".mp3" else "audio/wav"
    return FileResponse(path=file_path, media_type=media_type, filename=file_path.name)
