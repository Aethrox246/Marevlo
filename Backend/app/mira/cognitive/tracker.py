"""Bayesian Cognitive State Tracker (BCST).

The core innovation of MIRA. Tracks per-concept P(known) using Bayesian
Knowledge Tracing (BKT), but with an important twist: observations come
from question SOPHISTICATION (Bloom's taxonomy depth), not right/wrong.

Why this matters: traditional tutors TEST you to figure out what you know.
MIRA watches how you naturally ASK questions. A student asking "what is
gradient descent?" reveals beginner state. A student asking "why does
Adam work better than SGD on non-convex objectives?" reveals expert state.

No LLM calls in this file — pure math, fully testable.
"""
from __future__ import annotations

from datetime import datetime
from typing import TYPE_CHECKING

from app.mira.models.schemas import (
    ConceptBelief,
    MasteryLevel,
    QuestionDepth,
    ExplainStyle,
    StyleMemory,
)

if TYPE_CHECKING:
    from app.mira.models.schemas import ConceptLattice


# =============================================================================
# BKT HYPERPARAMETERS
# =============================================================================
#
# Standard BKT has 4 parameters:
#   P(L0)       — prior probability concept is known (before any interaction)
#   P(T)        — probability of transitioning unknown → known per interaction
#   P(slip)     — probability of getting it wrong despite knowing it
#   P(guess)    — probability of getting it right despite NOT knowing it
#
# MIRA extends this with depth-conditional observations:
#   - A surface question is weak evidence of knowledge
#   - A creative question is strong evidence of knowledge
#   - A negative signal (explicit "didn't understand") is strong counter-evidence

PRIOR_P_KNOWN = 0.2          # P(L0)
P_TRANSITION = 0.15          # P(T) - baseline learning rate per interaction
P_SLIP = 0.1                 # P(slip) - known but asks basic question anyway
P_GUESS = 0.2                # P(guess) - unknown but asks sophisticated question

# Depth → evidence strength mapping
# These are the likelihood ratios P(depth|known) / P(depth|unknown)
# Higher = more positive evidence of knowledge
DEPTH_EVIDENCE = {
    QuestionDepth.SURFACE: 0.8,       # barely positive
    QuestionDepth.STRUCTURAL: 1.5,    # mild positive
    QuestionDepth.RELATIONAL: 3.0,    # strong positive
    QuestionDepth.EVALUATIVE: 5.0,    # very strong positive
    QuestionDepth.CREATIVE: 8.0,      # overwhelming positive
}

# Mastery level thresholds
STRUGGLING_THRESHOLD = 0.25
MASTERED_THRESHOLD = 0.85

# Clamp bounds to avoid numerical issues
MIN_P_KNOWN = 0.01
MAX_P_KNOWN = 0.99


class CognitiveTracker:
    """Updates ConceptBelief given new observations.

    Stateless — operates on belief objects passed in. The actual persistence
    happens at the router level where we save the updated profile back to
    Postgres.
    """

    @staticmethod
    def initialize_belief(concept_id: str) -> ConceptBelief:
        """Create a fresh belief for a concept never seen by this user."""
        return ConceptBelief(
            concept_id=concept_id,
            p_known=PRIOR_P_KNOWN,
            mastery=MasteryLevel.LEARNING,
            style_memory=StyleMemory(),
        )

    @staticmethod
    def update_from_question(
        belief: ConceptBelief,
        depth: QuestionDepth,
    ) -> ConceptBelief:
        """User asked a question at this depth level.

        Sophisticated question → positive evidence of knowledge.
        Basic question → mild negative evidence (they're early in the topic).

        Bayesian update:
            P(known|obs) = P(obs|known) * P(known) / P(obs)
        """
        evidence = DEPTH_EVIDENCE[depth]

        # Likelihood ratio form of Bayes' theorem
        # posterior_odds = prior_odds * likelihood_ratio
        prior = belief.p_known
        if prior <= 0 or prior >= 1:
            prior = max(MIN_P_KNOWN, min(MAX_P_KNOWN, prior))

        prior_odds = prior / (1.0 - prior)
        posterior_odds = prior_odds * evidence
        posterior = posterior_odds / (1.0 + posterior_odds)

        # Also apply learning transition (asking helps you learn even if wrong)
        # P(known after) = P(known before) + P(T) * P(unknown before)
        posterior = posterior + P_TRANSITION * (1.0 - posterior)

        # Clamp
        posterior = max(MIN_P_KNOWN, min(MAX_P_KNOWN, posterior))

        belief.p_known = posterior
        belief.interactions += 1
        belief.depth_history.append(depth)
        if len(belief.depth_history) > 50:
            belief.depth_history = belief.depth_history[-50:]
        belief.mastery = CognitiveTracker._compute_mastery(posterior)
        belief.last_updated = datetime.utcnow()
        return belief

    @staticmethod
    def update_from_feedback(
        belief: ConceptBelief,
        understood: bool,
        style_used: ExplainStyle,
    ) -> ConceptBelief:
        """User clicked 'understood' or 'didn't understand'.

        This is strong evidence — directly about their knowledge state.
        Also updates style_memory so we learn which style works for them
        on this concept.
        """
        prior = belief.p_known
        prior = max(MIN_P_KNOWN, min(MAX_P_KNOWN, prior))

        # "Understood" = likelihood ratio 6:1 in favor of known
        # "Didn't understand" = likelihood ratio 1:4 (equivalent to 0.25)
        if understood:
            belief.understood_count += 1
            lr = 6.0
            # Record style as working
            if style_used.value not in belief.style_memory.worked:
                belief.style_memory.worked.append(style_used.value)
            # If it was previously in failed, remove it (maybe they just needed
            # to see it a second time)
            if style_used.value in belief.style_memory.failed:
                belief.style_memory.failed.remove(style_used.value)
        else:
            belief.not_understood_count += 1
            lr = 0.25
            # Record style as failing
            if style_used.value not in belief.style_memory.failed:
                belief.style_memory.failed.append(style_used.value)

        belief.style_memory.attempts += 1

        prior_odds = prior / (1.0 - prior)
        posterior_odds = prior_odds * lr
        posterior = posterior_odds / (1.0 + posterior_odds)
        posterior = max(MIN_P_KNOWN, min(MAX_P_KNOWN, posterior))

        belief.p_known = posterior
        belief.interactions += 1
        belief.mastery = CognitiveTracker._compute_mastery(posterior)
        belief.last_updated = datetime.utcnow()
        return belief

    @staticmethod
    def update_from_mcq(
        belief: ConceptBelief,
        correct: bool,
        misconception: str | None = None,
    ) -> ConceptBelief:
        """User answered an MCQ.

        MCQs are designed so that wrong answers reveal specific misconceptions.
        Slip/guess model applies: even someone who knows it might pick wrong,
        and someone who doesn't might guess right.
        """
        prior = belief.p_known
        prior = max(MIN_P_KNOWN, min(MAX_P_KNOWN, prior))

        if correct:
            belief.mcq_correct += 1
            # P(correct | known) = 1 - P(slip)
            # P(correct | unknown) = P(guess)
            p_obs_known = 1 - P_SLIP
            p_obs_unknown = P_GUESS
        else:
            belief.mcq_wrong += 1
            p_obs_known = P_SLIP
            p_obs_unknown = 1 - P_GUESS
            # Record misconception
            if misconception and misconception not in belief.misconceptions:
                belief.misconceptions.append(misconception)
                if len(belief.misconceptions) > 10:
                    belief.misconceptions = belief.misconceptions[-10:]

        # Standard BKT observation update
        numerator = p_obs_known * prior
        denominator = numerator + p_obs_unknown * (1 - prior)
        posterior = numerator / denominator if denominator > 0 else prior
        posterior = max(MIN_P_KNOWN, min(MAX_P_KNOWN, posterior))

        belief.p_known = posterior
        belief.interactions += 1
        belief.mastery = CognitiveTracker._compute_mastery(posterior)
        belief.last_updated = datetime.utcnow()
        return belief

    @staticmethod
    def _compute_mastery(p_known: float) -> MasteryLevel:
        if p_known < STRUGGLING_THRESHOLD:
            return MasteryLevel.STRUGGLING
        if p_known >= MASTERED_THRESHOLD:
            return MasteryLevel.MASTERED
        return MasteryLevel.LEARNING

    @staticmethod
    def should_trigger_mcq(belief: ConceptBelief) -> bool:
        """Emit an MCQ when p_known is in the uncertainty band.

        Below 0.4 → user doesn't know it, don't quiz them yet.
        Above 0.7 → user knows it, don't annoy them.
        Between → perfect moment to verify.
        """
        return 0.4 <= belief.p_known <= 0.7 and belief.interactions >= 2

    @staticmethod
    def should_trigger_spaced_rep(
        belief: ConceptBelief,
        previous_mastery: MasteryLevel,
    ) -> bool:
        """Schedule spaced repetition when concept JUST crossed to mastered."""
        return (
            belief.mastery == MasteryLevel.MASTERED
            and previous_mastery != MasteryLevel.MASTERED
        )

    @staticmethod
    def cross_course_transfer(
        existing_beliefs: dict[str, ConceptBelief],
        new_course_lattice: ConceptLattice,
    ) -> dict[str, ConceptBelief]:
        """Initialize beliefs for a new course, using overlap with existing.

        When a user who mastered LangGraph starts a new Agentic AI course,
        concepts like 'agent' and 'state machine' should start at higher
        p_known than fresh concepts.
        """
        new_beliefs: dict[str, ConceptBelief] = {}

        for concept_id, concept in new_course_lattice.concepts.items():
            # Check if this concept (by name or keyword overlap) exists in
            # the user's existing beliefs
            matched = CognitiveTracker._find_match(
                concept.name, concept.keywords, existing_beliefs
            )
            if matched:
                # Transfer with slight decay — knowledge shouldn't be assumed
                # perfectly portable
                new_belief = CognitiveTracker.initialize_belief(concept_id)
                new_belief.p_known = min(matched.p_known * 0.85, 0.8)
                new_belief.mastery = CognitiveTracker._compute_mastery(
                    new_belief.p_known
                )
                new_beliefs[concept_id] = new_belief
            else:
                new_beliefs[concept_id] = CognitiveTracker.initialize_belief(
                    concept_id
                )

        return new_beliefs

    @staticmethod
    def _find_match(
        name: str,
        keywords: list[str],
        existing: dict[str, ConceptBelief],
    ) -> ConceptBelief | None:
        """Lightweight name/keyword match for cross-course transfer.

        In v4.1 this becomes embedding-similarity; for now, string overlap.
        """
        name_lower = name.lower()
        for cid, belief in existing.items():
            if name_lower in cid.lower() or cid.lower() in name_lower:
                return belief
            for kw in keywords:
                if kw.lower() in cid.lower():
                    return belief
        return None
