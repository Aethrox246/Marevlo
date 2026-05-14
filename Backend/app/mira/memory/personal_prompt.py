"""Personal prompt builder.

The personal prompt is a growing list of observations about one user —
how they learn, what they struggle with, their background, preferences.
Max 30 observations. Each MIRA interaction may add zero or one new
observation.

This is the "MIRA remembers me" feature that makes her feel personalized.
Injected as a fresh (non-cached) prefix in every Claude call.
"""
from __future__ import annotations

from app.mira.models.schemas import (
    ConceptBelief,
    ExplainStyle,
    MasteryLevel,
    PersonalPromptData,
    QuestionDepth,
)


class PersonalPromptBuilder:
    """Stateless. Given current state, produces observations to add and
    the prompt string to inject."""

    # ============================================================
    # OBSERVATION GENERATION
    # ============================================================
    @staticmethod
    def observation_from_feedback(
        concept_name: str,
        style: ExplainStyle,
        understood: bool,
    ) -> str:
        if understood:
            return f"{style.value} explanations click for them on topics like {concept_name}"
        return f"{style.value} explanations did not work for them on topics like {concept_name}"

    @staticmethod
    def observation_from_mcq(
        concept_name: str,
        correct: bool,
        misconception: str | None,
    ) -> str:
        if correct:
            return f"correctly answered an MCQ about {concept_name}"
        if misconception:
            return f"common misconception: {misconception}"
        return f"missed an MCQ about {concept_name}"

    @staticmethod
    def observation_from_depth(
        concept_name: str,
        depth: QuestionDepth,
    ) -> str | None:
        """Only worth recording when question is sophisticated or very basic."""
        if depth == QuestionDepth.CREATIVE:
            return f"asks creative questions about {concept_name} — advanced level"
        if depth == QuestionDepth.EVALUATIVE:
            return f"thinks evaluatively about {concept_name} — judgment-capable"
        if depth == QuestionDepth.SURFACE:
            return f"still asking surface-level definitions about {concept_name}"
        return None

    @staticmethod
    def observation_from_mastery_crossing(
        concept_name: str,
        new_level: MasteryLevel,
    ) -> str | None:
        if new_level == MasteryLevel.MASTERED:
            return f"mastered {concept_name}"
        if new_level == MasteryLevel.STRUGGLING:
            return f"currently struggling with {concept_name}"
        return None

    # ============================================================
    # PROMPT ASSEMBLY
    # ============================================================
    @staticmethod
    def build_prompt(
        personal_prompt: PersonalPromptData,
        current_beliefs: dict[str, ConceptBelief] | None = None,
        career_stage: str | None = None,
        background: str | None = None,
    ) -> str:
        """Assemble the personal_prompt block for a Claude call.

        Structure:
          USER PROFILE
          - observations from personal_prompt
          - current mastery snapshot (top struggling + top mastered)
          - career stage / background (if known)
        """
        lines = ["# USER LEARNING PROFILE"]

        if career_stage:
            lines.append(f"Career stage: {career_stage}")
        if background:
            lines.append(f"Background: {background[:200]}")

        if personal_prompt.observations:
            lines.append("\nObservations from past sessions:")
            for obs in personal_prompt.observations[-15:]:
                lines.append(f"- {obs}")

        if current_beliefs:
            mastered = [
                cid for cid, b in current_beliefs.items()
                if b.mastery == MasteryLevel.MASTERED
            ]
            struggling = [
                cid for cid, b in current_beliefs.items()
                if b.mastery == MasteryLevel.STRUGGLING
            ]
            if mastered:
                sample = ", ".join(mastered[:5])
                lines.append(f"\nConcepts they've mastered: {sample}")
            if struggling:
                sample = ", ".join(struggling[:5])
                lines.append(f"Currently struggling with: {sample}")

        if len(lines) == 1:
            # No content — return something short rather than empty
            return "# USER LEARNING PROFILE\nNew user, no prior context yet."

        return "\n".join(lines)

    @staticmethod
    def update_with_observation(
        personal_prompt: PersonalPromptData,
        observation: str | None,
    ) -> PersonalPromptData:
        """Add an observation if non-null and non-duplicate. Returns same
        object (mutated)."""
        if observation:
            personal_prompt.add(observation)
        return personal_prompt
