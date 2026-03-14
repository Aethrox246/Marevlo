from sqlalchemy.orm import Session
from app.profile.models.profile import UserProfile

def get_or_create_profile(db: Session, user_id: str):
    profile = db.get(UserProfile, user_id)

    if profile:
        return profile

    profile = UserProfile(user_id=user_id)
    db.add(profile)
    db.commit()
    db.refresh(profile)
    return profile
