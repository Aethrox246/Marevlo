"""Thompson Sampling bandit for explanation style selection.

Six explanation styles compete for the user's attention:
  - ANALOGY: relate to familiar things
  - VISUAL: diagrams, spatial metaphors
  - MATHEMATICAL: formal notation, derivations
  - CODE: code-first explanations
  - STORYTELLING: narrative, historical context
  - SOCRATIC: ask leading questions

Each style is a Beta distribution posterior per user. On every interaction:
  1. SAMPLE: draw one value from each arm's Beta(alpha, beta)
  2. PICK: use the style with the highest sampled value
  3. BLEND: if top-2 are within blend_threshold, blend them
  4. UPDATE: on feedback (worked / didn't work), bump alpha or beta

This is classic Thompson Sampling. Converges to the user's true preference
much faster than epsilon-greedy and handles non-stationarity better.

No LLM calls in this file. Uses numpy.random for Beta sampling — fully
deterministic if you seed the RNG.
"""
from __future__ import annotations

import random
from dataclasses import dataclass

from app.mira.models.schemas import (
    ExplainStyle,
    StyleArm,
    StyleBanditState,
)


@dataclass(frozen=True)
class BanditSelection:
    primary: ExplainStyle
    blend: ExplainStyle | None  # None means pure style
    primary_sampled: float      # for observability
    blend_sampled: float | None
    exploration_mode: bool      # True when top two arms were close


class ThompsonBandit:
    """Stateless Thompson Sampling bandit.

    Operates on StyleBanditState objects passed in. Persistence happens
    at the router layer.
    """

    # -----------------------------------------------------------------
    # SELECTION
    # -----------------------------------------------------------------
    @staticmethod
    def select(
        state: StyleBanditState,
        rng: random.Random | None = None,
    ) -> BanditSelection:
        """Thompson sample: draw from each arm's Beta, pick the highest.

        If top 2 are within blend_threshold, blend them (primary + secondary).
        """
        state.ensure_arms()
        rng = rng or random

        # Sample from each arm's Beta(alpha, beta)
        samples: list[tuple[str, float]] = []
        for style_name, arm in state.arms.items():
            sampled = rng.betavariate(arm.alpha, arm.beta_param)
            samples.append((style_name, sampled))

        # Sort descending by sampled value
        samples.sort(key=lambda x: x[1], reverse=True)

        primary_name, primary_val = samples[0]
        blend_name, blend_val = samples[1]

        primary = ExplainStyle(primary_name)

        # Blend if top two are close
        exploration_mode = abs(primary_val - blend_val) < state.blend_threshold
        blend_style = ExplainStyle(blend_name) if exploration_mode else None

        return BanditSelection(
            primary=primary,
            blend=blend_style,
            primary_sampled=primary_val,
            blend_sampled=blend_val if exploration_mode else None,
            exploration_mode=exploration_mode,
        )

    # -----------------------------------------------------------------
    # UPDATE
    # -----------------------------------------------------------------
    @staticmethod
    def update(
        state: StyleBanditState,
        style_used: ExplainStyle,
        worked: bool,
        reward_strength: float = 1.0,
    ) -> StyleBanditState:
        """Update posterior for the arm that was used.

        reward_strength allows caller to weight updates:
          1.0 = normal feedback
          2.0 = user said "this was really helpful"
          0.5 = weaker signal from indirect evidence
        """
        state.ensure_arms()
        arm = state.arms[style_used.value]
        arm.total_tries += 1
        if worked:
            arm.alpha += reward_strength
            arm.total_success += 1
        else:
            arm.beta_param += reward_strength
        return state

    @staticmethod
    def update_from_feedback(
        state: StyleBanditState,
        style_used: ExplainStyle,
        understood: bool,
    ) -> StyleBanditState:
        """Convenience wrapper for feedback button updates."""
        return ThompsonBandit.update(
            state=state,
            style_used=style_used,
            worked=understood,
            reward_strength=1.0,
        )

    @staticmethod
    def update_from_mcq(
        state: StyleBanditState,
        style_used: ExplainStyle,
        correct: bool,
    ) -> StyleBanditState:
        """MCQ results update the bandit with weaker signal than explicit
        feedback (MCQ tests knowledge, not whether explanation worked)."""
        return ThompsonBandit.update(
            state=state,
            style_used=style_used,
            worked=correct,
            reward_strength=0.5,
        )

    # -----------------------------------------------------------------
    # INTROSPECTION
    # -----------------------------------------------------------------
    @staticmethod
    def get_expected_values(state: StyleBanditState) -> dict[str, float]:
        """Return the mean of each arm's Beta(a, b) = a / (a + b).

        For displaying "which style we think you prefer" in the dashboard.
        """
        state.ensure_arms()
        return {
            name: arm.alpha / (arm.alpha + arm.beta_param)
            for name, arm in state.arms.items()
        }

    @staticmethod
    def get_dominant_style(state: StyleBanditState) -> ExplainStyle | None:
        """Style with the highest expected value.

        Returns None if the bandit hasn't learned anything (all arms still
        at prior). Used for UI to show "MIRA currently prefers: mathematical"
        once there's enough signal.
        """
        state.ensure_arms()
        # Need at least 5 total tries across arms before we claim anything
        total_tries = sum(arm.total_tries for arm in state.arms.values())
        if total_tries < 5:
            return None

        expected = ThompsonBandit.get_expected_values(state)
        best_name = max(expected, key=expected.get)
        best_val = expected[best_name]

        # Don't claim a winner unless it's meaningfully above the mean
        mean_val = sum(expected.values()) / len(expected)
        if best_val - mean_val < 0.05:
            return None

        return ExplainStyle(best_name)

    @staticmethod
    def get_explore_vs_exploit_ratio(state: StyleBanditState) -> float:
        """0.0 = pure exploit, 1.0 = pure explore.

        Computed as the variance across arms. High variance = we've learned
        enough to differentiate, so we're exploiting. Low variance = we're
        still exploring.
        """
        expected = ThompsonBandit.get_expected_values(state)
        if not expected:
            return 1.0
        values = list(expected.values())
        mean = sum(values) / len(values)
        variance = sum((v - mean) ** 2 for v in values) / len(values)
        # Scale: variance of 0.1 is "very differentiated"
        return max(0.0, min(1.0, 1.0 - variance / 0.1))
