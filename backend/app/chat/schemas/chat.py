from pydantic import BaseModel
from typing import Optional, List
from datetime import datetime


def format_message_time(dt: datetime) -> str:
    """Convert datetime to relative time string"""
    if not dt:
        return "Unknown"
    now = datetime.utcnow()
    diff = now - dt
    seconds = diff.total_seconds()
    
    if seconds < 60:
        return "Just now"
    elif seconds < 3600:
        return f"{int(seconds // 60)}m ago"
    elif seconds < 86400:
        return f"{int(seconds // 3600)}h ago"
    elif seconds < 604800:
        return f"{int(seconds // 86400)}d ago"
    else:
        return dt.strftime("%b %d")


class UserMinimal(BaseModel):
    """Minimal user info for chat"""
    id: int
    username: str
    
    class Config:
        from_attributes = True


class MessageResponse(BaseModel):
    """Message in a chat"""
    id: int
    sender_id: int
    sender_username: str
    content: str
    is_edited: bool
    created_at: str
    time_ago: str
    session_id: Optional[int] = None
    log_id: Optional[int] = None
    
    class Config:
        from_attributes = True


class ChatResponse(BaseModel):
    """Chat conversation"""
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
    
    class Config:
        from_attributes = True


class ChatDetailResponse(BaseModel):
    """Detailed chat with all messages"""
    id: int
    user_1_id: int
    user_2_id: int
    user_1_username: str
    user_2_username: str
    is_active: bool
    messages: List[MessageResponse] = []
    created_at: str
    
    class Config:
        from_attributes = True


class MessageCreate(BaseModel):
    """Create a message"""
    content: str
    
    class Config:
        example = {"content": "Hey! How are you?"}


class FollowRequest(BaseModel):
    """Follow a user"""
    following_id: int
    
    class Config:
        example = {"following_id": 5}


class FollowResponse(BaseModel):
    """Follow response"""
    id: int
    follower_id: int
    following_id: int
    follower_username: str
    following_username: str
    created_at: str
    
    class Config:
        from_attributes = True


class ChatListResponse(BaseModel):
    """List of chats with pagination"""
    chats: List[ChatResponse]
    pagination: dict
    
    class Config:
        from_attributes = True
