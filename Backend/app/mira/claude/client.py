"""Claude API client — real + mock.

Two implementations share the same interface:

  1. ClaudeClient      — real calls to Anthropic API (requires API key)
  2. MockClaudeClient  — canned responses, works offline

Every downstream MIRA module takes a client via dependency injection.
In production we inject ClaudeClient. In tests we inject MockClaudeClient.
When the user buys API credits, the ONLY change is which class gets
instantiated at startup.

The mock is DELIBERATELY realistic:
  - Responses are tier-appropriate in length and depth
  - Streaming chunks emit at realistic intervals
  - Token counts reflect actual sizes
  - Latency is simulated (first-token ~800ms, full ~2.5s)

This lets us validate cognitive tracker updates, cost calculations,
and conversation flow end-to-end without spending a rupee.
"""
from __future__ import annotations

import asyncio
import hashlib
import json
import random
import time
from abc import ABC, abstractmethod
from dataclasses import dataclass, field
from typing import AsyncIterator

from app.mira.claude.router import ModelRouter, ModelTier


# ===========================================================================
# SHARED TYPES
# ===========================================================================

@dataclass
class ClaudeStreamChunk:
    """One streaming chunk. Matches Anthropic SDK shape we care about."""
    type: str  # "content_block_delta" | "message_stop" | "usage"
    text: str = ""
    tokens_so_far_in: int = 0
    tokens_so_far_out: int = 0


@dataclass
class ClaudeResponse:
    """Final assembled response from a streaming or non-streaming call."""
    content: str
    model: str
    stop_reason: str
    fresh_input_tokens: int
    cached_input_tokens: int
    output_tokens: int
    latency_ms: int
    # Cost is computed by cost_tracker at the router layer


@dataclass
class CachedPrefix:
    """A prompt section marked for caching. Anthropic caches the first
    up-to-4 prefix blocks you tag with cache_control."""
    text: str


@dataclass
class ClaudeMessage:
    """One message in the conversation."""
    role: str  # "user" | "assistant"
    content: str


# ===========================================================================
# ABSTRACT BASE
# ===========================================================================
class ClaudeClientBase(ABC):
    """Interface every concrete client implements."""

    @abstractmethod
    async def complete(
        self,
        *,
        system: str,
        messages: list[ClaudeMessage],
        model_tier: ModelTier,
        cached_prefix: list[CachedPrefix] | None = None,
        max_tokens: int = 1024,
        temperature: float = 0.7,
    ) -> ClaudeResponse:
        """Non-streaming completion. Returns full response at once."""

    @abstractmethod
    def stream(
        self,
        *,
        system: str,
        messages: list[ClaudeMessage],
        model_tier: ModelTier,
        cached_prefix: list[CachedPrefix] | None = None,
        max_tokens: int = 1024,
        temperature: float = 0.7,
    ) -> AsyncIterator[ClaudeStreamChunk]:
        """Streaming completion. Yields chunks as they arrive."""

    @abstractmethod
    async def complete_structured(
        self,
        *,
        system: str,
        messages: list[ClaudeMessage],
        model_tier: ModelTier,
        schema_hint: str,
        cached_prefix: list[CachedPrefix] | None = None,
        max_tokens: int = 1024,
    ) -> tuple[dict, ClaudeResponse]:
        """Completion expected to return JSON. Returns (parsed_dict, response)."""


# ===========================================================================
# REAL CLAUDE CLIENT
# ===========================================================================
class ClaudeClient(ClaudeClientBase):
    """Production implementation. Uses the `anthropic` Python SDK.

    This file has NO import of `anthropic` at module load — the import
    happens inside methods so MockClaudeClient works without the package
    installed. When you `pip install anthropic`, real client works too.
    """

    def __init__(self, api_key: str):
        self.api_key = api_key
        self._client = None

    def _ensure_client(self):
        if self._client is None:
            # Lazy import so the module can be used without anthropic installed
            from anthropic import AsyncAnthropic
            self._client = AsyncAnthropic(api_key=self.api_key)
        return self._client

    async def complete(
        self,
        *,
        system: str,
        messages: list[ClaudeMessage],
        model_tier: ModelTier,
        cached_prefix: list[CachedPrefix] | None = None,
        max_tokens: int = 1024,
        temperature: float = 0.7,
    ) -> ClaudeResponse:
        start = time.monotonic()
        client = self._ensure_client()
        model_string = ModelRouter.resolve_model_string(model_tier)

        system_blocks = self._build_system_blocks(system, cached_prefix)
        message_blocks = [
            {"role": m.role, "content": m.content} for m in messages
        ]

        resp = await client.messages.create(
            model=model_string,
            system=system_blocks,
            messages=message_blocks,
            max_tokens=max_tokens,
            temperature=temperature,
        )

        latency_ms = int((time.monotonic() - start) * 1000)

        # Extract text content
        text = ""
        for block in resp.content:
            if block.type == "text":
                text += block.text

        usage = resp.usage
        return ClaudeResponse(
            content=text,
            model=model_string,
            stop_reason=resp.stop_reason or "end_turn",
            fresh_input_tokens=getattr(usage, "input_tokens", 0)
            - getattr(usage, "cache_read_input_tokens", 0),
            cached_input_tokens=getattr(usage, "cache_read_input_tokens", 0),
            output_tokens=getattr(usage, "output_tokens", 0),
            latency_ms=latency_ms,
        )

    async def stream(
        self,
        *,
        system: str,
        messages: list[ClaudeMessage],
        model_tier: ModelTier,
        cached_prefix: list[CachedPrefix] | None = None,
        max_tokens: int = 1024,
        temperature: float = 0.7,
    ) -> AsyncIterator[ClaudeStreamChunk]:
        client = self._ensure_client()
        model_string = ModelRouter.resolve_model_string(model_tier)
        system_blocks = self._build_system_blocks(system, cached_prefix)
        message_blocks = [
            {"role": m.role, "content": m.content} for m in messages
        ]

        tokens_in = 0
        tokens_out = 0

        async with client.messages.stream(
            model=model_string,
            system=system_blocks,
            messages=message_blocks,
            max_tokens=max_tokens,
            temperature=temperature,
        ) as stream:
            async for event in stream:
                if event.type == "content_block_delta" and hasattr(
                    event.delta, "text"
                ):
                    tokens_out += len(event.delta.text.split())  # approx
                    yield ClaudeStreamChunk(
                        type="content_block_delta",
                        text=event.delta.text,
                        tokens_so_far_in=tokens_in,
                        tokens_so_far_out=tokens_out,
                    )
                elif event.type == "message_stop":
                    yield ClaudeStreamChunk(
                        type="message_stop",
                        tokens_so_far_in=tokens_in,
                        tokens_so_far_out=tokens_out,
                    )

    async def complete_structured(
        self,
        *,
        system: str,
        messages: list[ClaudeMessage],
        model_tier: ModelTier,
        schema_hint: str,
        cached_prefix: list[CachedPrefix] | None = None,
        max_tokens: int = 1024,
    ) -> tuple[dict, ClaudeResponse]:
        # Augment system prompt to request strict JSON
        augmented_system = (
            system
            + "\n\nYou MUST respond with valid JSON matching this schema:\n"
            + schema_hint
            + "\n\nReturn ONLY the JSON object. No markdown, no prose outside JSON."
        )
        resp = await self.complete(
            system=augmented_system,
            messages=messages,
            model_tier=model_tier,
            cached_prefix=cached_prefix,
            max_tokens=max_tokens,
            temperature=0.0,  # deterministic for structured output
        )
        # Parse — be defensive about markdown wrapping
        raw = resp.content.strip()
        if raw.startswith("```"):
            raw = raw.strip("`").lstrip("json").strip()
        parsed = json.loads(raw)
        return parsed, resp

    def _build_system_blocks(
        self,
        system: str,
        cached_prefix: list[CachedPrefix] | None,
    ) -> list[dict]:
        """Anthropic format: list of content blocks, some with cache_control."""
        blocks = []
        if cached_prefix:
            for prefix in cached_prefix:
                blocks.append({
                    "type": "text",
                    "text": prefix.text,
                    "cache_control": {"type": "ephemeral"},
                })
        if system:
            blocks.append({"type": "text", "text": system})
        return blocks


# ===========================================================================
# MOCK CLAUDE CLIENT
# ===========================================================================
@dataclass
class MockResponsePlan:
    """Test can pre-register a response for a specific prompt."""
    prompt_contains: str
    response_haiku: str
    response_sonnet: str | None = None  # falls back to haiku response if None


class MockClaudeClient(ClaudeClientBase):
    """Deterministic fake Claude.

    Two modes:
      - If a registered plan matches the prompt, return the planned response
      - Otherwise, return a generic tier-appropriate response

    Records every call for test inspection.
    """

    def __init__(self, seed: int = 42, simulate_latency: bool = False):
        self._plans: list[MockResponsePlan] = []
        self._calls: list[dict] = []
        self._rng = random.Random(seed)
        self.simulate_latency = simulate_latency

    # -- plan registration --
    def register_response(
        self,
        prompt_contains: str,
        response_haiku: str,
        response_sonnet: str | None = None,
    ):
        """Tests call this before exercising MIRA to pre-stage responses."""
        self._plans.append(
            MockResponsePlan(
                prompt_contains=prompt_contains,
                response_haiku=response_haiku,
                response_sonnet=response_sonnet,
            )
        )

    def clear_plans(self):
        self._plans.clear()

    @property
    def calls(self) -> list[dict]:
        """Every call made against this mock, for test inspection."""
        return list(self._calls)

    # -- main interface --
    async def complete(
        self,
        *,
        system: str,
        messages: list[ClaudeMessage],
        model_tier: ModelTier,
        cached_prefix: list[CachedPrefix] | None = None,
        max_tokens: int = 1024,
        temperature: float = 0.7,
    ) -> ClaudeResponse:
        text = self._resolve_response(messages, model_tier, system)
        usage = self._fake_usage(system, messages, text, cached_prefix, model_tier)
        self._record_call(
            system, messages, model_tier, cached_prefix, text, usage
        )
        if self.simulate_latency:
            await asyncio.sleep(0.1)
        return ClaudeResponse(
            content=text,
            model=ModelRouter.resolve_model_string(model_tier),
            stop_reason="end_turn",
            fresh_input_tokens=usage["fresh_input"],
            cached_input_tokens=usage["cached_input"],
            output_tokens=usage["output"],
            latency_ms=2500 if model_tier == ModelTier.SONNET else 900,
        )

    async def stream(
        self,
        *,
        system: str,
        messages: list[ClaudeMessage],
        model_tier: ModelTier,
        cached_prefix: list[CachedPrefix] | None = None,
        max_tokens: int = 1024,
        temperature: float = 0.7,
    ) -> AsyncIterator[ClaudeStreamChunk]:
        text = self._resolve_response(messages, model_tier, system)
        usage = self._fake_usage(system, messages, text, cached_prefix, model_tier)
        self._record_call(
            system, messages, model_tier, cached_prefix, text, usage
        )

        # Break text into ~3-word chunks to simulate streaming
        words = text.split()
        tokens_out = 0
        buf = []
        chunk_size = 3
        for i, word in enumerate(words):
            buf.append(word)
            if (i + 1) % chunk_size == 0:
                chunk = " ".join(buf) + " "
                buf.clear()
                tokens_out += chunk_size
                if self.simulate_latency:
                    await asyncio.sleep(0.02)
                yield ClaudeStreamChunk(
                    type="content_block_delta",
                    text=chunk,
                    tokens_so_far_in=usage["fresh_input"] + usage["cached_input"],
                    tokens_so_far_out=tokens_out,
                )
        # Flush remaining
        if buf:
            tokens_out += len(buf)
            yield ClaudeStreamChunk(
                type="content_block_delta",
                text=" ".join(buf),
                tokens_so_far_in=usage["fresh_input"] + usage["cached_input"],
                tokens_so_far_out=tokens_out,
            )

        yield ClaudeStreamChunk(
            type="message_stop",
            tokens_so_far_in=usage["fresh_input"] + usage["cached_input"],
            tokens_so_far_out=usage["output"],
        )

    async def complete_structured(
        self,
        *,
        system: str,
        messages: list[ClaudeMessage],
        model_tier: ModelTier,
        schema_hint: str,
        cached_prefix: list[CachedPrefix] | None = None,
        max_tokens: int = 1024,
    ) -> tuple[dict, ClaudeResponse]:
        """Generate a deterministic structured response.

        Tests register JSON plans via register_response() with valid JSON text.
        If no plan matches, return a shaped default.
        """
        text = self._resolve_response(messages, model_tier, system)
        # If the text is already JSON, parse it
        try:
            parsed = json.loads(text)
        except json.JSONDecodeError:
            # Default structured shape for unregistered calls
            parsed = self._default_structured(schema_hint)
            text = json.dumps(parsed)

        usage = self._fake_usage(system, messages, text, cached_prefix, model_tier)
        self._record_call(
            system, messages, model_tier, cached_prefix, text, usage
        )
        resp = ClaudeResponse(
            content=text,
            model=ModelRouter.resolve_model_string(model_tier),
            stop_reason="end_turn",
            fresh_input_tokens=usage["fresh_input"],
            cached_input_tokens=usage["cached_input"],
            output_tokens=usage["output"],
            latency_ms=1000,
        )
        return parsed, resp

    # -- internals --
    def _resolve_response(
        self,
        messages: list[ClaudeMessage],
        model_tier: ModelTier,
        system: str,
    ) -> str:
        """Find matching plan or return generic tier-appropriate response."""
        last_user_msg = ""
        for m in reversed(messages):
            if m.role == "user":
                last_user_msg = m.content
                break

        # Check plans in order — first match wins
        search_text = (last_user_msg + " " + system).lower()
        for plan in self._plans:
            if plan.prompt_contains.lower() in search_text:
                if model_tier == ModelTier.SONNET and plan.response_sonnet:
                    return plan.response_sonnet
                return plan.response_haiku

        # No plan — return a generic tutor response calibrated to model tier
        return self._generic_response(last_user_msg, model_tier)

    def _generic_response(self, user_msg: str, model_tier: ModelTier) -> str:
        """Tier-appropriate filler response so downstream systems see realistic
        token counts and content shape."""
        if model_tier == ModelTier.HAIKU:
            return (
                f"Here's a direct explanation of what you asked. "
                f"The question was about: {user_msg[:50]}. "
                f"The short answer is that this topic involves three key pieces: "
                f"the core concept, how it works in practice, and when to use it. "
                f"Does that help, or do you want me to go deeper on any piece?"
            )
        # Sonnet: longer, more structured
        return (
            f"Let me work through this carefully.\n\n"
            f"Your question touches on: {user_msg[:60]}.\n\n"
            f"There are actually three lenses to look at this through. "
            f"First, the foundational definition: the core object is defined "
            f"by its algebraic properties and how it composes with other objects "
            f"in the system. Second, the operational view: in practice you "
            f"interact with this through specific operations that preserve "
            f"invariants. Third, and most interesting, is how this object "
            f"behaves at the boundaries — edge cases, failure modes, where the "
            f"abstraction leaks.\n\n"
            f"Would you like me to work a concrete example, show the math, "
            f"or compare it to alternatives you may already know?"
        )

    def _default_structured(self, schema_hint: str) -> dict:
        """Produce a minimal dict that vaguely matches common MIRA schemas."""
        if "score" in schema_hint.lower() or "criterion" in schema_hint.lower():
            return {
                "per_criterion_scores": {"C1": 70, "C2": 75},
                "overall_score": 72,
                "passed": True,
                "feedback": "Solid answer, shows understanding of the core.",
                "concerns": [],
            }
        if "concept" in schema_hint.lower():
            return {
                "concepts": [
                    {
                        "id": "generic-concept",
                        "name": "Generic Concept",
                        "description": "placeholder",
                        "prerequisites": [],
                        "keywords": [],
                    }
                ],
            }
        return {"ok": True}

    def _fake_usage(
        self,
        system: str,
        messages: list[ClaudeMessage],
        output: str,
        cached_prefix: list[CachedPrefix] | None,
        model_tier: ModelTier,
    ) -> dict[str, int]:
        """Approximate token counts so cost_tracker produces realistic numbers."""
        # ~4 characters per token
        cached_chars = sum(len(p.text) for p in cached_prefix or [])
        fresh_chars = len(system) + sum(len(m.content) for m in messages)
        output_chars = len(output)
        return {
            "fresh_input": max(1, fresh_chars // 4),
            "cached_input": cached_chars // 4,
            "output": max(1, output_chars // 4),
        }

    def _record_call(
        self,
        system,
        messages,
        model_tier,
        cached_prefix,
        output,
        usage,
    ):
        # Keep a fingerprint of the call for test assertions
        message_digest = hashlib.sha256(
            json.dumps([m.content for m in messages]).encode()
        ).hexdigest()[:12]
        self._calls.append({
            "model_tier": model_tier.value,
            "model_string": ModelRouter.resolve_model_string(model_tier),
            "system_len": len(system),
            "num_messages": len(messages),
            "last_user_msg": messages[-1].content if messages else "",
            "cached_prefix_count": len(cached_prefix) if cached_prefix else 0,
            "output_preview": output[:100],
            "tokens": usage,
            "message_digest": message_digest,
        })
