"""CourseContextProvider — Marevlo Courses section.

In Marevlo, courses are rendered from HTML files in frontend/public/cources/
and identified by IDs like "clus", "part_1", "module_3", etc. The widget
passes the current course_id and optionally a module/section, which we pass
through to the pipeline.

No extra prompt context is needed here because the pipeline's RAG retrieval
scoped to (course_id, module_id) already surfaces the relevant content.
"""
from __future__ import annotations

from typing import Any

from app.mira.context_providers.base import ChatContext, ContextProvider


class CourseContextProvider(ContextProvider):
    def build(self, payload: dict[str, Any]) -> ChatContext:
        course_id = payload.get("course_id")
        module_id = payload.get("module_id")
        section_id = payload.get("section_id")

        # Human-readable pill for the widget.
        # Frontend can override this with the actual course title;
        # here we provide a sensible default.
        pill_parts: list[str] = []
        if course_id:
            pill_parts.append(self._prettify(course_id))
        if module_id:
            pill_parts.append(self._prettify(module_id))
        if section_id:
            pill_parts.append(self._prettify(section_id))

        pill_label = " · ".join(pill_parts) if pill_parts else "Courses"

        return ChatContext(
            section="course",
            course_id=course_id,
            module_id=module_id,
            section_id=section_id,
            extra_prompt_context=None,
            pill_label=pill_label,
            contains_user_data=False,
            metadata={"source": "course_page"},
        )

    @staticmethod
    def _prettify(raw_id: str) -> str:
        """Convert slug-like IDs into a readable label."""
        if not raw_id:
            return ""
        # "part_1" -> "Part 1", "kmeans" -> "Kmeans"
        s = raw_id.replace("_", " ").replace("-", " ")
        return s.title()
