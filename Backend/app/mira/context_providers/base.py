"""Base classes for Marevlo section context providers.

The ChatPipeline accepts a ChatContext regardless of which section the user
is in. Providers adapt section-specific payloads into this shape.
"""
from __future__ import annotations

from abc import ABC, abstractmethod
from dataclasses import dataclass, field
from typing import Any, Literal

Section = Literal["course", "code", "research", "general"]


@dataclass
class ChatContext:
    """Unified context consumed by ChatPipeline."""

    section: Section
    # Course-ish identifiers (reused across sections)
    course_id: str | None = None
    module_id: str | None = None
    section_id: str | None = None
    # Optional extra context injected into the user message before Claude sees it
    extra_prompt_context: str | None = None
    # Display hint for the widget's context pill (frontend only reads this)
    pill_label: str | None = None
    # Whether this context includes user-private data (e.g. their code)
    contains_user_data: bool = False
    # Arbitrary metadata (logged in telemetry, not sent to Claude)
    metadata: dict[str, Any] = field(default_factory=dict)


class ContextProvider(ABC):
    """Abstract base for all section-specific providers.

    Each provider takes a raw frontend payload and returns a ChatContext.
    Providers are stateless and safe to reuse.
    """

    @abstractmethod
    def build(self, payload: dict[str, Any]) -> ChatContext:
        """Convert section-specific payload into a unified ChatContext."""
        raise NotImplementedError
