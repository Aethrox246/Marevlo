"""Chat HTTP endpoints."""

from fastapi import APIRouter, BackgroundTasks, Depends, Query
from sqlalchemy.orm import Session

from app.auth.models.user import User
from app.chat.schemas.chat import (
    ChatDetailOut,
    ChatListOut,
    ChatOut,
    FollowOut,
    MessageCreate,
    MessageOut,
    UserSearchOut,
)
from app.chat.services.chat_service import chat_service
from app.chat.services.connection_manager import connection_manager
from app.core.dependencies import get_current_user, get_db
from app.core.idempotency import IdempotencyContext, idempotency
from app.feed.schemas.post import format_relative_time

router = APIRouter(prefix="/chat", tags=["chat"])


def _msg_to_out(m, sender_username: str) -> MessageOut:
    return MessageOut(
        id=m.id,
        sender_id=m.sender_id,
        sender_username=sender_username,
        content=m.content,
        is_edited=m.is_edited,
        created_at=m.created_at.isoformat(),
        time_ago=format_relative_time(m.created_at),
        session_id=m.session_id,
        log_id=m.log_id,
    )


# ── Chats ───────────────────────────────────────────────────────────────
@router.get("/chats", response_model=ChatListOut)
def list_chats(
    page: int = Query(1, ge=1),
    limit: int = Query(20, ge=1, le=100),
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    items, total = chat_service.list_chats(
        db, current_user_id=user.id, page=page, limit=limit
    )
    return ChatListOut(
        chats=[ChatOut(**i) for i in items],
        pagination={
            "page": page,
            "limit": limit,
            "total_count": total,
            "total_pages": (total + limit - 1) // limit if limit else 0,
        },
    )


@router.get("/chats/{user_id}", response_model=ChatDetailOut)
def get_or_create_chat(
    user_id: int,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    chat = chat_service.get_or_create_chat(
        db, current_user_id=user.id, other_user_id=user_id
    )
    messages = chat_service.get_chat_messages(db, chat=chat)
    # Bulk fetch usernames for participants
    from sqlalchemy import select

    users = {
        u.id: u
        for u in db.execute(
            select(User).where(User.id.in_([chat.user_1_id, chat.user_2_id]))
        ).scalars().all()
    }
    return ChatDetailOut(
        id=chat.id,
        user_1_id=chat.user_1_id,
        user_2_id=chat.user_2_id,
        user_1_username=users[chat.user_1_id].username,
        user_2_username=users[chat.user_2_id].username,
        is_active=chat.is_active,
        messages=[_msg_to_out(m, m.sender.username if m.sender else "deleted_user") for m in messages],
        created_at=chat.created_at.strftime("%Y-%m-%d"),
    )


@router.post("/chats/{chat_id}/messages", response_model=MessageOut)
def send_message(
    chat_id: int,
    body: MessageCreate,
    background: BackgroundTasks,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
    idem: IdempotencyContext = Depends(idempotency),
):
    cached = idem.replay()
    if cached is not None:
        return cached

    msg, recipient = chat_service.send_message(
        db,
        chat_id=chat_id,
        sender_id=user.id,
        content=body.content,
        session_id=getattr(user, "session_id", None),
    )
    out = _msg_to_out(msg, user.username)

    # Push to both participants over WebSocket so all open tabs sync.
    payload = {
        "type": "new_message",
        "chat_id": chat_id,
        "message": {**out.model_dump(), "receiver_id": recipient},
    }
    background.add_task(connection_manager.send_to_user, recipient, payload)
    background.add_task(connection_manager.send_to_user, user.id, payload)

    idem.store(out)
    return out


@router.post("/chats/{chat_id}/messages/{message_id}/read")
def mark_read(
    chat_id: int,
    message_id: int,
    background: BackgroundTasks,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    sender_id = chat_service.mark_read(db, message_id=message_id, reader_id=user.id)
    if sender_id is not None:
        background.add_task(
            connection_manager.send_to_user,
            sender_id,
            {
                "type": "read_receipt",
                "chat_id": chat_id,
                "message_id": message_id,
                "reader_id": user.id,
            },
        )
    return {"message": "ok"}


# ── Follows ─────────────────────────────────────────────────────────────
@router.post("/users/{user_id}/follow", response_model=FollowOut)
def follow_user(
    user_id: int,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    f = chat_service.follow(db, follower_id=user.id, target_id=user_id)
    target = db.get(User, user_id)
    return FollowOut(
        id=f.id,
        follower_id=f.follower_id,
        following_id=f.following_id,
        follower_username=user.username,
        following_username=target.username if target else "",
        created_at=f.created_at.strftime("%Y-%m-%d"),
    )


@router.delete("/users/{user_id}/follow")
def unfollow_user(
    user_id: int,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    chat_service.unfollow(db, follower_id=user.id, target_id=user_id)
    return {"message": "Unfollowed"}


@router.get("/users/{user_id}/followers")
def get_followers(
    user_id: int,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    items = chat_service.list_followers(db, user_id)
    return {"user_id": user_id, "followers_count": len(items), "followers": items}


@router.get("/users/{user_id}/following")
def get_following(
    user_id: int,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    items = chat_service.list_following(db, user_id)
    return {"user_id": user_id, "following_count": len(items), "following": items}


@router.get("/users/search", response_model=list[UserSearchOut])
def search_users(
    q: str = Query(..., min_length=1, max_length=64),
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    return chat_service.search_users(db, q=q, exclude_user_id=user.id)
