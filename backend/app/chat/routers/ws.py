from fastapi import APIRouter, WebSocket, WebSocketDisconnect, Depends, Query
from sqlalchemy.orm import Session
from jose import jwt
from app.core.dependencies import get_db
from app.auth.models.user import User
from app.core.config import JWT_SECRET, ALGORITHM
from app.chat.websocket_manager import manager
from typing import Optional

router = APIRouter(prefix="/chat", tags=["chat_ws"])

async def get_current_user_ws(token: str, db: Session) -> User:
    try:
        payload = jwt.decode(token, JWT_SECRET, algorithms=[ALGORITHM])
        user_id: str = payload.get("sub")
        if user_id is None:
            raise Exception("Invalid token format")
        
        user = db.query(User).filter(User.id == int(user_id)).first()
        if user is None:
            raise Exception("User not found")
        if not user.is_active:
            raise Exception("Inactive user")
        
        return user
    except Exception as e:
        raise Exception(f"Token validation failed: {str(e)}")

@router.websocket("/ws")
async def websocket_endpoint(
    websocket: WebSocket,
    token: str = Query(...),
    db: Session = Depends(get_db)
):
    try:
        user = await get_current_user_ws(token, db)
    except Exception as e:
        await websocket.close(code=1008, reason=str(e))
        return

    await manager.connect(websocket, user.id)
    try:
        while True:
            # Receive basic payload, e.g. typing indicators
            data = await websocket.receive_text()
    except WebSocketDisconnect:
        await manager.disconnect(websocket, user.id)
