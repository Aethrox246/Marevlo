"""Episodic memory — append-only interaction log.

Every chat turn, feedback click, MCQ answer, grading attempt writes one row
to mira_episodic. Hot-path reads:
  - "recent interactions for this user" (dashboard)
  - "interactions about this concept in last N days" (summarization)

Database-dependent. Tests use a real SQLAlchemy session against SQLite
(fast, no Postgres container needed — we use only features SQLite supports).
"""
from __future__ import annotations

from datetime import datetime, timedelta
from decimal import Decimal
from typing import Any

from sqlalchemy import desc, select, func
from sqlalchemy.ext.asyncio import AsyncSession

from app.mira.models.db_models import MiraEpisodic
from app.mira.models.schemas import (
    ExplainStyle,
    InteractionType,
    QuestionDepth,
)


class EpisodicLogger:
    """Writes + reads for mira_episodic."""

    def __init__(self, db: AsyncSession):
        self.db = db

    async def log_chat(
        self,
        *,
        user_id: int,
        course_id: str | None,
        module_id: str | None,
        section_id: str | None,
        question: str,
        answer: str,
        depth: QuestionDepth,
        style_used: ExplainStyle,
        concept_ids: list[str],
        model: str,
        tokens_in: int,
        tokens_out: int,
        cost_inr: Decimal,
    ) -> int:
        """Log one chat turn. Returns the row id."""
        row = MiraEpisodic(
            user_id=user_id,
            course_id=course_id,
            module_id=module_id,
            section_id=section_id,
            interaction_type=InteractionType.CHAT.value,
            payload={
                "question": question,
                "answer": answer[:2000],  # truncate very long responses
                "answer_length": len(answer),
            },
            concept_ids=concept_ids or None,
            depth=depth.value,
            style_used=style_used.value,
            model=model,
            tokens_in=tokens_in,
            tokens_out=tokens_out,
            cost_inr=cost_inr,
        )
        self.db.add(row)
        await self.db.flush()
        return row.id

    async def log_feedback(
        self,
        *,
        user_id: int,
        concept_id: str,
        style_used: ExplainStyle,
        understood: bool,
    ) -> int:
        row = MiraEpisodic(
            user_id=user_id,
            interaction_type=InteractionType.FEEDBACK.value,
            payload={
                "concept_id": concept_id,
                "understood": understood,
            },
            concept_ids=[concept_id],
            style_used=style_used.value,
        )
        self.db.add(row)
        await self.db.flush()
        return row.id

    async def log_mcq(
        self,
        *,
        user_id: int,
        concept_id: str,
        mcq_id: str,
        correct: bool,
        misconception: str | None,
    ) -> int:
        row = MiraEpisodic(
            user_id=user_id,
            interaction_type=InteractionType.MCQ.value,
            payload={
                "mcq_id": mcq_id,
                "concept_id": concept_id,
                "correct": correct,
                "misconception": misconception,
            },
            concept_ids=[concept_id],
        )
        self.db.add(row)
        await self.db.flush()
        return row.id

    async def log_review(
        self,
        *,
        user_id: int,
        concept_id: str,
        correct: bool,
        interval_days: int,
    ) -> int:
        row = MiraEpisodic(
            user_id=user_id,
            interaction_type=InteractionType.REVIEW.value,
            payload={
                "concept_id": concept_id,
                "correct": correct,
                "interval_days": interval_days,
            },
            concept_ids=[concept_id],
        )
        self.db.add(row)
        await self.db.flush()
        return row.id

    async def log_grade(
        self,
        *,
        user_id: int,
        rubric_id: int,
        attempt_num: int,
        passed: bool,
        score: int,
    ) -> int:
        row = MiraEpisodic(
            user_id=user_id,
            interaction_type=InteractionType.GRADE.value,
            payload={
                "rubric_id": rubric_id,
                "attempt_num": attempt_num,
                "passed": passed,
                "score": score,
            },
        )
        self.db.add(row)
        await self.db.flush()
        return row.id

    # ============================================================
    # READS
    # ============================================================
    async def recent_for_user(
        self,
        user_id: int,
        limit: int = 20,
        interaction_types: list[InteractionType] | None = None,
    ) -> list[MiraEpisodic]:
        """Get the most recent interactions for a user."""
        stmt = (
            select(MiraEpisodic)
            .where(MiraEpisodic.user_id == user_id)
            .order_by(desc(MiraEpisodic.created_at))
            .limit(limit)
        )
        if interaction_types:
            type_values = [t.value for t in interaction_types]
            stmt = stmt.where(MiraEpisodic.interaction_type.in_(type_values))
        result = await self.db.execute(stmt)
        return list(result.scalars().all())

    async def interactions_for_concept(
        self,
        user_id: int,
        concept_id: str,
        since: datetime | None = None,
    ) -> list[MiraEpisodic]:
        """Get all interactions touching a specific concept for a user."""
        stmt = select(MiraEpisodic).where(
            MiraEpisodic.user_id == user_id,
            MiraEpisodic.concept_ids.contains([concept_id]),
        )
        if since:
            stmt = stmt.where(MiraEpisodic.created_at >= since)
        stmt = stmt.order_by(desc(MiraEpisodic.created_at))
        result = await self.db.execute(stmt)
        return list(result.scalars().all())

    async def total_cost_for_user(
        self,
        user_id: int,
        since: datetime | None = None,
    ) -> Decimal:
        """Sum of cost_inr for a user over a period."""
        stmt = select(func.coalesce(func.sum(MiraEpisodic.cost_inr), 0)).where(
            MiraEpisodic.user_id == user_id
        )
        if since:
            stmt = stmt.where(MiraEpisodic.created_at >= since)
        result = await self.db.execute(stmt)
        value = result.scalar()
        return Decimal(str(value)) if value else Decimal("0")

    async def question_count_this_period(
        self,
        user_id: int,
        period_start: datetime,
    ) -> int:
        """How many chat interactions has this user had since period_start?"""
        stmt = select(func.count(MiraEpisodic.id)).where(
            MiraEpisodic.user_id == user_id,
            MiraEpisodic.interaction_type == InteractionType.CHAT.value,
            MiraEpisodic.created_at >= period_start,
        )
        result = await self.db.execute(stmt)
        return result.scalar() or 0
