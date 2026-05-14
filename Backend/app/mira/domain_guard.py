"""Domain guard — restrict MIRA to AI/ML/DS/SE/Math topics.

Two layers:
  1. Heuristic pre-filter (fast, zero cost) — catches obvious off-topic
  2. System prompt instruction (handled by Claude) — catches subtle drift

This file provides the heuristic filter + the system prompt fragment.

The goal isn't perfect classification — it's to prevent the common abuse
("write my essay", "help with chemistry homework") while staying permissive
on edge cases (cross-disciplinary questions that touch AI).
"""
from __future__ import annotations

import re
from dataclasses import dataclass


# In-scope signals: presence of these increases confidence it's in-scope
IN_SCOPE_KEYWORDS = {
    # ML/AI core
    "neural network", "gradient", "loss", "backprop", "training", "fine-tun",
    "attention", "transformer", "embedding", "token", "llm", "gpt", "claude",
    "overfit", "underfit", "regulariz", "dropout", "batch norm",
    # Data science
    "statistic", "probability", "variance", "mean", "median", "distribution",
    "hypothesis", "p-value", "regression", "classification", "cluster",
    # Software eng
    "function", "class", "variable", "algorithm", "data structure", "recursion",
    "complexity", "big-o", "hash map", "binary tree", "graph traversal",
    "runtime", "compile", "async", "thread", "mutex", "lock", "concurren",
    # Languages / tools
    "python", "java ", "javascript", "typescript", "c++", "rust", "golang",
    "pytorch", "tensorflow", "numpy", "pandas", "sklearn", "keras",
    "docker", "kubernetes", "fastapi", "flask", "django", "react",
    # Math
    "matrix", "vector", "tensor", "eigen", "linear algebra", "calculus",
    "derivative", "integral", "optimizer",
    # DSA (matches explicit DSA vocabulary)
    "dynamic programming", "leetcode", "hackerrank", "complexity analysis",
}


# Clear out-of-scope signals — when matched, politely redirect
OUT_OF_SCOPE_PATTERNS = [
    # Personal / life advice
    r"\bmy (?:girlfriend|boyfriend|wife|husband|crush)\b",
    r"\b(?:love|dating) (?:advice|tips)\b",
    r"\bhoroscope\b",
    r"\bastrology\b",

    # Non-technical homework
    r"\bwrite (?:an? )?(?:essay|poem|story) about\b",
    r"\b(?:literature|history|geography) (?:homework|assignment)\b",

    # Health/medical/legal
    r"\b(?:symptoms?|diagnos|prescription|medicine) for\b",
    r"\bmy doctor\b",
    r"\b(?:legal|lawsuit|sue someone|court case)\b",
    r"\b(?:tax advice|file my taxes)\b",

    # Finance/investment advice
    r"\b(?:should i (?:buy|invest|sell)|stock (?:tip|pick))\b",

    # NSFW / offensive
    r"\b(?:sex|porn|naked|nude)\b",
    r"\b(?:hack|crack|bypass) (?:a |someone|the )\w+ (?:password|account|system)\b",
]


@dataclass(frozen=True)
class DomainCheck:
    in_scope: bool
    reason: str
    redirect_message: str | None


# Redirect messages (used when in_scope is False)
REDIRECT_MESSAGE = (
    "I'm MIRA, Marevlo's AI tutor for technical topics — AI/ML, data science, "
    "programming, DSA, software engineering, and math. I can't help with this "
    "particular question, but if there's a technical angle you'd like me to "
    "explore, I'm happy to go deep."
)


def check_question(question: str) -> DomainCheck:
    """Return DomainCheck. Err on the side of ALLOW — the LLM system prompt
    is our second layer."""
    q_lower = question.lower().strip()

    if not q_lower:
        return DomainCheck(in_scope=False, reason="empty question", redirect_message=REDIRECT_MESSAGE)

    # Out-of-scope patterns = hard block
    for pattern in OUT_OF_SCOPE_PATTERNS:
        if re.search(pattern, q_lower):
            return DomainCheck(
                in_scope=False,
                reason=f"matched out-of-scope pattern: {pattern}",
                redirect_message=REDIRECT_MESSAGE,
            )

    # In-scope keyword hit = clear allow
    for keyword in IN_SCOPE_KEYWORDS:
        if keyword in q_lower:
            return DomainCheck(in_scope=True, reason=f"matched in-scope keyword: {keyword}", redirect_message=None)

    # Ambiguous — allow, let the LLM system prompt be the judge
    return DomainCheck(
        in_scope=True,
        reason="ambiguous, defaulting to allow (LLM will enforce domain)",
        redirect_message=None,
    )


DOMAIN_GUARD_SYSTEM_PROMPT = """You are MIRA, Marevlo's AI tutor specializing in:
- Artificial Intelligence / Machine Learning / Deep Learning
- Natural Language Processing / Computer Vision / Reinforcement Learning
- Generative AI / LLMs / Agentic AI / RAG
- Data Science / Statistics / Probability
- Software Engineering / Algorithms / Data Structures
- Mathematics relevant to the above

IF the user asks about anything outside these domains (personal life, medical
advice, legal questions, non-technical homework, celebrity gossip, etc):
- Politely redirect them back to technical topics
- Offer to help with any technical angle of their question
- Do NOT attempt to answer the off-topic part

Stay on topic. Be warm but firm."""
