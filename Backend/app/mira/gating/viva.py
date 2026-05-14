"""Phase adversarial viva — multi-turn, Sonnet-driven probe.

At end of a phase (e.g. end of Machine Learning phase 1), student sits a
5-6 question viva. Claude Sonnet asks an opener, reads the answer, adapts
the next question based on what was said (probing weak spots, contradicting
confidently-stated claims).

Session state stored in Redis via a session_id. At end, Sonnet judges
overall pass/fail and emits a final rubric-scored result.
"""
from __future__ import annotations

import json
import uuid
from dataclasses import dataclass
from datetime import datetime
from decimal import Decimal
from typing import Any

from app.mira.claude.client import ClaudeClientBase, ClaudeMessage
from app.mira.claude.cost_tracker import CostTracker, TokenUsage
from app.mira.claude.router import ModelTier


VIVA_OPENER_PROMPT = """You are MIRA, running an adversarial viva for a student
completing phase: {phase_name}.

Ask ONE opening question that requires explaining a core concept in their
own words. Be conversational but rigorous.

Return plain text only — just the question, no preamble."""

VIVA_FOLLOWUP_PROMPT = """You are MIRA, running the viva. Here's the conversation so far:

{conversation}

Based on the student's most recent answer, ask ONE follow-up question that
probes deeper. Use these strategies:
- If they made a specific claim, ask them to justify it with an example or edge case
- If they waved their hands, ask a direct specific question
- If they contradicted themselves implicitly, surface that contradiction
- If they've been consistent and strong, ask a creative/synthesis question

Track question count: this is question {question_num} of {total_expected}.
Last question was about: {last_topic}.

Return plain text only — just the question."""

VIVA_JUDGE_PROMPT = """You are MIRA, judging an overall viva session.

Here's the full conversation:
{conversation}

Grade on these dimensions (0-100 each):
- conceptual_understanding: did they demonstrate real understanding beyond recitation?
- consistency: were their claims self-consistent? caught in contradictions?
- depth_under_probe: when pressed, did they deepen or flail?
- communication: clear, precise, well-structured?

Return STRICT JSON:
{{
  "per_criterion": {{
    "conceptual_understanding": {{"score": 0-100, "notes": "..."}},
    "consistency": {{"score": 0-100, "notes": "..."}},
    "depth_under_probe": {{"score": 0-100, "notes": "..."}},
    "communication": {{"score": 0-100, "notes": "..."}}
  }},
  "overall_score": 0-100,
  "passed": true|false,
  "overall_feedback": "2-3 sentence summary"
}}

Pass threshold: 70 overall and no single dimension below 50."""


@dataclass
class VivaSession:
    session_id: str
    user_id: int
    course_id: str
    module_id: str
    phase_id: str
    phase_name: str
    total_questions: int
    turns: list[dict]                  # list of {"q": str, "a": str, "asked_at": ts}
    completed: bool = False
    final_result: dict | None = None
    started_at: datetime | None = None


class VivaManager:
    """Orchestrates a viva session. Session state is held in-memory here.

    In production, a thin Redis-backed persistence layer wraps this so
    state survives process restarts. For v4.0, in-memory is fine — a viva
    completes in 5-10 min.
    """

    DEFAULT_TOTAL_QUESTIONS = 5

    def __init__(self, claude: ClaudeClientBase):
        self.claude = claude
        self._sessions: dict[str, VivaSession] = {}

    async def start(
        self,
        *,
        user_id: int,
        course_id: str,
        module_id: str,
        phase_id: str,
        phase_name: str,
    ) -> VivaSession:
        session_id = str(uuid.uuid4())
        # Ask opener
        opener_system = VIVA_OPENER_PROMPT.format(phase_name=phase_name)
        response = await self.claude.complete(
            system=opener_system,
            messages=[ClaudeMessage(role="user", content="Begin the viva.")],
            model_tier=ModelTier.SONNET,
            max_tokens=300,
            temperature=0.7,
        )

        session = VivaSession(
            session_id=session_id,
            user_id=user_id,
            course_id=course_id,
            module_id=module_id,
            phase_id=phase_id,
            phase_name=phase_name,
            total_questions=self.DEFAULT_TOTAL_QUESTIONS,
            turns=[{"q": response.content.strip(), "a": None, "asked_at": datetime.utcnow().isoformat()}],
            started_at=datetime.utcnow(),
        )
        self._sessions[session_id] = session
        return session

    async def answer(
        self,
        *,
        session_id: str,
        answer: str,
    ) -> VivaSession:
        session = self._sessions.get(session_id)
        if not session:
            raise ValueError(f"Viva session not found: {session_id}")
        if session.completed:
            raise ValueError("Viva session already completed")

        # Record the answer on the latest turn
        if session.turns and session.turns[-1]["a"] is None:
            session.turns[-1]["a"] = answer
        else:
            raise ValueError("No pending question to answer")

        # Decide: ask another question OR judge
        questions_asked = len(session.turns)
        if questions_asked >= session.total_questions:
            # Judge
            await self._judge(session)
            session.completed = True
        else:
            # Ask next question
            await self._ask_next(session)

        return session

    async def _ask_next(self, session: VivaSession):
        conversation = self._format_conversation(session)
        last_topic = (
            session.turns[-1]["q"][:80] if session.turns else "opening"
        )
        prompt = VIVA_FOLLOWUP_PROMPT.format(
            conversation=conversation,
            question_num=len(session.turns) + 1,
            total_expected=session.total_questions,
            last_topic=last_topic,
        )
        response = await self.claude.complete(
            system=prompt,
            messages=[ClaudeMessage(role="user", content="Next question.")],
            model_tier=ModelTier.SONNET,
            max_tokens=300,
        )
        session.turns.append({
            "q": response.content.strip(),
            "a": None,
            "asked_at": datetime.utcnow().isoformat(),
        })

    async def _judge(self, session: VivaSession):
        conversation = self._format_conversation(session)
        prompt = VIVA_JUDGE_PROMPT.format(conversation=conversation)
        parsed, response = await self.claude.complete_structured(
            system=prompt,
            messages=[ClaudeMessage(role="user", content="Judge the viva.")],
            model_tier=ModelTier.SONNET,
            schema_hint='{"per_criterion": {...}, "overall_score": int, "passed": bool, "overall_feedback": str}',
            max_tokens=800,
        )
        cost = CostTracker.compute(
            TokenUsage(
                fresh_input_tokens=response.fresh_input_tokens,
                cached_input_tokens=response.cached_input_tokens,
                output_tokens=response.output_tokens,
                model_tier=ModelTier.SONNET,
            )
        )
        session.final_result = {
            "passed": bool(parsed.get("passed", False)),
            "overall_score": int(parsed.get("overall_score", 0)),
            "per_criterion": parsed.get("per_criterion", {}),
            "overall_feedback": parsed.get("overall_feedback", ""),
            "cost_inr": float(cost.total_inr),
        }

    def _format_conversation(self, session: VivaSession) -> str:
        lines = []
        for i, turn in enumerate(session.turns):
            lines.append(f"Q{i+1}: {turn['q']}")
            if turn["a"]:
                lines.append(f"A{i+1}: {turn['a']}")
        return "\n".join(lines)

    def get_session(self, session_id: str) -> VivaSession | None:
        return self._sessions.get(session_id)
