from fastapi import WebSocket
from typing import Dict, List

class ConnectionManager:
    def __init__(self):
        # Maps user_id to a list of active WebSocket connections
        self.active_connections: Dict[int, List[WebSocket]] = {}

    async def connect(self, websocket: WebSocket, user_id: int):
        await websocket.accept()
        if user_id not in self.active_connections:
            self.active_connections[user_id] = []
        self.active_connections[user_id].append(websocket)
        await self.broadcast_user_status(user_id, True)

    async def disconnect(self, websocket: WebSocket, user_id: int):
        if user_id in self.active_connections:
            if websocket in self.active_connections[user_id]:
                self.active_connections[user_id].remove(websocket)
            if not self.active_connections[user_id]:
                del self.active_connections[user_id]
                await self.broadcast_user_status(user_id, False)

    async def send_personal_message(self, message: dict, user_id: int):
        if user_id in self.active_connections:
            for connection in self.active_connections[user_id]:
                try:
                    await connection.send_json(message)
                except Exception:
                    pass

    async def broadcast_user_status(self, user_id: int, is_online: bool):
        status_msg = {
            "type": "status_update",
            "user_id": user_id,
            "status": "online" if is_online else "offline"
        }
        for users_sockets in self.active_connections.values():
            for connection in users_sockets:
                try:
                    await connection.send_json(status_msg)
                except Exception:
                    pass

manager = ConnectionManager()
