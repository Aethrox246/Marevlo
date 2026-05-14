"""Groq client — Llama 3.3 70B via Groq's free tier.

Implements the same ClaudeClientBase interface as ClaudeClient so it's a
drop-in swap at app startup. Behavioral differences from Claude documented
below.

Free tier limits (as of April 2026):
  - 30 requests/minute
  - 14,400 requests/day
  - 6,000 tokens/minute for Llama 3.3 70B

Differences from Claude:
  - No native prompt caching (cached_prefix is sent as regular input)
  - No vision support on Llama 3.3 70B
  - Structured output: Llama sometimes returns JSON wrapped in markdown code
    fences or with leading prose — we parse defensively
  - Slightly shorter default responses; may want to raise max_tokens
  - Follows system prompts well but occasionally adds meta-commentary
    ("Sure, here's an answer...")

Environment:
  GROQ_API_KEY — get from https://console.groq.com (free)

Usage:
  from app.mira.claude.groq_client import GroqClient
  client = GroqClient(api_key=os.environ["GROQ_API_KEY"])
  # Same interface as ClaudeClient
"""
from __future__ import annotations

import json
import re
import time
from dataclasses import asdict
from typing import AsyncIterator

from app.mira.claude.client import (
    CachedPrefix,
    ClaudeClientBase,
    ClaudeMessage,
    ClaudeResponse,
    ClaudeStreamChunk,
)
from app.mira.claude.router import ModelTier


# Map our ModelTier → Groq model IDs
# Llama 3.3 70B handles both Haiku-tier and Sonnet-tier in pilot.
# Different models would require separate prompt tuning, so we keep it simple.
GROQ_MODEL_STRINGS = {
    ModelTier.HAIKU: "llama-3.3-70b-versatile",
    ModelTier.SONNET: "llama-3.3-70b-versatile",
}


class GroqClient(ClaudeClientBase):
    """Groq-backed implementation. Same interface as ClaudeClient."""

    def __init__(self, api_key: str):
        self.api_key = api_key
        self._client = None

    def _get_client(self):
        if self._client is None:
            # groq SDK is OpenAI-compatible; we use the official groq package
            from groq import AsyncGroq
            self._client = AsyncGroq(api_key=self.api_key)
        return self._client

    # ----------------------------------------------------------------------
    # complete()
    # ----------------------------------------------------------------------
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
        client = self._get_client()
        model_string = GROQ_MODEL_STRINGS[model_tier]

        # Assemble system prompt: prepend cached_prefix blocks as plain text
        full_system = self._assemble_system(system, cached_prefix)

        # Groq uses OpenAI-style message format
        msg_list = [{"role": "system", "content": full_system}]
        for m in messages:
            msg_list.append({"role": m.role, "content": m.content})

        resp = await client.chat.completions.create(
            model=model_string,
            messages=msg_list,
            max_tokens=max_tokens,
            temperature=temperature,
        )

        latency_ms = int((time.monotonic() - start) * 1000)
        text = resp.choices[0].message.content or ""
        stop_reason = resp.choices[0].finish_reason or "end_turn"

        # Groq returns prompt_tokens + completion_tokens (no cache distinction)
        usage = resp.usage
        input_tokens = getattr(usage, "prompt_tokens", 0) if usage else 0
        output_tokens = getattr(usage, "completion_tokens", 0) if usage else 0

        return ClaudeResponse(
            content=text,
            model=f"groq/{model_string}",
            stop_reason=stop_reason,
            fresh_input_tokens=input_tokens,  # No cache split on Groq
            cached_input_tokens=0,
            output_tokens=output_tokens,
            latency_ms=latency_ms,
        )

    # ----------------------------------------------------------------------
    # stream()
    # ----------------------------------------------------------------------
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
        client = self._get_client()
        model_string = GROQ_MODEL_STRINGS[model_tier]
        full_system = self._assemble_system(system, cached_prefix)

        msg_list = [{"role": "system", "content": full_system}]
        for m in messages:
            msg_list.append({"role": m.role, "content": m.content})

        tokens_in = 0  # Groq doesn't give token counts mid-stream
        tokens_out = 0

        stream = await client.chat.completions.create(
            model=model_string,
            messages=msg_list,
            max_tokens=max_tokens,
            temperature=temperature,
            stream=True,
        )
        async for chunk in stream:
            if not chunk.choices:
                continue
            delta = chunk.choices[0].delta
            if delta and delta.content:
                tokens_out += max(1, len(delta.content.split()))
                yield ClaudeStreamChunk(
                    type="content_block_delta",
                    text=delta.content,
                    tokens_so_far_in=tokens_in,
                    tokens_so_far_out=tokens_out,
                )
            if chunk.choices[0].finish_reason:
                yield ClaudeStreamChunk(
                    type="message_stop",
                    tokens_so_far_in=tokens_in,
                    tokens_so_far_out=tokens_out,
                )

    # ----------------------------------------------------------------------
    # complete_structured()
    # ----------------------------------------------------------------------
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
        """Structured JSON output. Llama is less reliable than Claude at this,
        so we: (a) strongly instruct it, (b) parse defensively, (c) retry once
        on parse failure with a repair prompt."""

        strict_instruction = (
            "\n\n# OUTPUT FORMAT — CRITICAL\n"
            "You MUST respond with ONLY valid JSON matching this schema:\n"
            f"{schema_hint}\n"
            "Do NOT wrap in markdown code fences. "
            "Do NOT add prose before or after the JSON. "
            "Start your response with '{' and end with '}'."
        )
        augmented_system = system + strict_instruction

        resp = await self.complete(
            system=augmented_system,
            messages=messages,
            model_tier=model_tier,
            cached_prefix=cached_prefix,
            max_tokens=max_tokens,
            temperature=0.0,
        )

        parsed = self._parse_json_defensively(resp.content)
        if parsed is not None:
            return parsed, resp

        # First parse failed — one retry with repair instruction
        repair_sys = (
            "Your previous response was not valid JSON. "
            "Respond with ONLY valid JSON matching this schema:\n"
            f"{schema_hint}\n"
            "No markdown, no prose. Start with '{'."
        )
        retry_messages = messages + [
            ClaudeMessage(role="assistant", content=resp.content),
            ClaudeMessage(
                role="user",
                content="That was not valid JSON. Please respond with only the JSON object.",
            ),
        ]
        resp2 = await self.complete(
            system=repair_sys,
            messages=retry_messages,
            model_tier=model_tier,
            max_tokens=max_tokens,
            temperature=0.0,
        )
        parsed2 = self._parse_json_defensively(resp2.content)
        if parsed2 is not None:
            # Aggregate token usage from both calls
            combined = ClaudeResponse(
                content=resp2.content,
                model=resp2.model,
                stop_reason=resp2.stop_reason,
                fresh_input_tokens=resp.fresh_input_tokens + resp2.fresh_input_tokens,
                cached_input_tokens=0,
                output_tokens=resp.output_tokens + resp2.output_tokens,
                latency_ms=resp.latency_ms + resp2.latency_ms,
            )
            return parsed2, combined

        # Both failed — return a safe default shape inferred from schema_hint
        fallback = self._default_structured_fallback(schema_hint)
        return fallback, resp2

    # ----------------------------------------------------------------------
    # HELPERS
    # ----------------------------------------------------------------------
    def _assemble_system(
        self,
        system: str,
        cached_prefix: list[CachedPrefix] | None,
    ) -> str:
        """Groq has no native prompt caching — concatenate everything."""
        parts: list[str] = []
        if cached_prefix:
            for p in cached_prefix:
                parts.append(p.text)
        if system:
            parts.append(system)
        return "\n\n".join(parts)

    def _parse_json_defensively(self, text: str) -> dict | None:
        """Extract JSON from Llama responses that may have stray prose or
        markdown wrapping."""
        text = text.strip()
        if not text:
            return None

        # Strip markdown code fences
        if text.startswith("```"):
            text = re.sub(r"^```(?:json)?\n?", "", text)
            text = re.sub(r"\n?```$", "", text)

        # Try direct parse
        try:
            return json.loads(text)
        except json.JSONDecodeError:
            pass

        # Find the largest JSON-like block using brace matching
        brace_start = text.find("{")
        if brace_start == -1:
            return None

        depth = 0
        in_string = False
        escape_next = False
        for i in range(brace_start, len(text)):
            c = text[i]
            if escape_next:
                escape_next = False
                continue
            if c == "\\":
                escape_next = True
                continue
            if c == '"':
                in_string = not in_string
                continue
            if in_string:
                continue
            if c == "{":
                depth += 1
            elif c == "}":
                depth -= 1
                if depth == 0:
                    candidate = text[brace_start : i + 1]
                    try:
                        return json.loads(candidate)
                    except json.JSONDecodeError:
                        return None

        return None

    def _default_structured_fallback(self, schema_hint: str) -> dict:
        """When Llama completely fails at JSON, return a shape that won't
        crash the caller. Keys chosen to match MIRA's expected schemas."""
        hint_lower = schema_hint.lower()
        if "per_criterion" in hint_lower or "score" in hint_lower:
            return {
                "per_criterion": {},
                "overall_score": 50,
                "passed": False,
                "overall_feedback": "Response could not be parsed reliably.",
                "concerns": ["llm_parse_failure"],
            }
        if "concept" in hint_lower:
            return {"concepts": []}
        return {"ok": False, "error": "parse_failure"}


# ===========================================================================
# CONVENIENCE: select client based on env
# ===========================================================================
def create_llm_client(
    *,
    prefer: str = "auto",
    anthropic_api_key: str | None = None,
    groq_api_key: str | None = None,
) -> ClaudeClientBase:
    """Factory that returns the right LLM client.

    prefer:
      - "auto"     — Groq if GROQ_API_KEY set, else Claude, else Mock
      - "groq"     — Force Groq (requires GROQ_API_KEY)
      - "claude"   — Force Claude (requires ANTHROPIC_API_KEY)
      - "mock"     — Force MockClaudeClient
    """
    from app.mira.claude.client import ClaudeClient, MockClaudeClient

    if prefer == "mock":
        return MockClaudeClient()

    if prefer == "groq":
        if not groq_api_key:
            raise ValueError("GROQ_API_KEY required for prefer='groq'")
        return GroqClient(api_key=groq_api_key)

    if prefer == "claude":
        if not anthropic_api_key:
            raise ValueError("ANTHROPIC_API_KEY required for prefer='claude'")
        return ClaudeClient(api_key=anthropic_api_key)

    # auto
    if groq_api_key:
        return GroqClient(api_key=groq_api_key)
    if anthropic_api_key:
        return ClaudeClient(api_key=anthropic_api_key)
    return MockClaudeClient()
