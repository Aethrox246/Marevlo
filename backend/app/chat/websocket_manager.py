import os
import json
import asyncio
import logging
from fastapi import WebSocket
from typing import Dict, List, Optional

logger = logging.getLogger(__name__)

REDIS_URL = os.getenv("REDIS_URL", "")
PUBSUB_CHANNEL = "chat_events"

# Try to import redis; fall back to pure in-process mode if not available
try:
    import redis.asyncio as aioredis
    _redis_available = True
except ImportError:
    _redis_available = False
    logger.warning("redis package not available – WebSocket messages will NOT sync across instances.")


class ConnectionManager:
    def __init__(self):
        # Maps user_id (int) -> list of active WebSocket connections on THIS instance
        self.active_connections: Dict[int, List[WebSocket]] = {}
        self._redis: Optional[any] = None
        self._pubsub: Optional[any] = None
        self._listener_task: Optional[asyncio.Task] = None

    # ── Redis helpers ──────────────────────────────────────────────────────────

    async def _get_redis(self):
        if self._redis is None and _redis_available and REDIS_URL:
            try:
                self._redis = await aioredis.from_url(REDIS_URL, decode_responses=True)
            except Exception as e:
                logger.error(f"Failed to connect to Redis: {e}")
                self._redis = None
        return self._redis

    async def _start_listener(self):
        """Subscribe to Redis channel and forward messages to local sockets."""
        redis = await self._get_redis()
        if redis is None:
            return
        try:
            self._pubsub = redis.pubsub()
            await self._pubsub.subscribe(PUBSUB_CHANNEL)
            async for msg in self._pubsub.listen():
                if msg["type"] == "message":
                    try:
                        payload = json.loads(msg["data"])
                        await self._deliver_locally(payload)
                    except Exception as e:
                        logger.error(f"Redis listener error: {e}")
        except Exception as e:
            logger.error(f"Redis pubsub connection lost: {e}")
            self._pubsub = None

    async def _deliver_locally(self, payload: dict):
        """Deliver a payload to local WebSocket connections."""
        # Strip internal routing keys before sending to clients
        clean_payload = {k: v for k, v in payload.items() if not k.startswith("_")}

        target_user_id = payload.get("_target_user_id")

        if target_user_id is not None:
            # Ensure int comparison
            target_user_id = int(target_user_id)
            if target_user_id in self.active_connections:
                await self._send_to_user(target_user_id, clean_payload)
        elif payload.get("_broadcast"):
            for uid in list(self.active_connections.keys()):
                await self._send_to_user(uid, clean_payload)

    async def _send_to_user(self, user_id: int, payload: dict):
        """Send payload to all sockets for a user, cleaning up dead ones."""
        if user_id not in self.active_connections:
            return

        dead = []
        for ws in list(self.active_connections[user_id]):
            try:
                await ws.send_json(payload)
            except Exception:
                dead.append(ws)

        # Remove dead connections
        for ws in dead:
            try:
                self.active_connections[user_id].remove(ws)
            except ValueError:
                pass
        if user_id in self.active_connections and not self.active_connections[user_id]:
            del self.active_connections[user_id]

    async def _publish(self, payload: dict):
        """Publish a message to the Redis channel (if available) or deliver locally."""
        redis = await self._get_redis()
        if redis:
            try:
                await redis.publish(PUBSUB_CHANNEL, json.dumps(payload))
            except Exception as e:
                logger.error(f"Redis publish failed, falling back to local: {e}")
                await self._deliver_locally(payload)
        else:
            # No Redis: deliver locally only
            await self._deliver_locally(payload)

    # ── Public API ─────────────────────────────────────────────────────────────

    async def connect(self, websocket: WebSocket, user_id: int):
        await websocket.accept()
        if user_id not in self.active_connections:
            self.active_connections[user_id] = []
        self.active_connections[user_id].append(websocket)

        # Start Redis listener once on first connection
        if self._listener_task is None or self._listener_task.done():
            self._listener_task = asyncio.create_task(self._start_listener())

        await self.broadcast_user_status(user_id, True)
        logger.info(f"User {user_id} connected via WebSocket ({len(self.active_connections[user_id])} sockets)")

    async def disconnect(self, websocket: WebSocket, user_id: int):
        if user_id in self.active_connections:
            try:
                self.active_connections[user_id].remove(websocket)
            except ValueError:
                pass
            if not self.active_connections[user_id]:
                del self.active_connections[user_id]
                await self.broadcast_user_status(user_id, False)
                logger.info(f"User {user_id} fully disconnected")
            else:
                logger.info(f"User {user_id} closed one socket ({len(self.active_connections[user_id])} remaining)")

    async def send_personal_message(self, message: dict, user_id: int):
        """Send a message to a specific user (across all their sockets/instances)."""
        payload = {**message, "_target_user_id": user_id}
        await self._publish(payload)

    async def broadcast_user_status(self, user_id: int, is_online: bool):
        payload = {
            "type": "status_update",
            "user_id": user_id,
            "status": "online" if is_online else "offline",
            "_broadcast": True,
        }
        await self._publish(payload)


manager = ConnectionManager()
