"""ChatPipeline — the end-to-end MIRA orchestration.

Given (user_id, question, context), runs the full pipeline:
  1. Check quota
  2. Domain guard
  3. Load user profile + lattice
  4. Classify question depth
  5. Match concepts
  6. Retrieve relevant chunks from Qdrant
  7. Thompson sample style
  8. Assemble prompt with cached prefix
  9. Call Claude (Haiku or Sonnet based on tier)
 10. Update beliefs, bandit, personal prompt
 11. Maybe trigger spaced repetition, maybe generate MCQ
 12. Log to episodic, emit trace

Works equally well with MockClaudeClient (tests) and real ClaudeClient.

This module is the big integration test target — if this works end-to-end
against mocks, all subsystems are wired correctly.
"""
from __future__ import annotations

import random
import time
from dataclasses import dataclass, field
from datetime import datetime
from decimal import Decimal
from typing import Any

from sqlalchemy.ext.asyncio import AsyncSession

from app.mira.claude.client import (
    CachedPrefix,
    ClaudeClientBase,
    ClaudeMessage,
)
from app.mira.claude.cost_tracker import CostTracker, TokenUsage
from app.mira.claude.router import ModelRouter, ModelTier
from app.mira.cognitive.bandit import ThompsonBandit
from app.mira.cognitive.concept_matcher import ConceptMatcher
from app.mira.cognitive.depth_classifier import DepthClassifier
from app.mira.cognitive.frustration import FrustrationDetector
from app.mira.cognitive.tracker import CognitiveTracker
from app.mira.domain_guard import REDIRECT_MESSAGE, check_question
from app.mira.memory.episodic import EpisodicLogger
from app.mira.memory.personal_prompt import PersonalPromptBuilder
from app.mira.memory.spaced_rep import SpacedRepetitionScheduler
from app.mira.models.db_models import MiraUserProfile
from app.mira.models.schemas import (
    ConceptBelief,
    ExplainStyle,
    MasteryLevel,
    PersonalPromptData,
    QuestionDepth,
    StyleBanditState,
    Tier,
)
from app.mira.quota_enforcer import QuotaCheck, QuotaEnforcer
from app.mira.retrieval.lattice import LatticeLoader
from app.mira.retrieval.retriever import Retriever
from app.mira.telemetry import Trace, emit, new_trace_id


# ===========================================================================
# RESULT
# ===========================================================================
@dataclass
class PipelineResult:
    response: str
    matched_concepts: list[str]
    depth: QuestionDepth
    style_used: ExplainStyle
    blend_style: ExplainStyle | None
    model: str
    tokens_in: int
    tokens_out: int
    cost_inr: Decimal
    latency_ms: int
    quota_remaining: int
    rate_limited: bool
    domain_redirected: bool
    trace_id: str
    errors: list[str] = field(default_factory=list)


# ===========================================================================
# PIPELINE
# ===========================================================================
class ChatPipeline:
    def __init__(
        self,
        db: AsyncSession,
        claude: ClaudeClientBase,
        retriever: Retriever,
        lattice_loader: LatticeLoader,
        quota_enforcer: QuotaEnforcer,
        rng: random.Random | None = None,
    ):
        self.db = db
        self.claude = claude
        self.retriever = retriever
        self.lattice_loader = lattice_loader
        self.quota = quota_enforcer
        self.rng = rng or random.Random()

    # -----------------------------------------------------------------------
    # PUBLIC: handle one chat turn
    # -----------------------------------------------------------------------
    async def handle(
        self,
        *,
        user_id: int,
        question: str,
        course_id: str | None = None,
        module_id: str | None = None,
        section_id: str | None = None,
        extra_prompt_context: str | None = None,
    ) -> PipelineResult:
        t0 = time.monotonic()
        trace = Trace(
            trace_id=new_trace_id(),
            user_id=user_id,
            tier="unknown",
            endpoint="/api/mira/chat",
            course_id=course_id,
            module_id=module_id,
            section_id=section_id,
        )
        errors: list[str] = []

        # 1. Load user profile
        profile = await self._load_or_create_profile(user_id)
        tier = Tier(profile.tier)
        trace.tier = tier.value

        # 2. Domain guard (heuristic layer)
        dc = check_question(question)
        if not dc.in_scope:
            return self._redirect_result(
                trace=trace,
                tier=tier,
                remaining=0,
                reason=dc.reason,
            )

        # 3. Quota
        qc = await self.quota.check(user_id, tier)
        if not qc.allowed:
            return PipelineResult(
                response=(
                    f"You've used all {qc.limit} questions for this period. "
                    f"Your quota resets {_short_when(qc.period_resets_at)}. "
                    "Upgrade to Plus for 250/month or Pro for 400/month with image support."
                ),
                matched_concepts=[],
                depth=QuestionDepth.SURFACE,
                style_used=ExplainStyle.ANALOGY,
                blend_style=None,
                model="",
                tokens_in=0,
                tokens_out=0,
                cost_inr=Decimal("0"),
                latency_ms=int((time.monotonic() - t0) * 1000),
                quota_remaining=0,
                rate_limited=True,
                domain_redirected=False,
                trace_id=trace.trace_id,
            )

        # 4. Classify depth (heuristic first, LLM fallback)
        t_depth = time.monotonic()
        depth_result = DepthClassifier.classify(question)
        depth = depth_result.depth
        if DepthClassifier.needs_llm_fallback(depth_result):
            # LLM fallback could go here — for v4.0 we trust the heuristic
            pass
        trace.latency_ms["depth_classify"] = int((time.monotonic() - t_depth) * 1000)
        trace.depth_classified = depth.value

        # 5. Load lattice + match concepts + retrieve
        t_retrieve = time.monotonic()
        lattice = await self.lattice_loader.load(course_id or "", module_id)
        retrieval = await self.retriever.retrieve(
            question=question,
            lattice=lattice,
            course_id=course_id,
            module_id=module_id,
            top_k=5,
        )
        trace.latency_ms["retrieval"] = int((time.monotonic() - t_retrieve) * 1000)
        matched_concept_ids = [m.concept_id for m in retrieval.matched_concepts]
        trace.matched_concepts = matched_concept_ids

        # 6. Bandit — select style
        bandit_state = _load_bandit_state(profile)
        selection = ThompsonBandit.select(bandit_state, rng=self.rng)
        style_used = selection.primary
        blend_style = selection.blend
        trace.style_selected = style_used.value
        trace.style_blended = blend_style.value if blend_style else None

        # 7. Assemble prompt
        model_tier = ModelRouter.for_chat(tier)
        system_prompt, cached_prefix, user_msg = self._build_prompt(
            question=question,
            depth=depth,
            style=style_used,
            blend=blend_style,
            retrieval_chunks=retrieval.chunks,
            profile=profile,
            matched_concept_ids=matched_concept_ids,
        )

        # 7b. Inject section-specific extra context (from ContextProvider)
        # into the user message just before sending to Claude. Kept separate
        # from cached_prefix because it's typically user-specific/volatile
        # (e.g. their current code) and shouldn't be cached.
        if extra_prompt_context:
            user_msg = (
                f"{extra_prompt_context}\n\n"
                f"# STUDENT'S QUESTION\n{question}"
            )

        # 8. Call Claude
        t_llm = time.monotonic()
        response = await self.claude.complete(
            system=system_prompt,
            messages=[ClaudeMessage(role="user", content=user_msg)],
            model_tier=model_tier,
            cached_prefix=cached_prefix,
            max_tokens=1024,
        )
        trace.latency_ms["llm_total"] = int((time.monotonic() - t_llm) * 1000)
        trace.model = response.model
        trace.tokens_in_fresh = response.fresh_input_tokens
        trace.tokens_in_cached = response.cached_input_tokens
        trace.tokens_out = response.output_tokens
        if response.fresh_input_tokens + response.cached_input_tokens > 0:
            trace.cache_hit_ratio = round(
                response.cached_input_tokens
                / (response.fresh_input_tokens + response.cached_input_tokens),
                3,
            )

        # 9. Cost
        cost = CostTracker.compute(
            TokenUsage(
                fresh_input_tokens=response.fresh_input_tokens,
                cached_input_tokens=response.cached_input_tokens,
                output_tokens=response.output_tokens,
                model_tier=model_tier,
            )
        )
        trace.cost_inr = float(cost.total_inr)

        # 10. Update state
        await self._update_state(
            profile=profile,
            matched_concept_ids=matched_concept_ids,
            depth=depth,
            style_used=style_used,
            bandit_state=bandit_state,
        )

        # 11. Log episodic
        logger = EpisodicLogger(self.db)
        await logger.log_chat(
            user_id=user_id,
            course_id=course_id,
            module_id=module_id,
            section_id=section_id,
            question=question,
            answer=response.content,
            depth=depth,
            style_used=style_used,
            concept_ids=matched_concept_ids,
            model=response.model,
            tokens_in=response.fresh_input_tokens + response.cached_input_tokens,
            tokens_out=response.output_tokens,
            cost_inr=cost.total_inr,
        )

        # 12. Maybe schedule spaced rep (for concepts that just crossed mastered)
        await self._maybe_schedule_spaced_rep(
            user_id=user_id,
            course_id=course_id or "",
            matched_concept_ids=matched_concept_ids,
            profile=profile,
        )

        # Commit everything atomically
        await self.db.commit()

        # Emit trace
        trace.errors = errors
        emit(trace)

        total_latency = int((time.monotonic() - t0) * 1000)
        return PipelineResult(
            response=response.content,
            matched_concepts=matched_concept_ids,
            depth=depth,
            style_used=style_used,
            blend_style=blend_style,
            model=response.model,
            tokens_in=response.fresh_input_tokens + response.cached_input_tokens,
            tokens_out=response.output_tokens,
            cost_inr=cost.total_inr,
            latency_ms=total_latency,
            quota_remaining=qc.remaining,
            rate_limited=False,
            domain_redirected=False,
            trace_id=trace.trace_id,
            errors=errors,
        )

    # -----------------------------------------------------------------------
    # HELPERS
    # -----------------------------------------------------------------------
    async def _load_or_create_profile(self, user_id: int) -> MiraUserProfile:
        profile = await self.db.get(MiraUserProfile, user_id)
        if profile:
            return profile
        # Create default profile (free tier, monthly period)
        from datetime import timezone
        profile = MiraUserProfile(
            user_id=user_id,
            tier="free",
            quota_period_resets_at=datetime.utcnow(),  # overwritten by enforcer
            beliefs={},
            bandit_state={},
            personal_prompt={},
        )
        self.db.add(profile)
        await self.db.flush()
        return profile

    def _build_prompt(
        self,
        *,
        question: str,
        depth: QuestionDepth,
        style: ExplainStyle,
        blend: ExplainStyle | None,
        retrieval_chunks: list,
        profile: MiraUserProfile,
        matched_concept_ids: list[str],
    ) -> tuple[str, list[CachedPrefix], str]:
        """Returns (system_prompt, cached_prefix_blocks, user_message)."""
        # Domain guard block (cacheable)
        from app.mira.domain_guard import DOMAIN_GUARD_SYSTEM_PROMPT

        # Style instructions
        style_line = f"Explanation style: primarily {style.value}"
        if blend:
            style_line += f", with some {blend.value}"

        # Depth-appropriate tone
        depth_hint = {
            QuestionDepth.SURFACE: "They're asking for a basic explanation. Start simple.",
            QuestionDepth.STRUCTURAL: "They want to understand how it works mechanically.",
            QuestionDepth.RELATIONAL: "They want to understand relationships and why.",
            QuestionDepth.EVALUATIVE: "They're thinking about tradeoffs — compare and judge.",
            QuestionDepth.CREATIVE: "They're synthesizing — think with them, suggest novel angles.",
        }.get(depth, "")

        # Retrieved context (cacheable)
        retrieval_text = self.retriever.format_chunks_for_prompt(retrieval_chunks)

        # Personal prompt (FRESH — not cacheable)
        try:
            pp_data = PersonalPromptData(**profile.personal_prompt)
        except Exception:
            pp_data = PersonalPromptData()
        beliefs_objs: dict[str, ConceptBelief] = {}
        for cid, bd in (profile.beliefs or {}).items():
            try:
                beliefs_objs[cid] = ConceptBelief(**bd)
            except Exception:
                continue
        personal = PersonalPromptBuilder.build_prompt(
            personal_prompt=pp_data,
            current_beliefs=beliefs_objs,
        )

        # Cached (stable across users on same course+section):
        cached_prefix = [
            CachedPrefix(text=DOMAIN_GUARD_SYSTEM_PROMPT),
        ]
        if retrieval_text:
            cached_prefix.append(
                CachedPrefix(text=f"# RELEVANT COURSE CONTENT\n{retrieval_text}")
            )

        # Fresh system prompt (style + depth + personal)
        system_prompt = (
            f"{style_line}\n{depth_hint}\n\n{personal}\n\n"
            f"Answer clearly, cite course sections when relevant, "
            f"and keep responses focused — aim for 4-10 sentences unless depth warrants more."
        )

        return system_prompt, cached_prefix, question

    async def _update_state(
        self,
        *,
        profile: MiraUserProfile,
        matched_concept_ids: list[str],
        depth: QuestionDepth,
        style_used: ExplainStyle,
        bandit_state: StyleBanditState,
    ):
        """Update beliefs, bandit, personal_prompt, write back to profile."""
        # Beliefs update for each matched concept
        new_beliefs = dict(profile.beliefs or {})
        for cid in matched_concept_ids:
            # Load existing or init
            existing_data = new_beliefs.get(cid)
            if existing_data:
                try:
                    belief = ConceptBelief(**existing_data)
                except Exception:
                    belief = CognitiveTracker.initialize_belief(cid)
            else:
                belief = CognitiveTracker.initialize_belief(cid)

            previous_mastery = belief.mastery
            belief = CognitiveTracker.update_from_question(belief, depth)

            # Observation for personal prompt
            obs = PersonalPromptBuilder.observation_from_depth(cid, depth)

            new_beliefs[cid] = belief.model_dump(mode="json")

            # Track mastery crossing — used for spaced rep trigger
            # (We don't actually trigger here; that happens in _maybe_schedule_spaced_rep)

        profile.beliefs = new_beliefs

        # Bandit — record that we USED this style (no reward until feedback comes)
        # For now we don't update — feedback endpoint handles bandit updates
        profile.bandit_state = bandit_state.model_dump(mode="json")

        # Personal prompt
        try:
            pp_data = PersonalPromptData(**(profile.personal_prompt or {}))
        except Exception:
            pp_data = PersonalPromptData()
        if matched_concept_ids:
            obs = PersonalPromptBuilder.observation_from_depth(
                matched_concept_ids[0], depth
            )
            pp_data = PersonalPromptBuilder.update_with_observation(pp_data, obs)
        profile.personal_prompt = pp_data.model_dump(mode="json")
        await self.db.flush()

    async def _maybe_schedule_spaced_rep(
        self,
        *,
        user_id: int,
        course_id: str,
        matched_concept_ids: list[str],
        profile: MiraUserProfile,
    ):
        sched = SpacedRepetitionScheduler(self.db)
        for cid in matched_concept_ids:
            belief_data = (profile.beliefs or {}).get(cid)
            if not belief_data:
                continue
            try:
                belief = ConceptBelief(**belief_data)
            except Exception:
                continue
            if belief.mastery == MasteryLevel.MASTERED:
                await sched.schedule_new(
                    user_id=user_id,
                    concept_id=cid,
                    course_id=course_id or "general",
                )

    def _redirect_result(
        self,
        *,
        trace: Trace,
        tier: Tier,
        remaining: int,
        reason: str,
    ) -> PipelineResult:
        emit(trace)
        return PipelineResult(
            response=REDIRECT_MESSAGE,
            matched_concepts=[],
            depth=QuestionDepth.SURFACE,
            style_used=ExplainStyle.ANALOGY,
            blend_style=None,
            model="",
            tokens_in=0,
            tokens_out=0,
            cost_inr=Decimal("0"),
            latency_ms=0,
            quota_remaining=remaining,
            rate_limited=False,
            domain_redirected=True,
            trace_id=trace.trace_id,
        )


def _load_bandit_state(profile: MiraUserProfile) -> StyleBanditState:
    """Load bandit from profile JSONB. Ensures all 6 arms exist."""
    try:
        state = StyleBanditState(**(profile.bandit_state or {}))
    except Exception:
        state = StyleBanditState()
    state.ensure_arms()
    return state


def _short_when(dt: datetime) -> str:
    """'tomorrow at 00:00' / 'in 12 days' — small humanizer."""
    now = datetime.utcnow()
    if dt.tzinfo is not None:
        # Strip tz for comparison with naive utcnow
        dt = dt.replace(tzinfo=None)
    delta = dt - now
    if delta.days == 0:
        return "later today"
    if delta.days == 1:
        return "tomorrow"
    return f"in {delta.days} days"
