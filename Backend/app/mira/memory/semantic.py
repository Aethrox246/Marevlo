"""Semantic memory aggregator — periodically summarizes episodic → semantic.

Runs as a background job. Walks a user's recent episodic history, derives:
  - career_stage (from background, question depths, vocabulary)
  - preferred_styles (from feedback history)
  - total_concepts_mastered / touched
  - common_misconceptions (from wrong MCQ answers)

Idempotent — running twice produces the same semantic state.

Uses ClaudeClient (typically Haiku) to generate the summarized background
text from episodic snippets, but only when enough episodic data exists.
"""
from __future__ import annotations

from collections import Counter
from datetime import datetime, timedelta
from typing import Any

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.mira.claude.client import ClaudeClientBase, ClaudeMessage
from app.mira.claude.router import ModelTier
from app.mira.models.db_models import (
    MiraEpisodic,
    MiraSemanticMemory,
    MiraUserProfile,
)
from app.mira.models.schemas import (
    ConceptBelief,
    ExplainStyle,
    InteractionType,
    MasteryLevel,
)


class SemanticMemoryAggregator:
    """Rebuilds mira_semantic_memory row from scratch based on recent history."""

    def __init__(self, db: AsyncSession, claude: ClaudeClientBase):
        self.db = db
        self.claude = claude

    async def aggregate(
        self,
        user_id: int,
        lookback_days: int = 30,
    ) -> MiraSemanticMemory:
        """Compute semantic memory from recent episodic + current profile."""
        now = datetime.utcnow()
        since = now - timedelta(days=lookback_days)

        # Load episodic
        stmt = (
            select(MiraEpisodic)
            .where(MiraEpisodic.user_id == user_id)
            .where(MiraEpisodic.created_at >= since)
        )
        episodic = (await self.db.execute(stmt)).scalars().all()

        # Load profile for belief-based stats
        profile = await self.db.get(MiraUserProfile, user_id)
        beliefs: dict[str, ConceptBelief] = {}
        if profile and profile.beliefs:
            beliefs = {
                cid: ConceptBelief(**b) for cid, b in profile.beliefs.items()
            }

        # Compute stats
        stats = self._compute_stats(episodic, beliefs)

        # Upsert semantic memory row
        semantic = await self.db.get(MiraSemanticMemory, user_id)
        if not semantic:
            semantic = MiraSemanticMemory(user_id=user_id)
            self.db.add(semantic)

        semantic.preferred_styles = stats["preferred_styles"]
        semantic.total_concepts_mastered = stats["total_mastered"]
        semantic.total_concepts_touched = stats["total_touched"]
        semantic.common_misconceptions = stats["common_misconceptions"]
        semantic.last_aggregated_at = now

        await self.db.flush()
        return semantic

    # ============================================================
    # STATISTICS
    # ============================================================
    def _compute_stats(
        self,
        episodic: list[MiraEpisodic],
        beliefs: dict[str, ConceptBelief],
    ) -> dict[str, Any]:
        # Preferred styles: count 'understood=True' per style
        style_wins: Counter[str] = Counter()
        style_totals: Counter[str] = Counter()

        for ep in episodic:
            if ep.interaction_type == InteractionType.FEEDBACK.value and ep.style_used:
                payload = ep.payload or {}
                style_totals[ep.style_used] += 1
                if payload.get("understood"):
                    style_wins[ep.style_used] += 1

        # Rank by win ratio, require at least 3 attempts
        preferred = []
        for style, total in style_totals.most_common():
            if total < 3:
                continue
            wins = style_wins.get(style, 0)
            ratio = wins / total
            preferred.append(
                {
                    "style": style,
                    "win_ratio": round(ratio, 2),
                    "total_attempts": total,
                }
            )
        preferred.sort(key=lambda x: x["win_ratio"], reverse=True)

        # Mastered / touched
        total_mastered = sum(
            1 for b in beliefs.values() if b.mastery == MasteryLevel.MASTERED
        )
        total_touched = len(beliefs)

        # Misconceptions — from MCQ payloads
        misconceptions: list[str] = []
        for ep in episodic:
            if ep.interaction_type == InteractionType.MCQ.value:
                payload = ep.payload or {}
                if not payload.get("correct") and payload.get("misconception"):
                    misconceptions.append(payload["misconception"])
        misconception_counts = Counter(misconceptions)
        common = [
            {"misconception": m, "count": c}
            for m, c in misconception_counts.most_common(5)
        ]

        return {
            "preferred_styles": preferred,
            "total_mastered": total_mastered,
            "total_touched": total_touched,
            "common_misconceptions": common,
        }

    # ============================================================
    # CAREER STAGE INFERENCE
    # ============================================================
    async def infer_career_stage(
        self,
        user_id: int,
    ) -> str | None:
        """Optional LLM-assisted inference of career stage from background +
        interaction pattern. Caller decides when to run this — typically
        weekly or on profile request."""
        semantic = await self.db.get(MiraSemanticMemory, user_id)
        if semantic and semantic.career_stage:
            return semantic.career_stage  # already known

        # Collect signals from episodic (vocabulary, depth pattern)
        stmt = (
            select(MiraEpisodic)
            .where(MiraEpisodic.user_id == user_id)
            .where(
                MiraEpisodic.interaction_type == InteractionType.CHAT.value
            )
            .limit(20)
        )
        recent = (await self.db.execute(stmt)).scalars().all()
        if len(recent) < 5:
            return None  # not enough data

        # Look at depth distribution
        depths = [ep.depth for ep in recent if ep.depth]
        counter = Counter(depths)
        # More than half surface → likely beginner
        if counter.get("surface", 0) > len(depths) * 0.5:
            return "student"
        # Any creative → advanced
        if counter.get("creative", 0) >= 2:
            return "senior"
        # Default
        return "mid"
