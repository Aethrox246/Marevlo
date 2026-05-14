"""Question depth classifier.

Classifies a user question along Bloom's taxonomy into one of 5 levels:
  - SURFACE: "What is X?" / definition-seeking
  - STRUCTURAL: "How does X work?" / mechanism-seeking
  - RELATIONAL: "How does X relate to Y?" / connection-seeking
  - EVALUATIVE: "When should I use X vs Y?" / judgment-seeking
  - CREATIVE: "How would I build a new X?" / application-seeking

Strategy: heuristic first (fast, zero-cost, deterministic). If confidence
is low, fall back to Claude Haiku classification. In this file we expose
the heuristic; the LLM fallback is invoked by the consumer if needed.

No LLM call in this file. Testable deterministically.
"""
from __future__ import annotations

import re
from dataclasses import dataclass

from app.mira.models.schemas import QuestionDepth


@dataclass(frozen=True)
class DepthClassification:
    depth: QuestionDepth
    confidence: float  # 0..1
    reason: str


# -----------------------------------------------------------------------------
# Heuristic patterns — ordered by specificity (later rules override earlier)
# -----------------------------------------------------------------------------

# CREATIVE: novel construction / "I want to build..."
_CREATIVE_PATTERNS = [
    r"\bbuild\s+(?:a\s+)?(?:new|my\s+own|custom)\b",
    r"\bhow\s+would\s+i\s+(?:design|implement|build|create)\b",
    r"\b(?:design|create)\s+(?:a|an|my)\b.*\b(?:system|architecture|framework|optimizer|model|algorithm)\b",
    r"\bcombine\s+\w+\s+(?:and|with)\s+\w+\s+(?:to|for)\b",
    r"\bextend\s+(?:this|the)\b.*\bto\b",
    r"\bwhat if i (?:wanted to|could)\b",
    r"\bi\s+want\s+to\s+(?:build|design|create|implement)\b",
]

# EVALUATIVE: comparison + judgment
_EVALUATIVE_PATTERNS = [
    r"\bwhich is better\b",
    r"\b(?:when|why) should i (?:use|choose|pick)\b",
    r"\bvs\.?\s+\w+\b.*\?",
    r"\btrade[- ]?offs? (?:between|of)\b",
    r"\bpros and cons\b",
    r"\bbetter than\b",
    r"\bworse than\b",
    r"\bcompare\b",
    r"\bcritique\b",
]

# RELATIONAL: relationships / connections
_RELATIONAL_PATTERNS = [
    r"\brelate(?:d|s)?\s+to\b",
    r"\bhow does .+ (?:affect|influence|impact)\b",
    r"\bconnection between\b",
    r"\bwhy does .+ (?:work|cause|lead to|help|matter|improve|enable)\b",
    r"\bhow is .+ (?:similar to|different from|like)\b",
    r"\bin what way\b",
    r"\bunderlying (?:reason|principle|mechanism)\b",
    r"\bwhy is .+ (?:important|necessary|useful|better)\b",
]

# STRUCTURAL: how it works
_STRUCTURAL_PATTERNS = [
    r"\bhow does .+ work\b",
    r"\bhow (?:do|can) i (?:implement|use|apply)\b",
    r"\bwhat (?:are the )?steps?\b",
    r"\b(?:algorithm|procedure|process) (?:for|of)\b",
    r"\bunder the hood\b",
    r"\binternals? of\b",
    r"\bhow is .+ (?:computed|calculated|built)\b",
]

# SURFACE: basic definitions
_SURFACE_PATTERNS = [
    r"^\s*what is\b",
    r"^\s*what are\b",
    r"^\s*define\b",
    r"^\s*meaning of\b",
    r"^\s*explain\b(?! (?:why|how))",  # "explain" alone, not "explain why/how"
    r"^\s*tell me about\b",
    r"^\s*what does\b.*\bmean\b",
]


class DepthClassifier:
    """Heuristic Bloom's classifier.

    Runs all pattern groups, picks the HIGHEST matched level.
    If nothing matches, returns SURFACE with low confidence
    (caller may choose LLM fallback).
    """

    @staticmethod
    def classify(question: str) -> DepthClassification:
        q = question.lower().strip()

        # Check from highest to lowest depth
        # (we want the highest level that matches)
        if DepthClassifier._any_match(q, _CREATIVE_PATTERNS):
            return DepthClassification(
                depth=QuestionDepth.CREATIVE,
                confidence=0.85,
                reason="novel construction language detected",
            )
        if DepthClassifier._any_match(q, _EVALUATIVE_PATTERNS):
            return DepthClassification(
                depth=QuestionDepth.EVALUATIVE,
                confidence=0.85,
                reason="comparison/judgment language detected",
            )
        if DepthClassifier._any_match(q, _RELATIONAL_PATTERNS):
            return DepthClassification(
                depth=QuestionDepth.RELATIONAL,
                confidence=0.80,
                reason="relational/causal language detected",
            )
        if DepthClassifier._any_match(q, _STRUCTURAL_PATTERNS):
            return DepthClassification(
                depth=QuestionDepth.STRUCTURAL,
                confidence=0.80,
                reason="mechanism-seeking language detected",
            )
        if DepthClassifier._any_match(q, _SURFACE_PATTERNS):
            return DepthClassification(
                depth=QuestionDepth.SURFACE,
                confidence=0.85,
                reason="definition-seeking language detected",
            )

        # Nothing clear matched — default to STRUCTURAL at low confidence
        # (most questions in tutoring are "how does X work"-shaped even
        # without explicit markers). Low confidence means caller may choose
        # to escalate to LLM classification.
        return DepthClassification(
            depth=QuestionDepth.STRUCTURAL,
            confidence=0.35,
            reason="no clear pattern, defaulting to structural",
        )

    @staticmethod
    def _any_match(text: str, patterns: list[str]) -> bool:
        for p in patterns:
            if re.search(p, text):
                return True
        return False

    @staticmethod
    def needs_llm_fallback(classification: DepthClassification) -> bool:
        """Should the caller invoke Claude Haiku to re-classify?"""
        return classification.confidence < 0.6


# -----------------------------------------------------------------------------
# LLM fallback — caller invokes this if needs_llm_fallback is True
# -----------------------------------------------------------------------------
# This function just BUILDS the prompt. The actual Claude call happens
# in app.mira.claude.client (to keep this module LLM-free for testing).

LLM_CLASSIFICATION_PROMPT = """You are classifying a student question along Bloom's taxonomy.

Return exactly one of these labels (no explanation):
- SURFACE (asking for a definition or basic fact)
- STRUCTURAL (asking how something works mechanically)
- RELATIONAL (asking about relationships between concepts)
- EVALUATIVE (asking to compare, judge, or choose between options)
- CREATIVE (asking to build, design, or apply in a novel way)

Question: {question}

Label:"""


def build_llm_fallback_prompt(question: str) -> str:
    """The prompt a caller would send to Claude Haiku for re-classification."""
    return LLM_CLASSIFICATION_PROMPT.format(question=question)


def parse_llm_response(response: str) -> QuestionDepth:
    """Parse Claude's one-word response into a QuestionDepth enum.

    Defensive: Claude sometimes adds punctuation or a trailing period.
    """
    cleaned = response.strip().upper().rstrip(".").split()[0] if response.strip() else ""
    mapping = {
        "SURFACE": QuestionDepth.SURFACE,
        "STRUCTURAL": QuestionDepth.STRUCTURAL,
        "RELATIONAL": QuestionDepth.RELATIONAL,
        "EVALUATIVE": QuestionDepth.EVALUATIVE,
        "CREATIVE": QuestionDepth.CREATIVE,
    }
    return mapping.get(cleaned, QuestionDepth.STRUCTURAL)
