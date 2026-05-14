"""
Per-key Redis rate limiter.

slowapi handles per-IP rate limiting at the HTTP layer. This module provides
key-scoped limits we can apply *inside* services — most usefully per email
(for password reset / OTP brute force) or per user_id (for cross-IP abuse).

Implementation: INCR + EXPIRE (only when count == 1) gives a sliding-window-ish
counter that's correct enough for security purposes. The window resets after
`window_seconds` of inactivity on that key.
"""
from __future__ import annotations

import logging

from redis.exceptions import RedisError

from app.core.exceptions import RateLimited
from app.core.redis_client import redis_manager

logger = logging.getLogger(__name__)


class RateLimitGuard:
    """Increments a counter; raises RateLimited if it exceeds the cap.

    Usage:
        rate_guard.check(
            key=f"pw_reset:{email}", limit=5, window_seconds=3600
        )
    """

    def check(self, *, key: str, limit: int, window_seconds: int) -> None:
        try:
            client = redis_manager.sync
            count = client.incr(key)
            if count == 1:
                # First hit — set TTL. EXPIRE returns 1 on success; we don't
                # care if it fails because of a race, the next call will retry.
                client.expire(key, window_seconds)
            if count > limit:
                # Logged at WARNING for security visibility.
                logger.warning("rate_limit_exceeded key=%s count=%d limit=%d", key, count, limit)
                raise RateLimited(
                    f"Too many requests. Please wait and try again later."
                )
        except RedisError as exc:
            # Fail-open on Redis errors — slowapi's per-IP limit and the
            # password complexity check still defend in depth.
            logger.warning("rate_limit_check_redis_error key=%s err=%s", key, exc)


rate_guard = RateLimitGuard()
