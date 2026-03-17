from datetime import datetime
from typing import Optional, List, Any

from pydantic import BaseModel


class ProfileOut(BaseModel):
    user_id: str
    name: Optional[str] = None
    headline: Optional[str] = None
    bio: Optional[str] = None
    location: Optional[str] = None
    level: Optional[str] = None
    interests: Optional[str] = None
    skills: Optional[Any] = None
    xp: int = 0
    avatar_url: Optional[str] = None
    github_url: Optional[str] = None
    linkedin_url: Optional[str] = None
    resume_url: Optional[str] = None
    created_at: Optional[datetime] = None
    updated_at: Optional[datetime] = None

    class Config:
        from_attributes = True


class ProfileUpdate(BaseModel):
    name: Optional[str] = None
    headline: Optional[str] = None
    bio: Optional[str] = None
    location: Optional[str] = None
    github_url: Optional[str] = None
    linkedin_url: Optional[str] = None
    skills: Optional[Any] = None


class StatsOut(BaseModel):
    xp: int = 0
    level: int = 1
    streak: int = 0
    rank: Optional[int] = None
    courses_completed: int = 0
    problems_solved: int = 0


class AchievementOut(BaseModel):
    badge_key: str
    label: str
    description: str
    icon: str          # emoji used on frontend
    color: str         # hex accent
    earned_at: Optional[datetime] = None

    class Config:
        from_attributes = True
