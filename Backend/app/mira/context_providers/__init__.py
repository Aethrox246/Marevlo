"""Context providers for MIRA's three Marevlo sections.

Each provider converts section-specific request payloads into the unified
ChatContext that ChatPipeline understands. The pipeline is section-agnostic.
"""
from app.mira.context_providers.base import ContextProvider, ChatContext
from app.mira.context_providers.course import CourseContextProvider
from app.mira.context_providers.code import CodeContextProvider
from app.mira.context_providers.research import ResearchContextProvider

__all__ = [
    "ChatContext",
    "ContextProvider",
    "CourseContextProvider",
    "CodeContextProvider",
    "ResearchContextProvider",
]
