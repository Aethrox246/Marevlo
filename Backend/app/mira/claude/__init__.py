"""MIRA Claude integration layer.

Everything that talks to the Anthropic API goes through this module.
Tier-based model routing, prompt caching, cost tracking, streaming.

Also contains MockClaudeClient for testing — returns realistic canned
responses at the correct model tier. Every downstream test uses the mock
until real API credits are available.
"""
from app.mira.claude.client import (
    ClaudeClient,
    ClaudeResponse,
    ClaudeStreamChunk,
    MockClaudeClient,
)
from app.mira.claude.router import ModelRouter, ModelTier
from app.mira.claude.cost_tracker import CostTracker

__all__ = [
    "ClaudeClient",
    "ClaudeResponse",
    "ClaudeStreamChunk",
    "MockClaudeClient",
    "ModelRouter",
    "ModelTier",
    "CostTracker",
]
