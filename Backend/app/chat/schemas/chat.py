"""Chat schemas (DM, follow, messages)."""
from __future__ import annotations

from typing import List, Optional

from pydantic import BaseModel, ConfigDict, Field


class MessageOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    sender_id: int
    sender_username: str
    content: str
    is_edited: bool
    created_at: str
    time_ago: str
    session_id: Optional[int] = None
    log_id: Optional[int] = None


class ChatOut(BaseModel):
    id: int
    user_1_id: int
    user_2_id: int
    user_1_username: str
    user_2_username: str
    is_active: bool
    last_message_preview: Optional[str] = None
    last_message_at: Optional[str] = None
    unread_count: int = 0
    created_at: str


class ChatDetailOut(BaseModel):
    id: int
    user_1_id: int
    user_2_id: int
    user_1_username: str
    user_2_username: str
    is_active: bool
    messages: List[MessageOut] = []
    created_at: str


class ChatListOut(BaseModel):
    chats: List[ChatOut]
    pagination: dict


class MessageCreate(BaseModel):
    content: str = Field(..., min_length=1, max_length=10_000)


class FollowOut(BaseModel):
    id: int
    follower_id: int
    following_id: int
    follower_username: str
    following_username: str
    created_at: str


class UserSearchOut(BaseModel):
    id: int
    username: str
