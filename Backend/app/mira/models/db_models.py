"""MIRA SQLAlchemy async ORM models.

All tables map 1:1 to the Alembic migration in
backend/alembic/versions/mira_001_initial.py.

Usage:
    from app.core.database import AsyncSessionLocal
    from app.mira.models.db_models import MiraUserProfile

    async with AsyncSessionLocal() as db:
        profile = await db.get(MiraUserProfile, user_id)

Imports assume your existing Base lives at app/core/database.py.
If your Base is elsewhere, change the import below.
"""
from __future__ import annotations

from datetime import datetime
from decimal import Decimal
from typing import Any

from sqlalchemy import (
    BigInteger,
    Boolean,
    Column,
    DateTime,
    ForeignKey,
    Integer,
    Numeric,
    String,
    Text,
    UniqueConstraint,
    Index,
    JSON,
    func,
)
from sqlalchemy.dialects.postgresql import ARRAY, JSONB
from sqlalchemy.orm import Mapped, mapped_column, relationship

# Assumes your existing Base lives here. Adjust import if different.
from app.core.database import Base


# Dialect-aware JSON: Postgres gets JSONType, SQLite gets plain JSON.
# This lets the same ORM classes work for tests (SQLite) AND production (PG).
JSONType = JSONB().with_variant(JSON(), "sqlite")

# ARRAY is Postgres-specific. On SQLite we substitute JSON-encoded list.
# The migration uses real ARRAY on Postgres.
ArrayText = ARRAY(Text).with_variant(JSON(), "sqlite")

# BigInteger autoincrement doesn't work reliably on SQLite — use Integer there.
BigIntPK = BigInteger().with_variant(Integer(), "sqlite")


# =========================================================================
# 1. User profile — cognitive state per user
# =========================================================================
class MiraUserProfile(Base):
    __tablename__ = "mira_user_profiles"

    user_id: Mapped[int] = mapped_column(
        Integer,
        ForeignKey("users.id", ondelete="CASCADE"),
        primary_key=True,
    )
    tier: Mapped[str] = mapped_column(String(20), nullable=False, default="free")
    tier_active_until: Mapped[datetime | None] = mapped_column(
        DateTime(timezone=True), nullable=True
    )
    quota_used_this_period: Mapped[int] = mapped_column(
        Integer, nullable=False, default=0
    )
    quota_period_resets_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), nullable=False
    )
    beliefs: Mapped[dict[str, Any]] = mapped_column(
        JSONType, nullable=False, default=dict
    )
    bandit_state: Mapped[dict[str, Any]] = mapped_column(
        JSONType, nullable=False, default=dict
    )
    personal_prompt: Mapped[dict[str, Any]] = mapped_column(
        JSONType, nullable=False, default=dict
    )
    frustration_signals: Mapped[int] = mapped_column(
        Integer, nullable=False, default=0
    )
    onboarding_completed: Mapped[bool] = mapped_column(
        Boolean, nullable=False, default=False
    )
    preferences: Mapped[dict[str, Any]] = mapped_column(
        JSONType, nullable=False, default=dict
    )
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        nullable=False,
        server_default=func.now(),
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        nullable=False,
        server_default=func.now(),
        onupdate=func.now(),
    )

    __table_args__ = (
        Index("idx_mira_profiles_tier", "tier"),
        Index("idx_mira_profiles_updated", "updated_at"),
    )

    def __repr__(self) -> str:
        return f"<MiraUserProfile user_id={self.user_id} tier={self.tier}>"


# =========================================================================
# 2. Concept lattices — per course/module
# =========================================================================
class MiraConceptLattice(Base):
    __tablename__ = "mira_concept_lattices"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    course_id: Mapped[str] = mapped_column(String(255), nullable=False)
    module_id: Mapped[str | None] = mapped_column(String(255), nullable=True)
    lattice: Mapped[dict[str, Any]] = mapped_column(JSONType, nullable=False)
    version: Mapped[int] = mapped_column(Integer, nullable=False, default=1)
    generated_by: Mapped[str] = mapped_column(String(50), nullable=False)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), nullable=False, server_default=func.now()
    )

    __table_args__ = (
        UniqueConstraint(
            "course_id", "module_id", "version", name="uq_mira_lattices_versioned"
        ),
        Index("idx_mira_lattices_course", "course_id"),
    )


# =========================================================================
# 3. Rubrics — per section/module/phase
# =========================================================================
class MiraRubric(Base):
    __tablename__ = "mira_rubrics"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    course_id: Mapped[str] = mapped_column(String(255), nullable=False)
    module_id: Mapped[str] = mapped_column(String(255), nullable=False)
    section_id: Mapped[str | None] = mapped_column(String(255), nullable=True)
    rubric_type: Mapped[str] = mapped_column(
        String(30), nullable=False
    )  # retrieval | synthesis | viva
    rubric_json: Mapped[dict[str, Any]] = mapped_column(JSONType, nullable=False)
    version: Mapped[int] = mapped_column(Integer, nullable=False, default=1)
    human_reviewed: Mapped[bool] = mapped_column(
        Boolean, nullable=False, default=False
    )
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), nullable=False, server_default=func.now()
    )

    grading_events: Mapped[list[MiraGradingEvent]] = relationship(
        back_populates="rubric"
    )

    __table_args__ = (
        UniqueConstraint(
            "course_id",
            "module_id",
            "section_id",
            "rubric_type",
            "version",
            name="uq_mira_rubrics_versioned",
        ),
        Index(
            "idx_mira_rubrics_lookup",
            "course_id",
            "module_id",
            "section_id",
        ),
    )


# =========================================================================
# 4. Grading events — append-only log of every grading attempt
# =========================================================================
class MiraGradingEvent(Base):
    __tablename__ = "mira_grading_events"

    id: Mapped[int] = mapped_column(BigIntPK, primary_key=True, autoincrement=True)
    user_id: Mapped[int] = mapped_column(
        Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False
    )
    rubric_id: Mapped[int] = mapped_column(
        Integer, ForeignKey("mira_rubrics.id"), nullable=False
    )
    attempt_num: Mapped[int] = mapped_column(Integer, nullable=False)
    answer_text: Mapped[str] = mapped_column(Text, nullable=False)
    scores: Mapped[dict[str, Any]] = mapped_column(JSONType, nullable=False)
    passed: Mapped[bool] = mapped_column(Boolean, nullable=False)
    feedback_text: Mapped[str | None] = mapped_column(Text, nullable=True)
    typing_metadata: Mapped[dict[str, Any] | None] = mapped_column(
        JSONType, nullable=True
    )
    tokens_in: Mapped[int] = mapped_column(Integer, nullable=False)
    tokens_out: Mapped[int] = mapped_column(Integer, nullable=False)
    model: Mapped[str] = mapped_column(String(50), nullable=False)
    cost_inr: Mapped[Decimal] = mapped_column(Numeric(10, 4), nullable=False)
    latency_ms: Mapped[int] = mapped_column(Integer, nullable=False)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), nullable=False, server_default=func.now()
    )

    rubric: Mapped[MiraRubric] = relationship(back_populates="grading_events")

    __table_args__ = (
        Index("idx_mira_grading_rubric", "rubric_id"),
    )


# =========================================================================
# 5. Gate status — current state per user/course/module/phase
# =========================================================================
class MiraGateStatus(Base):
    __tablename__ = "mira_gate_status"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    user_id: Mapped[int] = mapped_column(
        Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False
    )
    course_id: Mapped[str] = mapped_column(String(255), nullable=False)
    module_id: Mapped[str] = mapped_column(String(255), nullable=False)
    phase_id: Mapped[str | None] = mapped_column(String(255), nullable=True)
    status: Mapped[str] = mapped_column(String(20), nullable=False)
    # locked | in_progress | passed | provisional | appealed
    passed_at: Mapped[datetime | None] = mapped_column(
        DateTime(timezone=True), nullable=True
    )
    last_attempt_at: Mapped[datetime | None] = mapped_column(
        DateTime(timezone=True), nullable=True
    )
    attempt_count: Mapped[int] = mapped_column(Integer, nullable=False, default=0)

    __table_args__ = (
        UniqueConstraint(
            "user_id",
            "course_id",
            "module_id",
            "phase_id",
            name="uq_mira_gate_status_scope",
        ),
        Index("idx_mira_gate_user", "user_id"),
    )


# =========================================================================
# 6. Episodic memory — append-only interaction log
# =========================================================================
class MiraEpisodic(Base):
    __tablename__ = "mira_episodic"

    id: Mapped[int] = mapped_column(BigIntPK, primary_key=True, autoincrement=True)
    user_id: Mapped[int] = mapped_column(
        Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False
    )
    course_id: Mapped[str | None] = mapped_column(String(255), nullable=True)
    module_id: Mapped[str | None] = mapped_column(String(255), nullable=True)
    section_id: Mapped[str | None] = mapped_column(String(255), nullable=True)
    interaction_type: Mapped[str] = mapped_column(String(30), nullable=False)
    payload: Mapped[dict[str, Any]] = mapped_column(JSONType, nullable=False)
    concept_ids: Mapped[list[str] | None] = mapped_column(
        ArrayText, nullable=True
    )
    depth: Mapped[str | None] = mapped_column(String(20), nullable=True)
    style_used: Mapped[str | None] = mapped_column(String(20), nullable=True)
    model: Mapped[str | None] = mapped_column(String(50), nullable=True)
    tokens_in: Mapped[int | None] = mapped_column(Integer, nullable=True)
    tokens_out: Mapped[int | None] = mapped_column(Integer, nullable=True)
    cost_inr: Mapped[Decimal | None] = mapped_column(
        Numeric(10, 4), nullable=True
    )
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), nullable=False, server_default=func.now()
    )

    __table_args__ = (
        Index(
            "idx_mira_episodic_concepts", "concept_ids", postgresql_using="gin"
        ),
    )


# =========================================================================
# 7. Semantic memory — per-user long-term facts
# =========================================================================
class MiraSemanticMemory(Base):
    __tablename__ = "mira_semantic_memory"

    user_id: Mapped[int] = mapped_column(
        Integer,
        ForeignKey("users.id", ondelete="CASCADE"),
        primary_key=True,
    )
    career_stage: Mapped[str | None] = mapped_column(String(50), nullable=True)
    background: Mapped[str | None] = mapped_column(Text, nullable=True)
    goals: Mapped[str | None] = mapped_column(Text, nullable=True)
    projects_in_progress: Mapped[list[Any]] = mapped_column(
        JSONType, default=list
    )
    preferred_styles: Mapped[list[Any]] = mapped_column(JSONType, default=list)
    total_concepts_mastered: Mapped[int] = mapped_column(Integer, default=0)
    total_concepts_touched: Mapped[int] = mapped_column(Integer, default=0)
    common_misconceptions: Mapped[list[Any]] = mapped_column(
        JSONType, default=list
    )
    last_aggregated_at: Mapped[datetime | None] = mapped_column(
        DateTime(timezone=True), nullable=True
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        nullable=False,
        server_default=func.now(),
        onupdate=func.now(),
    )


# =========================================================================
# 8. Review queue — spaced repetition schedule
# =========================================================================
class MiraReviewQueue(Base):
    __tablename__ = "mira_review_queue"

    id: Mapped[int] = mapped_column(BigIntPK, primary_key=True, autoincrement=True)
    user_id: Mapped[int] = mapped_column(
        Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False
    )
    concept_id: Mapped[str] = mapped_column(String(255), nullable=False)
    course_id: Mapped[str] = mapped_column(String(255), nullable=False)
    next_review_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), nullable=False
    )
    interval_days: Mapped[int] = mapped_column(Integer, nullable=False, default=1)
    ease_factor: Mapped[Decimal] = mapped_column(
        Numeric(3, 2), nullable=False, default=Decimal("2.5")
    )
    last_result: Mapped[str | None] = mapped_column(String(20), nullable=True)
    consecutive_passes: Mapped[int] = mapped_column(
        Integer, nullable=False, default=0
    )
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), nullable=False, server_default=func.now()
    )

    __table_args__ = (
        UniqueConstraint(
            "user_id", "concept_id", name="uq_mira_review_user_concept"
        ),
        Index("idx_mira_review_due", "user_id", "next_review_at"),
    )


# =========================================================================
# 9. Appeal queue — human review for provisional passes
# =========================================================================
class MiraAppealQueue(Base):
    __tablename__ = "mira_appeal_queue"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    user_id: Mapped[int] = mapped_column(
        Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False
    )
    grading_event_id: Mapped[int] = mapped_column(
        BigInteger, ForeignKey("mira_grading_events.id"), nullable=False
    )
    student_justification: Mapped[str] = mapped_column(Text, nullable=False)
    status: Mapped[str] = mapped_column(
        String(20), nullable=False, default="pending"
    )
    reviewer_id: Mapped[int | None] = mapped_column(
        Integer, ForeignKey("users.id"), nullable=True
    )
    reviewer_notes: Mapped[str | None] = mapped_column(Text, nullable=True)
    reviewed_at: Mapped[datetime | None] = mapped_column(
        DateTime(timezone=True), nullable=True
    )
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), nullable=False, server_default=func.now()
    )


# =========================================================================
# Export list for clean imports elsewhere
# =========================================================================
__all__ = [
    "MiraUserProfile",
    "MiraConceptLattice",
    "MiraRubric",
    "MiraGradingEvent",
    "MiraGateStatus",
    "MiraEpisodic",
    "MiraSemanticMemory",
    "MiraReviewQueue",
    "MiraAppealQueue",
]
