"""Spaced repetition scheduler — SM-2 algorithm.

When a user masters a concept, we schedule a review in 1 day. If they
pass, interval grows to 3, 7, 21, 60 days. If they fail, interval resets.

Classic SM-2 with adjustments for learning (not pure memorization):
  - Initial interval: 1 day (SM-2 would be 1)
  - Successive: prev * ease_factor (capped at 60)
  - On fail: reset to 1, ease -= 0.2 (min 1.3)
  - On skip/dismiss: +2 days, no ease change

Database-dependent. Works against mira_review_queue table.
"""
from __future__ import annotations

from dataclasses import dataclass
from datetime import datetime, timedelta
from decimal import Decimal

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.mira.models.db_models import MiraReviewQueue


MIN_EASE = Decimal("1.3")
MAX_EASE = Decimal("3.0")
DEFAULT_EASE = Decimal("2.5")
MAX_INTERVAL_DAYS = 60
INITIAL_INTERVAL_DAYS = 1
FIRST_REVIEW_AFTER_DAYS = 3


@dataclass
class SM2Result:
    new_interval_days: int
    new_ease_factor: Decimal
    next_review_at: datetime
    consecutive_passes: int


class SpacedRepetitionScheduler:
    """SM-2 with MIRA adjustments."""

    def __init__(self, db: AsyncSession):
        self.db = db

    # ============================================================
    # SCHEDULING
    # ============================================================
    async def schedule_new(
        self,
        *,
        user_id: int,
        concept_id: str,
        course_id: str,
        now: datetime | None = None,
    ) -> MiraReviewQueue:
        """Called when a concept first crosses into MASTERED.

        If already scheduled, idempotent — returns existing row.
        """
        now = now or datetime.utcnow()

        existing = await self._find(user_id, concept_id)
        if existing:
            return existing

        row = MiraReviewQueue(
            user_id=user_id,
            concept_id=concept_id,
            course_id=course_id,
            next_review_at=now + timedelta(days=INITIAL_INTERVAL_DAYS),
            interval_days=INITIAL_INTERVAL_DAYS,
            ease_factor=DEFAULT_EASE,
            consecutive_passes=0,
        )
        self.db.add(row)
        await self.db.flush()
        return row

    async def record_result(
        self,
        *,
        user_id: int,
        concept_id: str,
        passed: bool,
        now: datetime | None = None,
    ) -> SM2Result:
        """Apply SM-2 after a review answer. Updates the row in place."""
        now = now or datetime.utcnow()
        row = await self._find(user_id, concept_id)
        if not row:
            raise ValueError(
                f"No review row for user={user_id} concept={concept_id}"
            )

        if passed:
            new_interval = max(
                FIRST_REVIEW_AFTER_DAYS,
                int(row.interval_days * float(row.ease_factor)),
            )
            new_interval = min(new_interval, MAX_INTERVAL_DAYS)
            # Ease stays the same on pass
            new_ease = row.ease_factor
            new_consecutive = row.consecutive_passes + 1
            row.last_result = "pass"
        else:
            new_interval = INITIAL_INTERVAL_DAYS
            new_ease = max(MIN_EASE, row.ease_factor - Decimal("0.2"))
            new_consecutive = 0
            row.last_result = "fail"

        row.interval_days = new_interval
        row.ease_factor = new_ease
        row.consecutive_passes = new_consecutive
        row.next_review_at = now + timedelta(days=new_interval)

        await self.db.flush()

        return SM2Result(
            new_interval_days=new_interval,
            new_ease_factor=new_ease,
            next_review_at=row.next_review_at,
            consecutive_passes=new_consecutive,
        )

    async def record_skip(
        self,
        *,
        user_id: int,
        concept_id: str,
        now: datetime | None = None,
    ) -> SM2Result:
        """User dismissed the review. Push +2 days, don't penalize ease."""
        now = now or datetime.utcnow()
        row = await self._find(user_id, concept_id)
        if not row:
            raise ValueError("No review row")
        new_next = now + timedelta(days=2)
        row.next_review_at = new_next
        row.last_result = "skip"
        await self.db.flush()
        return SM2Result(
            new_interval_days=row.interval_days,
            new_ease_factor=row.ease_factor,
            next_review_at=new_next,
            consecutive_passes=row.consecutive_passes,
        )

    # ============================================================
    # QUERIES
    # ============================================================
    async def due_for_user(
        self,
        user_id: int,
        now: datetime | None = None,
        limit: int = 10,
    ) -> list[MiraReviewQueue]:
        now = now or datetime.utcnow()
        stmt = (
            select(MiraReviewQueue)
            .where(MiraReviewQueue.user_id == user_id)
            .where(MiraReviewQueue.next_review_at <= now)
            .order_by(MiraReviewQueue.next_review_at)
            .limit(limit)
        )
        result = await self.db.execute(stmt)
        return list(result.scalars().all())

    async def _find(
        self, user_id: int, concept_id: str
    ) -> MiraReviewQueue | None:
        stmt = (
            select(MiraReviewQueue)
            .where(MiraReviewQueue.user_id == user_id)
            .where(MiraReviewQueue.concept_id == concept_id)
            .limit(1)
        )
        result = await self.db.execute(stmt)
        return result.scalar_one_or_none()
