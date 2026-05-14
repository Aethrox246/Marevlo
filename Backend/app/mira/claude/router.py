"""Claude model routing.

Maps (tier, call_site) → specific Claude model.

Why a dedicated router module: when Anthropic releases a new model or
you renegotiate pricing, this is the ONLY file that changes. Everything
else is tier-agnostic.

Call sites:
  - chat            : conversational tutor responses
  - depth_classify  : heuristic fallback for question depth
  - concept_extract : ingestion-time extraction from course content
  - rubric_generate : one-time rubric drafting per section
  - section_check   : section retrieval grading
  - synthesis_grade : module synthesis grading
  - viva            : phase-end adversarial viva
  - semantic_memory : background aggregation
  - onboarding      : diagnostic flow
"""
from __future__ import annotations

from enum import Enum

from app.mira.models.schemas import Tier


class ModelTier(str, Enum):
    """The abstract model tier. Actual model strings live below."""
    HAIKU = "haiku"      # fast, cheap, high-volume
    SONNET = "sonnet"    # deepest quality, vision, higher stakes


# Actual Claude model identifiers. Update here only.
MODEL_STRINGS = {
    ModelTier.HAIKU: "claude-haiku-4-5-20251001",
    ModelTier.SONNET: "claude-sonnet-4-6",
}


# Cost per million tokens, in INR (assumes ~₹83/$1 as of 2026-04).
# Update when Anthropic pricing changes or FX moves meaningfully.
# These include the 15% volatility buffer from our pricing doc.
COST_PER_M_TOKENS_INR = {
    ModelTier.HAIKU: {
        "input": 66.4,          # $0.80/M + 15% buffer → ₹76/M, we use ₹66 (base w/o buffer here)
        "input_cached": 6.64,   # 90% discount on cached prefix
        "output": 332.0,        # $4/M → ₹332/M
    },
    ModelTier.SONNET: {
        "input": 249.0,         # $3/M
        "input_cached": 24.9,
        "output": 1245.0,       # $15/M
    },
}


class ModelRouter:
    """Static routing logic — no state, just rules."""

    @staticmethod
    def for_chat(tier: Tier) -> ModelTier:
        """Pick a model for a conversational chat turn."""
        if tier in {Tier.PRO, Tier.ELITE, Tier.SPARK}:
            # Pro/Elite pay for depth. Spark is the viral "taste of Pro" tier.
            return ModelTier.SONNET
        # Free / Starter / Plus → Haiku
        return ModelTier.HAIKU

    @staticmethod
    def for_depth_classify() -> ModelTier:
        """Heuristic handles ~80%. Fallback uses Haiku (cheap + fast)."""
        return ModelTier.HAIKU

    @staticmethod
    def for_concept_extract() -> ModelTier:
        """One-time ingestion. Sonnet quality is worth it."""
        return ModelTier.SONNET

    @staticmethod
    def for_rubric_generate() -> ModelTier:
        """One-time rubric drafting. Human-reviewed after."""
        return ModelTier.SONNET

    @staticmethod
    def for_section_check(tier: Tier) -> ModelTier:
        """Section-level grading is high-volume; Haiku handles it."""
        return ModelTier.HAIKU

    @staticmethod
    def for_synthesis_grade(tier: Tier) -> ModelTier:
        """Module synthesis is higher stakes; use Sonnet."""
        return ModelTier.SONNET

    @staticmethod
    def for_viva(tier: Tier) -> ModelTier:
        """Phase-end viva is highest stakes; Sonnet always."""
        return ModelTier.SONNET

    @staticmethod
    def for_semantic_memory() -> ModelTier:
        """Background summarization — Haiku is sufficient."""
        return ModelTier.HAIKU

    @staticmethod
    def for_onboarding() -> ModelTier:
        """Diagnostic is one-time per user. Quality matters for 'instant wow'."""
        return ModelTier.SONNET

    @staticmethod
    def for_mcq_generate(tier: Tier) -> ModelTier:
        """MCQ generation follows the chat tier (Haiku for most, Sonnet for Pro+)."""
        return ModelRouter.for_chat(tier)

    @staticmethod
    def resolve_model_string(model_tier: ModelTier) -> str:
        return MODEL_STRINGS[model_tier]

    @staticmethod
    def vision_enabled_for(tier: Tier) -> bool:
        """Which tiers include image input."""
        return tier in {Tier.SPARK, Tier.PRO, Tier.ELITE}
