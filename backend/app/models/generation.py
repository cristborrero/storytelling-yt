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
