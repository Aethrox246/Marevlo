from fastapi import APIRouter, Depends, Header, HTTPException
from sqlalchemy.orm import Session

from app.core.dependencies import get_db
from app.profile.crud.profile import get_or_create_profile
from app.profile.schemas.profile import ProfileOut

router = APIRouter(prefix="/me", tags=["me"])

@router.get("", response_model=ProfileOut)
def get_me(
    x_user_id: str | None = Header(default=None),
    db: Session = Depends(get_db),
):
    if not x_user_id:
        raise HTTPException(status_code=401, detail="Missing user id")

    return get_or_create_profile(db, x_user_id)
