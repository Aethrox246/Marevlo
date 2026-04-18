"""Pydantic schemas for course reactions and comments."""

from pydantic import BaseModel, Field
from datetime import datetime
from typing import Optional, Literal


# ── Reactions ──────────────────────────────────────────────────────

class ReactRequest(BaseModel):
    """Body for POST /courses/{course_id}/react"""
    type: Literal["like", "dislike"]


class ReactionsResponse(BaseModel):
    """Response for GET /courses/{course_id}/reactions and POST .../react"""
    likes: int
    dislikes: int
    reaction: Optional[Literal["like", "dislike"]] = None  # current user's vote
    my_reaction: Optional[Literal["like", "dislike"]] = None  # alias used by frontend


# ── Comments ───────────────────────────────────────────────────────

class CommentCreate(BaseModel):
    content: str = Field(..., min_length=1, max_length=500)


class CommentOut(BaseModel):
    id: int
    author: str          # username
    user_id: int
    content: str
    created_at: datetime

    class Config:
        from_attributes = True


class CommentsPage(BaseModel):
    comments: list[CommentOut]
    has_more: bool
