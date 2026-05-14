"""Concept matcher — map a user question to concept IDs in a lattice.

Given a question and a ConceptLattice, find which concepts are relevant.
Two matching signals:
  1. Direct name match: question contains concept name/alias
  2. Keyword match: question contains keywords associated with concept

Results ranked by match strength. Caller uses top 1-3 concepts to scope
the retrieval step and determine which beliefs to update.

No LLM calls in this file. Testable with synthetic lattices.
"""
from __future__ import annotations

import re
from dataclasses import dataclass

from app.mira.models.schemas import Concept, ConceptLattice


@dataclass(frozen=True)
class ConceptMatch:
    concept_id: str
    score: float          # 0..10+ — higher = stronger match
    matched_on: list[str]  # which tokens matched


class ConceptMatcher:
    """Map question → concept_ids via name + keyword matching.

    In v4.1 this becomes embedding-based (ingestion pipeline already
    creates embeddings). For now, deterministic string overlap.
    """

    # Scoring weights
    NAME_EXACT_SCORE = 10.0
    NAME_PARTIAL_SCORE = 5.0
    KEYWORD_SCORE = 2.0

    # Minimum score to consider a concept "matched"
    MATCH_THRESHOLD = 2.0

    @staticmethod
    def match(
        question: str,
        lattice: ConceptLattice,
        top_k: int = 3,
    ) -> list[ConceptMatch]:
        """Return top_k concepts matching the question, ranked by score."""
        q = ConceptMatcher._normalize(question)
        matches: list[ConceptMatch] = []

        for concept_id, concept in lattice.concepts.items():
            score, reasons = ConceptMatcher._score_concept(q, concept)
            if score >= ConceptMatcher.MATCH_THRESHOLD:
                matches.append(
                    ConceptMatch(
                        concept_id=concept_id,
                        score=score,
                        matched_on=reasons,
                    )
                )

        matches.sort(key=lambda m: m.score, reverse=True)
        return matches[:top_k]

    @staticmethod
    def _score_concept(
        question_norm: str,
        concept: Concept,
    ) -> tuple[float, list[str]]:
        """Score one concept against a normalized question."""
        score = 0.0
        reasons: list[str] = []

        # 1. Name exact match (word boundary)
        name_norm = ConceptMatcher._normalize(concept.name)
        if ConceptMatcher._contains_phrase(question_norm, name_norm):
            score += ConceptMatcher.NAME_EXACT_SCORE
            reasons.append(f"name:{concept.name}")

        # 2. Name partial match (any name token in question)
        name_tokens = ConceptMatcher._tokenize(name_norm)
        if len(name_tokens) > 1:
            # Multi-word names: require at least half the tokens matched
            matched_tokens = [t for t in name_tokens if t in question_norm]
            if len(matched_tokens) >= max(1, len(name_tokens) // 2):
                if f"name:{concept.name}" not in reasons:
                    score += ConceptMatcher.NAME_PARTIAL_SCORE
                    reasons.append(f"name-partial:{','.join(matched_tokens)}")

        # 3. Keyword matches
        for kw in concept.keywords:
            kw_norm = ConceptMatcher._normalize(kw)
            if ConceptMatcher._contains_phrase(question_norm, kw_norm):
                score += ConceptMatcher.KEYWORD_SCORE
                reasons.append(f"kw:{kw}")

        return score, reasons

    @staticmethod
    def _normalize(text: str) -> str:
        """Lowercase, strip extra whitespace, remove most punctuation."""
        text = text.lower().strip()
        text = re.sub(r"[^\w\s-]", " ", text)
        text = re.sub(r"\s+", " ", text)
        return text

    @staticmethod
    def _tokenize(text: str) -> list[str]:
        """Simple whitespace tokenization of a normalized string.

        Filters out stopwords (too common to be useful for matching).
        """
        stopwords = {
            "the", "a", "an", "is", "are", "was", "were", "of", "in",
            "on", "at", "to", "for", "by", "with", "and", "or", "but",
            "how", "what", "why", "when", "where", "does", "do", "can",
            "this", "that", "these", "those", "i", "you", "it", "my",
        }
        return [
            t for t in text.split()
            if t and t not in stopwords and len(t) > 1
        ]

    @staticmethod
    def _contains_phrase(text: str, phrase: str) -> bool:
        """Check if text contains phrase with word boundaries.

        'gradient descent' matches in 'stochastic gradient descent' but
        not in 'gradient-descent-method' (with hyphens normalized out).
        """
        if not phrase or not text:
            return False
        # Both are already normalized; do word-boundary regex
        pattern = r"\b" + re.escape(phrase) + r"\b"
        return bool(re.search(pattern, text))

    @staticmethod
    def fallback_concepts(
        lattice: ConceptLattice,
        user_beliefs: dict[str, float],
        top_k: int = 3,
    ) -> list[ConceptMatch]:
        """When question matches nothing, return concepts the user is
        currently weakest on (p_known in 0.2..0.6).

        These are the concepts MIRA should focus on even with a vague
        question like "I'm confused about everything".
        """
        candidates: list[tuple[str, float]] = [
            (cid, p)
            for cid, p in user_beliefs.items()
            if cid in lattice.concepts and 0.2 <= p <= 0.6
        ]
        # Sort by distance from 0.5 (maximum uncertainty)
        candidates.sort(key=lambda x: abs(x[1] - 0.5))

        return [
            ConceptMatch(
                concept_id=cid,
                score=0.5,  # low confidence, fallback
                matched_on=["fallback:uncertain-belief"],
            )
            for cid, _ in candidates[:top_k]
        ]
