"""
Profile router — all /profile/* endpoints.
Authentication: Bearer JWT (same as /auth/me).
"""
from fastapi import APIRouter, Depends, HTTPException, UploadFile, File
from sqlalchemy.orm import Session
import base64

from app.core.dependencies import get_db
from app.auth.dependencies import oauth2_scheme
from app.auth.utils.security import decode_token
from app.profile.schemas.profile import ProfileOut, ProfileUpdate, StatsOut, AchievementOut
from app.profile import crud
from typing import List

router = APIRouter(prefix="/profile", tags=["profile"])


def _get_user_id(token: str = Depends(oauth2_scheme)) -> int:
    """Decode JWT and return user_id as int."""
    try:
        payload = decode_token(token)
        return int(payload["sub"])
    except Exception:
        raise HTTPException(status_code=401, detail="Invalid or expired token")


# ─────────────────────────────────────────────
# GET /profile/me   — full profile
# ─────────────────────────────────────────────
@router.get("/me", response_model=ProfileOut)
def get_my_profile(
    user_id: int = Depends(_get_user_id),
    db: Session = Depends(get_db),
):
    return crud.profile.get_or_create_profile(db, str(user_id))


# ─────────────────────────────────────────────
# PUT /profile/me   — update bio, location, etc.
# ─────────────────────────────────────────────
@router.put("/me", response_model=ProfileOut)
def update_my_profile(
    body: ProfileUpdate,
    user_id: int = Depends(_get_user_id),
    db: Session = Depends(get_db),
):
    return crud.profile.update_profile(db, str(user_id), body.model_dump(exclude_none=True))


# ─────────────────────────────────────────────
# GET /profile/stats  — XP, level, streak, rank, courses, solved
# ─────────────────────────────────────────────
@router.get("/stats", response_model=StatsOut)
def get_my_stats(
    user_id: int = Depends(_get_user_id),
    db: Session = Depends(get_db),
):
    return crud.profile.get_stats(db, user_id)


# ─────────────────────────────────────────────
# GET /profile/activity  — activity grid data
# ─────────────────────────────────────────────
@router.get("/activity")
def get_my_activity(
    user_id: int = Depends(_get_user_id),
    db: Session = Depends(get_db),
):
    return crud.profile.get_activity(db, user_id, days=70)


# ─────────────────────────────────────────────
# GET /profile/achievements
# ─────────────────────────────────────────────
@router.get("/achievements", response_model=List[AchievementOut])
def get_my_achievements(
    user_id: int = Depends(_get_user_id),
    db: Session = Depends(get_db),
):
    return crud.profile.get_achievements(db, user_id)


# ─────────────────────────────────────────────
# POST /profile/resume  — upload PDF/DOCX
# ─────────────────────────────────────────────
@router.post("/resume")
async def upload_resume(
    file: UploadFile = File(...),
    user_id: int = Depends(_get_user_id),
    db: Session = Depends(get_db),
):
    if file.content_type not in (
        "application/pdf",
        "application/msword",
        "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    ):
        raise HTTPException(status_code=400, detail="Only PDF and Word documents are accepted")

    contents = await file.read()
    if len(contents) > 5 * 1024 * 1024:
        raise HTTPException(status_code=400, detail="File too large (max 5 MB)")

    content_b64 = base64.b64encode(contents).decode()
    resume_url = crud.profile.save_resume(db, str(user_id), file.filename or "resume.pdf", content_b64)
    return {"resume_url": resume_url, "filename": file.filename}
