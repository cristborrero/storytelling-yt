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

    # NOTE: TTSService.generate_wav is CPU-bound/blocking.
    # FastAPI runs sync endpoints in a thread pool automatically,
    # so this is safe — it won't block the event loop.
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
