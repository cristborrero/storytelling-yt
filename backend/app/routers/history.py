from fastapi import APIRouter, Depends, HTTPException
from sqlmodel import Session, select
from app.database import get_session
from app.models.generation import Generation
from app.config import OUTPUTS_DIR

router = APIRouter(prefix="/history", tags=["history"])


@router.get("")
def list_history(session: Session = Depends(get_session), limit: int = 50):
    items = session.exec(
        select(Generation).order_by(Generation.created_at.desc()).limit(limit)
    ).all()
    return {"items": items}


@router.delete("/{id}")
def delete_generation(id: int, session: Session = Depends(get_session)):
    item = session.get(Generation, id)
    if not item:
        raise HTTPException(status_code=404, detail="Generation not found")

    # Delete physical audio files if they exist
    if item.output_wav_filename:
        wav_path = OUTPUTS_DIR / item.output_wav_filename
        if wav_path.exists():
            try:
                wav_path.unlink()
            except OSError as e:
                print(f"Error deleting wav file {wav_path}: {e}")

    if item.output_mp3_filename:
        mp3_path = OUTPUTS_DIR / item.output_mp3_filename
        if mp3_path.exists():
            try:
                mp3_path.unlink()
            except OSError as e:
                print(f"Error deleting mp3 file {mp3_path}: {e}")

    session.delete(item)
    session.commit()
    return {"status": "success", "message": "Generation deleted"}
