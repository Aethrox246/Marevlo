"""Cost tracker — convert token counts → INR, track margin per user.

Every LLM call records (tokens_in_fresh, tokens_in_cached, tokens_out).
This module turns those numbers into rupees spent.

Also exposes margin computation: given a user on tier T who cost us
₹X this period, what's our profit? Used by the operational dashboard
and the margin-monitoring alerts.
"""
from __future__ import annotations

from dataclasses import dataclass
from decimal import Decimal

from app.mira.claude.router import COST_PER_M_TOKENS_INR, ModelTier
from app.mira.models.schemas import Tier


# Tier pricing — monthly cost to the USER.
# Matches the concept document.
TIER_MONTHLY_REVENUE_INR = {
    Tier.FREE: Decimal("0"),
    Tier.SPARK: Decimal("99"),       # per DAY actually; handled separately
    Tier.STARTER: Decimal("399"),
    Tier.PLUS: Decimal("899"),
    Tier.PRO: Decimal("1999"),
    Tier.ELITE: Decimal("4999"),
}

# Per-question infrastructure cost (Redis + Postgres + Qdrant compute share).
# Pulled from unit-economics model: ₹0.10 for Haiku tier, ₹0.15 for Sonnet.
# Independent of token count.
INFRA_COST_PER_QUESTION = {
    ModelTier.HAIKU: Decimal("0.10"),
    ModelTier.SONNET: Decimal("0.15"),
}


@dataclass
class TokenUsage:
    """One LLM call's token consumption."""
    fresh_input_tokens: int
    cached_input_tokens: int
    output_tokens: int
    model_tier: ModelTier


@dataclass
class CostBreakdown:
    """Itemized cost of one LLM call."""
    fresh_input_cost_inr: Decimal
    cached_input_cost_inr: Decimal
    output_cost_inr: Decimal
    infra_cost_inr: Decimal
    total_inr: Decimal
    cache_hit_ratio: float


class CostTracker:
    """Stateless. Persistence happens at the router layer."""

    @staticmethod
    def compute(usage: TokenUsage) -> CostBreakdown:
        rates = COST_PER_M_TOKENS_INR[usage.model_tier]

        # (tokens / 1_000_000) * rate_per_million
        fresh_cost = Decimal(usage.fresh_input_tokens) * Decimal(rates["input"]) / Decimal(1_000_000)
        cached_cost = (
            Decimal(usage.cached_input_tokens)
            * Decimal(rates["input_cached"])
            / Decimal(1_000_000)
        )
        output_cost = (
            Decimal(usage.output_tokens) * Decimal(rates["output"]) / Decimal(1_000_000)
        )
        infra = INFRA_COST_PER_QUESTION[usage.model_tier]

        total = fresh_cost + cached_cost + output_cost + infra

        total_input = usage.fresh_input_tokens + usage.cached_input_tokens
        cache_ratio = (
            usage.cached_input_tokens / total_input if total_input > 0 else 0.0
        )

        # Quantize to 4 decimal places (paise precision ×100)
        return CostBreakdown(
            fresh_input_cost_inr=fresh_cost.quantize(Decimal("0.0001")),
            cached_input_cost_inr=cached_cost.quantize(Decimal("0.0001")),
            output_cost_inr=output_cost.quantize(Decimal("0.0001")),
            infra_cost_inr=infra.quantize(Decimal("0.0001")),
            total_inr=total.quantize(Decimal("0.0001")),
            cache_hit_ratio=round(cache_ratio, 3),
        )

    @staticmethod
    def compute_margin_for_period(
        tier: Tier,
        total_spend_inr: Decimal,
        period_days: int = 30,
    ) -> dict:
        """For a user on `tier` who cost us `total_spend_inr` this period,
        compute our margin."""
        monthly_rev = TIER_MONTHLY_REVENUE_INR[tier]
        # Spark is per-day; normalize if period matches
        if tier == Tier.SPARK:
            # Revenue is ₹99 × number of days they actively used
            # Caller passes period_days = days active
            revenue = monthly_rev * Decimal(period_days)
        else:
            # Others are monthly; approximate by days
            revenue = monthly_rev * Decimal(period_days) / Decimal(30)

        profit = revenue - total_spend_inr
        margin_pct = (
            float((profit / revenue) * 100)
            if revenue > 0
            else 0.0
        )

        return {
            "tier": tier.value,
            "revenue_inr": float(revenue),
            "spend_inr": float(total_spend_inr),
            "profit_inr": float(profit),
            "margin_pct": round(margin_pct, 2),
        }

    @staticmethod
    def estimate_sonnet_vs_haiku_cost(
        avg_input_tokens: int,
        avg_output_tokens: int,
        num_calls: int,
        cache_hit_ratio: float = 0.7,
    ) -> dict:
        """Useful for the simulation test suite: compute expected cost
        at each model tier for a given workload."""
        results = {}
        for tier in (ModelTier.HAIKU, ModelTier.SONNET):
            cached = int(avg_input_tokens * cache_hit_ratio)
            fresh = avg_input_tokens - cached
            usage = TokenUsage(
                fresh_input_tokens=fresh,
                cached_input_tokens=cached,
                output_tokens=avg_output_tokens,
                model_tier=tier,
            )
            single = CostTracker.compute(usage)
            results[tier.value] = {
                "cost_per_call_inr": float(single.total_inr),
                "cost_total_inr": float(single.total_inr * num_calls),
            }
        return results
