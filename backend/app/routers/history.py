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
