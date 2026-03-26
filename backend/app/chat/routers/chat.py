from fastapi import APIRouter, Depends, HTTPException, Query, BackgroundTasks
from sqlalchemy.orm import Session
from sqlalchemy import or_, and_
from app.core.dependencies import get_db, get_current_user
from app.chat.schemas.chat import (
    MessageCreate, MessageResponse, ChatResponse, ChatDetailResponse, 
    FollowRequest, FollowResponse, ChatListResponse
)
from app.auth.models.user import User
from app.auth.models.session import UserSession
from app.chat.models.chat import Chat, Message, MessageRead, Follow
from app.core.activity_model import ActivityLog
from datetime import datetime, timezone
from typing import Optional
import asyncio
from app.chat.websocket_manager import manager


def format_message_time(dt: datetime) -> str:
    """Convert datetime to relative time string"""
    if not dt:
        return "Unknown"
    # Use timezone-aware datetime
    now = datetime.now(timezone.utc)
    # Make dt timezone-aware if it isn't
    if dt.tzinfo is None:
        dt = dt.replace(tzinfo=timezone.utc)
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


router = APIRouter(prefix="/chat", tags=["chat"])


@router.get("/chats", response_model=ChatListResponse)
def list_chats(
    page: int = Query(1, ge=1),
    limit: int = Query(20, ge=1, le=100),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    List all chats for the current user.
    """
    query = db.query(Chat).filter(
        or_(Chat.user_1_id == current_user.id, Chat.user_2_id == current_user.id)
    ).order_by(Chat.last_message_at.desc().nullsfirst())
    
    total = query.count()
    chats = query.offset((page - 1) * limit).limit(limit).all()
    
    chats_response = []
    for chat in chats:
        other_user_id = chat.user_2_id if chat.user_1_id == current_user.id else chat.user_1_id
        other_user = db.query(User).filter(User.id == other_user_id).first()
        
        last_message = db.query(Message).filter(
            Message.chat_id == chat.id
        ).order_by(Message.created_at.desc()).first()
        
        last_message_preview = last_message.content[:50] if last_message else None
        last_message_at = format_message_time(chat.last_message_at) if chat.last_message_at else None
        
        # Count unread messages
        unread_count = db.query(MessageRead).filter(
            MessageRead.message_id.in_(
                db.query(Message.id).filter(Message.chat_id == chat.id, Message.sender_id != current_user.id)
            ),
            ~MessageRead.reader_id.in_([current_user.id])
        ).count()
        
        user_1 = db.query(User).filter(User.id == chat.user_1_id).first()
        user_2 = db.query(User).filter(User.id == chat.user_2_id).first()
        
        chats_response.append(ChatResponse(
            id=chat.id,
            user_1_id=chat.user_1_id,
            user_2_id=chat.user_2_id,
            user_1_username=user_1.username,
            user_2_username=user_2.username,
            is_active=chat.is_active,
            last_message_preview=last_message_preview,
            last_message_at=last_message_at,
            unread_count=unread_count,
            created_at=chat.created_at.strftime("%Y-%m-%d")
        ))
    
    return ChatListResponse(
        chats=chats_response,
        pagination={
            "page": page,
            "limit": limit,
            "total_count": total,
            "total_pages": (total + limit - 1) // limit
        }
    )


@router.get("/chats/{user_id}", response_model=ChatDetailResponse)
def get_or_create_chat(
    user_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Get existing chat with a user or create new one.
    """
    if user_id == current_user.id:
        raise HTTPException(status_code=400, detail="Cannot chat with yourself")
    
    other_user = db.query(User).filter(User.id == user_id).first()
    if not other_user:
        raise HTTPException(status_code=404, detail="User not found")
    
    # Find existing chat
    chat = db.query(Chat).filter(
        or_(
            and_(Chat.user_1_id == current_user.id, Chat.user_2_id == user_id),
            and_(Chat.user_1_id == user_id, Chat.user_2_id == current_user.id)
        )
    ).first()
    
    # Create new chat if doesn't exist
    if not chat:
        chat = Chat(user_1_id=current_user.id, user_2_id=user_id)
        db.add(chat)
        db.commit()
        db.refresh(chat)
    
    # Get messages
    messages = db.query(Message).filter(Message.chat_id == chat.id).order_by(Message.created_at.asc()).all()
    
    messages_response = [
        MessageResponse(
            id=m.id,
            sender_id=m.sender_id,
            sender_username=m.sender.username,
            content=m.content,
            is_edited=m.is_edited,
            created_at=m.created_at.isoformat(),
            time_ago=format_message_time(m.created_at),
            session_id=m.session_id,
            log_id=m.log_id
        )
        for m in messages
    ]
    
    user_1 = db.query(User).filter(User.id == chat.user_1_id).first()
    user_2 = db.query(User).filter(User.id == chat.user_2_id).first()
    
    return ChatDetailResponse(
        id=chat.id,
        user_1_id=chat.user_1_id,
        user_2_id=chat.user_2_id,
        user_1_username=user_1.username,
        user_2_username=user_2.username,
        is_active=chat.is_active,
        messages=messages_response,
        created_at=chat.created_at.strftime("%Y-%m-%d")
    )


@router.post("/chats/{chat_id}/messages", response_model=MessageResponse)
def send_message(
    chat_id: int,
    message_data: MessageCreate,
    background_tasks: BackgroundTasks,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Send a message in a chat.
    """
    chat = db.query(Chat).filter(Chat.id == chat_id).first()
    if not chat:
        raise HTTPException(status_code=404, detail="Chat not found")
    
    # Verify user is part of this chat
    if chat.user_1_id != current_user.id and chat.user_2_id != current_user.id:
        raise HTTPException(status_code=403, detail="Not authorized to send message in this chat")
    
    session_id = getattr(current_user, "session_id", None)
    if session_id is None:
        active_session = db.query(UserSession).filter(
            UserSession.user_id == current_user.id,
            UserSession.logout_time.is_(None)
        ).order_by(UserSession.login_time.desc()).first()
        session_id = active_session.id if active_session else None

    log = ActivityLog(
        user_id=current_user.id,
        action="send_message",
        meta={
            "chat_id": chat_id,
            "content_length": len(message_data.content or "")
        }
    )
    db.add(log)
    db.flush()

    new_message = Message(
        chat_id=chat_id,
        sender_id=current_user.id,
        session_id=session_id,
        log_id=log.id,
        content=message_data.content
    )
    db.add(new_message)
    
    # Update chat's last_message_at
    chat.last_message_at = datetime.utcnow()
    
    db.commit()
    db.refresh(new_message)

    msg_response = MessageResponse(
        id=new_message.id,
        sender_id=new_message.sender_id,
        sender_username=current_user.username,
        content=new_message.content,
        is_edited=new_message.is_edited,
        created_at=new_message.created_at.isoformat(),
        time_ago="Just now",
        session_id=new_message.session_id,
        log_id=new_message.log_id
    )

    ws_msg = {
        "type": "new_message",
        "chat_id": chat_id,
        "message": msg_response.model_dump()
    }
    other_user_id = chat.user_1_id if chat.user_2_id == current_user.id else chat.user_2_id
    background_tasks.add_task(manager.send_personal_message, ws_msg, other_user_id)
    background_tasks.add_task(manager.send_personal_message, ws_msg, current_user.id)

    return msg_response


@router.post("/chats/{chat_id}/messages/{message_id}/read")
def mark_message_as_read(
    chat_id: int,
    message_id: int,
    background_tasks: BackgroundTasks,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Mark a message as read.
    """
    message = db.query(Message).filter(Message.id == message_id, Message.chat_id == chat_id).first()
    if not message:
        raise HTTPException(status_code=404, detail="Message not found")
    
    # Check if already read
    existing_read = db.query(MessageRead).filter(
        MessageRead.message_id == message_id,
        MessageRead.reader_id == current_user.id
    ).first()
    
    if not existing_read:
        message_read = MessageRead(message_id=message_id, reader_id=current_user.id)
        db.add(message_read)
        db.commit()

        ws_msg = {
            "type": "read_receipt",
            "chat_id": chat_id,
            "message_id": message_id,
            "reader_id": current_user.id
        }
        background_tasks.add_task(manager.send_personal_message, ws_msg, message.sender_id)
    
    return {"message": "Message marked as read"}


@router.post("/users/{user_id}/follow", response_model=FollowResponse)
def follow_user(
    user_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Follow a user.
    """
    if user_id == current_user.id:
        raise HTTPException(status_code=400, detail="Cannot follow yourself")
    
    target_user = db.query(User).filter(User.id == user_id).first()
    if not target_user:
        raise HTTPException(status_code=404, detail="User not found")
    
    # Check if already following
    existing = db.query(Follow).filter(
        Follow.follower_id == current_user.id,
        Follow.following_id == user_id
    ).first()
    
    if existing:
        raise HTTPException(status_code=400, detail="Already following this user")
    
    new_follow = Follow(follower_id=current_user.id, following_id=user_id)
    db.add(new_follow)
    db.commit()
    db.refresh(new_follow)
    
    follower = db.query(User).filter(User.id == current_user.id).first()
    
    return FollowResponse(
        id=new_follow.id,
        follower_id=new_follow.follower_id,
        following_id=new_follow.following_id,
        follower_username=follower.username,
        following_username=target_user.username,
        created_at=new_follow.created_at.strftime("%Y-%m-%d")
    )


@router.delete("/users/{user_id}/follow")
def unfollow_user(
    user_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Unfollow a user.
    """
    follow = db.query(Follow).filter(
        Follow.follower_id == current_user.id,
        Follow.following_id == user_id
    ).first()
    
    if not follow:
        raise HTTPException(status_code=404, detail="Not following this user")
    
    db.delete(follow)
    db.commit()
    
    return {"message": "Unfollowed successfully"}


@router.get("/users/{user_id}/followers")
def get_followers(
    user_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Get list of followers for a user.
    """
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    
    followers = db.query(Follow).filter(Follow.following_id == user_id).all()
    
    follower_list = []
    for follow in followers:
        follower = db.query(User).filter(User.id == follow.follower_id).first()
        follower_list.append({
            "id": follower.id,
            "username": follower.username,
            "followed_at": follow.created_at.strftime("%Y-%m-%d")
        })
    
    return {
        "user_id": user_id,
        "followers_count": len(follower_list),
        "followers": follower_list
    }


@router.get("/users/{user_id}/following")
def get_following(
    user_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Get list of users that a user is following.
    """
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    
    following = db.query(Follow).filter(Follow.follower_id == user_id).all()
    
    following_list = []
    for follow in following:
        following_user = db.query(User).filter(User.id == follow.following_id).first()
        following_list.append({
            "id": following_user.id,
            "username": following_user.username,
            "followed_at": follow.created_at.strftime("%Y-%m-%d")
        })
    
    return {
        "user_id": user_id,
        "following_count": len(following_list),
        "following": following_list
    }


@router.get("/users/search", response_model=list)
def search_users(
    q: str = Query(..., min_length=1),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Search for users by username.
    """
    results = db.query(User).filter(
        User.username.ilike(f"%{q}%"),
        User.is_active == True,
        User.id != current_user.id
    ).limit(10).all()
    
    return [
        {
            "id": user.id,
            "username": user.username,
            "email": user.email
        }
        for user in results
    ]
