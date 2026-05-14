"""ResearchContextProvider — Marevlo Research Papers section.

In Marevlo, research papers are HTML files (like the DiskANN paper) rendered
as standalone reading views. Users may:
  - Ask general questions about a paper they're reading
  - Highlight a passage and ask for clarification

The widget sends the current paper_id and optionally selected text. MIRA
treats papers like courses for retrieval (paper_id is used as course_id for
scoping), and injects selected text into the user's message when present.
"""
from __future__ import annotations

from typing import Any

from app.mira.context_providers.base import ChatContext, ContextProvider

MAX_SELECTED_CHARS = 2500  # enough for a paragraph or two


class ResearchContextProvider(ContextProvider):
    def build(self, payload: dict[str, Any]) -> ChatContext:
        paper_id = payload.get("paper_id")
        paper_title = payload.get("paper_title", "")
        selected_text = (payload.get("selected_text") or "").strip()

        extra_prompt_context: str | None = None
        if selected_text:
            truncated = selected_text[:MAX_SELECTED_CHARS]
            extra_prompt_context = (
                "# PASSAGE USER IS ASKING ABOUT\n"
                f'"{truncated}"'
            )

        pill_label: str
        if paper_title:
            pill_label = f"Paper: {paper_title}"
        elif paper_id:
            pill_label = f"Paper: {self._prettify(str(paper_id))}"
        else:
            pill_label = "Research"

        if selected_text:
            pill_label += "  ·  asking about highlighted text"

        return ChatContext(
            section="research",
            course_id=f"paper_{paper_id}" if paper_id else None,
            module_id=None,
            section_id=None,
            extra_prompt_context=extra_prompt_context,
            pill_label=pill_label,
            contains_user_data=False,  # paper text is public content, not user data
            metadata={
                "paper_id": paper_id,
                "paper_title": paper_title,
                "selection_chars": len(selected_text),
            },
        )

    @staticmethod
    def _prettify(raw_id: str) -> str:
        if not raw_id:
            return "unknown"
        return raw_id.replace("_", " ").replace("-", " ").title()
