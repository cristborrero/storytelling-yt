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
    transcript: str | None = None,
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
        transcript=transcript,
    )
    session.add(voice)
    session.commit()
    session.refresh(voice)
    return {"item": voice}
