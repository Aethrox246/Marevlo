"""Module synthesis gate — hard gate using Sonnet.

At end of each module, student writes a 200-300 word synthesis.
Claude Sonnet grades against a structured rubric. Pass unlocks next module;
fail costs an attempt.

3-attempt retry + appeal path:
  - attempt 1 fail → show feedback, retry
  - attempt 2 fail → show feedback, retry
  - attempt 3 fail → provisional pass, can appeal to human
"""
from __future__ import annotations

from dataclasses import dataclass
from datetime import datetime
from decimal import Decimal

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.mira.claude.client import ClaudeClientBase, ClaudeMessage
from app.mira.claude.cost_tracker import CostTracker, TokenUsage
from app.mira.claude.router import ModelTier
from app.mira.gating.typing_cadence import TypingCadenceAnalyzer, CadenceAnalysis
from app.mira.models.db_models import (
    MiraGateStatus,
    MiraGradingEvent,
)
from app.mira.models.schemas import GateStatus, Rubric


SYNTHESIS_SYSTEM_PROMPT = """You are MIRA's module synthesis grader.
Grade a student's 200-300 word synthesis of a module against the provided rubric.

Grading principles:
- Be fair but demanding. A synthesis should connect the module's concepts,
  not just recite definitions.
- Per-criterion scores from 0-100. Required criteria must each score >= 60.
- Overall pass requires min_total_score (usually 70) AND all required criteria.
- Flag shortcuts: vague generalities, copy-pasted textbook definitions,
  claims without reasoning.

Return STRICT JSON:
{
  "per_criterion": {
    "<criterion_id>": {"score": 0-100, "feedback": "..."},
    ...
  },
  "overall_score": 0-100,
  "passed": true|false,
  "overall_feedback": "2-3 sentences: what was strong, what's missing, what to revise",
  "concerns": ["any detected shortcut or weakness", ...]
}"""


@dataclass
class SynthesisGradeResult:
    passed: bool
    per_criterion: dict
    overall_feedback: str
    overall_score: int
    concerns: list[str]
    attempt_num: int
    remaining_attempts: int
    is_provisional: bool
    can_appeal: bool
    can_proceed: bool
    typing_cadence: CadenceAnalysis | None
    cost_inr: Decimal
    grading_event_id: int


class SynthesisGrader:
    MAX_ATTEMPTS = 3

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
        course_id: str,
        module_id: str,
        rubric_id: int,
        rubric: Rubric,
        synthesis_text: str,
        typing_intervals_ms: list[int] | None = None,
    ) -> SynthesisGradeResult:
        # Determine attempt number by counting prior events
        attempt_count = await self._count_attempts(user_id, rubric_id)
        attempt_num = attempt_count + 1

        # Typing cadence analysis
        cadence = None
        if typing_intervals_ms:
            cadence = TypingCadenceAnalyzer.analyze(
                char_count=len(synthesis_text),
                intervals_ms=typing_intervals_ms,
            )

        # LLM grade
        user_content = (
            f"# RUBRIC\n{rubric.model_dump_json(indent=2)}\n\n"
            f"# STUDENT SYNTHESIS\n{synthesis_text}\n"
        )
        parsed, response = await self.claude.complete_structured(
            system=SYNTHESIS_SYSTEM_PROMPT,
            messages=[ClaudeMessage(role="user", content=user_content)],
            model_tier=ModelTier.SONNET,
            schema_hint='{"per_criterion": {...}, "overall_score": int, "passed": bool, "overall_feedback": str, "concerns": []}',
        )

        cost = CostTracker.compute(
            TokenUsage(
                fresh_input_tokens=response.fresh_input_tokens,
                cached_input_tokens=response.cached_input_tokens,
                output_tokens=response.output_tokens,
                model_tier=ModelTier.SONNET,
            )
        )

        passed = bool(parsed.get("passed", False))
        is_final_attempt = attempt_num >= self.MAX_ATTEMPTS
        is_provisional = (not passed) and is_final_attempt
        can_appeal = is_provisional
        can_proceed = passed or is_provisional  # provisional unlocks, pending appeal

        # Persist grading event
        typing_meta = None
        if cadence:
            typing_meta = {
                "char_count": cadence.char_count,
                "wpm_equivalent": cadence.wpm_equivalent,
                "interval_stdev_ms": cadence.interval_stdev_ms,
                "suspicious_reasons": cadence.suspicious_reasons,
            }
        event = MiraGradingEvent(
            user_id=user_id,
            rubric_id=rubric_id,
            attempt_num=attempt_num,
            answer_text=synthesis_text[:5000],
            scores=parsed.get("per_criterion", {}),
            passed=passed,
            feedback_text=parsed.get("overall_feedback", ""),
            typing_metadata=typing_meta,
            tokens_in=response.fresh_input_tokens + response.cached_input_tokens,
            tokens_out=response.output_tokens,
            model=response.model,
            cost_inr=cost.total_inr,
            latency_ms=response.latency_ms,
        )
        self.db.add(event)
        await self.db.flush()

        # Update mira_gate_status
        await self._update_gate_status(
            user_id=user_id,
            course_id=course_id,
            module_id=module_id,
            passed=passed,
            is_provisional=is_provisional,
            attempt_num=attempt_num,
        )

        return SynthesisGradeResult(
            passed=passed,
            per_criterion=parsed.get("per_criterion", {}),
            overall_feedback=parsed.get("overall_feedback", ""),
            overall_score=int(parsed.get("overall_score", 0)),
            concerns=parsed.get("concerns", []),
            attempt_num=attempt_num,
            remaining_attempts=max(0, self.MAX_ATTEMPTS - attempt_num),
            is_provisional=is_provisional,
            can_appeal=can_appeal,
            can_proceed=can_proceed,
            typing_cadence=cadence,
            cost_inr=cost.total_inr,
            grading_event_id=event.id,
        )

    async def _count_attempts(self, user_id: int, rubric_id: int) -> int:
        from sqlalchemy import func
        stmt = select(func.count(MiraGradingEvent.id)).where(
            MiraGradingEvent.user_id == user_id,
            MiraGradingEvent.rubric_id == rubric_id,
        )
        return (await self.db.execute(stmt)).scalar() or 0

    async def _update_gate_status(
        self,
        *,
        user_id: int,
        course_id: str,
        module_id: str,
        passed: bool,
        is_provisional: bool,
        attempt_num: int,
    ):
        # Find or create gate status row
        stmt = (
            select(MiraGateStatus)
            .where(MiraGateStatus.user_id == user_id)
            .where(MiraGateStatus.course_id == course_id)
            .where(MiraGateStatus.module_id == module_id)
            .where(MiraGateStatus.phase_id.is_(None))
            .limit(1)
        )
        row = (await self.db.execute(stmt)).scalar_one_or_none()
        if not row:
            row = MiraGateStatus(
                user_id=user_id,
                course_id=course_id,
                module_id=module_id,
                phase_id=None,
                status=GateStatus.IN_PROGRESS.value,
                attempt_count=0,
            )
            self.db.add(row)

        row.attempt_count = attempt_num
        row.last_attempt_at = datetime.utcnow()
        if passed:
            row.status = GateStatus.PASSED.value
            row.passed_at = datetime.utcnow()
        elif is_provisional:
            row.status = GateStatus.PROVISIONAL.value
        else:
            row.status = GateStatus.IN_PROGRESS.value

        await self.db.flush()
