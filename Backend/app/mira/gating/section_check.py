"""Section retrieval check — soft gate using Haiku.

After a section, user answers 3 quick prompts to verify retention:
  1. Core idea of the section (paraphrase in own words)
  2. A novel application (not one explicitly in the material)
  3. Distinguish from an easily-confused neighbor concept

Soft gate: fail doesn't block progression, but logs + nudges review.
Uses Haiku for cost (runs once per student per section = thousands of calls).
"""
from __future__ import annotations

import json
from dataclasses import dataclass
from decimal import Decimal

from sqlalchemy.ext.asyncio import AsyncSession

from app.mira.claude.client import ClaudeClientBase, ClaudeMessage
from app.mira.claude.cost_tracker import CostTracker, TokenUsage
from app.mira.claude.router import ModelRouter, ModelTier
from app.mira.models.db_models import MiraGradingEvent
from app.mira.models.schemas import Rubric


SECTION_CHECK_SYSTEM_PROMPT = """You are MIRA's section-level retrieval grader.
Grade a student's three quick responses against the rubric.

Return STRICT JSON with this shape:
{
  "per_criterion": {
    "core_idea":          {"score": 0-100, "feedback": "..."},
    "novel_application":  {"score": 0-100, "feedback": "..."},
    "contrast":           {"score": 0-100, "feedback": "..."}
  },
  "overall_feedback": "1-2 sentence synthesis",
  "overall_score": 0-100,
  "passed": true|false
}

Pass threshold: overall_score >= 60. Be fair but not generous — they should
show real understanding, not just repeat textbook definitions."""


@dataclass
class SectionGradeResult:
    passed: bool
    per_criterion: dict
    overall_feedback: str
    overall_score: int
    attempt_num: int
    cost_inr: Decimal
    tokens_in: int
    tokens_out: int
    latency_ms: int


class SectionGrader:
    def __init__(
        self,
        db: AsyncSession,
        claude: ClaudeClientBase,
    ):
        self.db = db
        self.claude = claude

    async def grade(
        self,
        *,
        user_id: int,
        rubric_id: int,
        rubric: Rubric,
        core_idea_answer: str,
        novel_application_answer: str,
        contrast_answer: str,
        attempt_num: int = 1,
    ) -> SectionGradeResult:
        user_content = (
            f"# RUBRIC\n{rubric.model_dump_json(indent=2)}\n\n"
            f"# STUDENT ANSWERS\n"
            f"## Core idea\n{core_idea_answer}\n\n"
            f"## Novel application\n{novel_application_answer}\n\n"
            f"## Contrast with easily-confused neighbor\n{contrast_answer}\n"
        )

        parsed, response = await self.claude.complete_structured(
            system=SECTION_CHECK_SYSTEM_PROMPT,
            messages=[ClaudeMessage(role="user", content=user_content)],
            model_tier=ModelTier.HAIKU,
            schema_hint='{"per_criterion": {...}, "overall_score": int, "passed": bool, "overall_feedback": str}',
        )

        # Compute cost
        cost = CostTracker.compute(
            TokenUsage(
                fresh_input_tokens=response.fresh_input_tokens,
                cached_input_tokens=response.cached_input_tokens,
                output_tokens=response.output_tokens,
                model_tier=ModelTier.HAIKU,
            )
        )

        # Persist
        event = MiraGradingEvent(
            user_id=user_id,
            rubric_id=rubric_id,
            attempt_num=attempt_num,
            answer_text=(
                f"core: {core_idea_answer}\n---\n"
                f"novel: {novel_application_answer}\n---\n"
                f"contrast: {contrast_answer}"
            )[:5000],
            scores=parsed.get("per_criterion", {}),
            passed=bool(parsed.get("passed", False)),
            feedback_text=parsed.get("overall_feedback", ""),
            tokens_in=response.fresh_input_tokens + response.cached_input_tokens,
            tokens_out=response.output_tokens,
            model=response.model,
            cost_inr=cost.total_inr,
            latency_ms=response.latency_ms,
        )
        self.db.add(event)
        await self.db.flush()

        return SectionGradeResult(
            passed=bool(parsed.get("passed", False)),
            per_criterion=parsed.get("per_criterion", {}),
            overall_feedback=parsed.get("overall_feedback", ""),
            overall_score=int(parsed.get("overall_score", 0)),
            attempt_num=attempt_num,
            cost_inr=cost.total_inr,
            tokens_in=response.fresh_input_tokens + response.cached_input_tokens,
            tokens_out=response.output_tokens,
            latency_ms=response.latency_ms,
        )
