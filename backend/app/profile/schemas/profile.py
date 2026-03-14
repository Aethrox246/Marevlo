from datetime import datetime
from typing import Optional

from pydantic import BaseModel


class ProfileOut(BaseModel):
    user_id: str
    name: Optional[str] = None
    bio: Optional[str] = None
    location: Optional[str] = None
    level: Optional[str] = None
    interests: Optional[str] = None
    avatar_url: Optional[str] = None
    created_at: Optional[datetime] = None
    updated_at: Optional[datetime] = None

    class Config:
        orm_mode = True
