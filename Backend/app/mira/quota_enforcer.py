"""Quota enforcement — per-tier rate limiting with atomic Redis counters.

Every tier has a quota:
  - FREE:    10/month
  - SPARK:   40/day
  - STARTER: 80/month
  - PLUS:    250/month
  - PRO:     400/month
  - ELITE:   1200/month

Atomic Redis INCR + EXPIRE handles concurrency. In tests, an in-memory
backend provides identical behavior.

Returns (allowed, remaining, period_resets_at).
"""
from __future__ import annotations

import calendar
from abc import ABC, abstractmethod
from dataclasses import dataclass
from datetime import datetime, timedelta, timezone
from typing import Any

from app.mira.models.schemas import Tier


# Tier → quota per period
QUOTA_LIMITS: dict[Tier, int] = {
    Tier.FREE: 10,
    Tier.SPARK: 40,
    Tier.STARTER: 80,
    Tier.PLUS: 250,
    Tier.PRO: 400,
    Tier.ELITE: 1200,
}

# Tier → period type ("day" | "month")
PERIOD_TYPE: dict[Tier, str] = {
    Tier.FREE: "month",
    Tier.SPARK: "day",
    Tier.STARTER: "month",
    Tier.PLUS: "month",
    Tier.PRO: "month",
    Tier.ELITE: "month",
}


@dataclass
class QuotaCheck:
    allowed: bool
    remaining: int
    used: int
    limit: int
    period_resets_at: datetime


# ---------------------------------------------------------------------------
# Backends
# ---------------------------------------------------------------------------
class QuotaBackend(ABC):
    @abstractmethod
    async def try_consume(self, key: str, limit: int, resets_at: datetime) -> tuple[bool, int]:
        """Atomic check-and-increment. Returns (allowed, used_after)."""

    @abstractmethod
    async def get_used(self, key: str) -> int:
        ...


class InMemoryQuotaBackend(QuotaBackend):
    """For tests. Not concurrency-safe, but tests are single-threaded."""

    def __init__(self):
        self._counters: dict[str, int] = {}
        self._expires: dict[str, datetime] = {}

    async def try_consume(
        self, key: str, limit: int, resets_at: datetime
    ) -> tuple[bool, int]:
        # Clear if expired
        now = datetime.now(timezone.utc)
        if key in self._expires and self._expires[key] <= now:
            self._counters.pop(key, None)
            self._expires.pop(key, None)

        current = self._counters.get(key, 0)
        if current >= limit:
            return (False, current)
        self._counters[key] = current + 1
        self._expires[key] = resets_at
        return (True, current + 1)

    async def get_used(self, key: str) -> int:
        now = datetime.now(timezone.utc)
        if key in self._expires and self._expires[key] <= now:
            self._counters.pop(key, None)
            self._expires.pop(key, None)
        return self._counters.get(key, 0)


class RedisQuotaBackend(QuotaBackend):
    """Production Redis backend. Lazy-imports redis."""

    def __init__(self, redis_url: str = "redis://localhost:6379/0"):
        self.redis_url = redis_url
        self._client = None

    def _get_client(self):
        if self._client is None:
            from redis import asyncio as redis_async
            self._client = redis_async.from_url(self.redis_url)
        return self._client

    async def try_consume(
        self, key: str, limit: int, resets_at: datetime
    ) -> tuple[bool, int]:
        client = self._get_client()
        used = await client.incr(key)
        if used == 1:
            ttl = int((resets_at - datetime.now(timezone.utc)).total_seconds())
            if ttl > 0:
                await client.expire(key, ttl)
        if used > limit:
            await client.decr(key)
            return (False, limit)
        return (True, used)

    async def get_used(self, key: str) -> int:
        client = self._get_client()
        val = await client.get(key)
        return int(val) if val else 0


# ---------------------------------------------------------------------------
# Quota enforcer
# ---------------------------------------------------------------------------
class QuotaEnforcer:
    def __init__(self, backend: QuotaBackend):
        self.backend = backend

    async def check(self, user_id: int, tier: Tier) -> QuotaCheck:
        limit = QUOTA_LIMITS[tier]
        if limit == 0:
            return QuotaCheck(
                allowed=False,
                remaining=0,
                used=0,
                limit=0,
                period_resets_at=_period_end(tier),
            )
        key = self._build_key(user_id, tier)
        resets_at = _period_end(tier)
        allowed, used = await self.backend.try_consume(key, limit, resets_at)
        return QuotaCheck(
            allowed=allowed,
            remaining=max(0, limit - used),
            used=used,
            limit=limit,
            period_resets_at=resets_at,
        )

    async def get_status(self, user_id: int, tier: Tier) -> QuotaCheck:
        """Non-consuming check — just returns current state."""
        limit = QUOTA_LIMITS[tier]
        key = self._build_key(user_id, tier)
        used = await self.backend.get_used(key)
        return QuotaCheck(
            allowed=used < limit,
            remaining=max(0, limit - used),
            used=used,
            limit=limit,
            period_resets_at=_period_end(tier),
        )

    def _build_key(self, user_id: int, tier: Tier) -> str:
        period = _period_key(tier)
        return f"mira:quota:{user_id}:{period}"


def _period_key(tier: Tier) -> str:
    now = datetime.now(timezone.utc)
    if PERIOD_TYPE[tier] == "day":
        return now.strftime("%Y%m%d")
    return now.strftime("%Y%m")


def _period_end(tier: Tier) -> datetime:
    now = datetime.now(timezone.utc)
    if PERIOD_TYPE[tier] == "day":
        return (now + timedelta(days=1)).replace(
            hour=0, minute=0, second=0, microsecond=0
        )
    # Month
    last_day = calendar.monthrange(now.year, now.month)[1]
    return datetime(
        now.year, now.month, last_day, 23, 59, 59, tzinfo=timezone.utc
    )
