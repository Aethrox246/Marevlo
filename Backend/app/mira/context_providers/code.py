"""CodeContextProvider — Marevlo DSA Problems section (Code IDE).

In Marevlo, users solve coding problems from JSON files in
frontend/src/assets/ and run code via the sandboxed runner at :4002.

The user can optionally share their live editor content with MIRA. When
enabled, MIRA sees the current code + last test output and can give
contextual debugging help. When disabled, MIRA answers based on the
problem description alone.

Code visibility is controlled by the user's preferences
(mira_user_profiles.preferences.code_visibility), enforced at the router
level. This provider trusts that if user_code is present in the payload,
sharing has already been authorized.
"""
from __future__ import annotations

from typing import Any

from app.mira.context_providers.base import ChatContext, ContextProvider

MAX_CODE_LINES = 120
MAX_CODE_CHARS = 4000  # absolute ceiling even if lines fit
MAX_TEST_OUTPUT_CHARS = 600


class CodeContextProvider(ContextProvider):
    def build(self, payload: dict[str, Any]) -> ChatContext:
        problem_id = payload.get("problem_id") or payload.get("problem_title", "unknown")
        problem_title = payload.get("problem_title", "")
        language = payload.get("language", "python")
        difficulty = payload.get("difficulty", "")

        user_code = payload.get("user_code", "") or ""
        last_test_output = payload.get("last_test_output", "") or ""

        has_code = bool(user_code.strip())

        extra_prompt_context: str | None = None
        if has_code:
            code_truncated = self._smart_truncate_code(user_code, language)
            test_truncated = last_test_output[:MAX_TEST_OUTPUT_CHARS]

            parts = [
                f"# STUDENT'S CURRENT CODE (language: {language})",
                f"```{language}",
                code_truncated,
                "```",
            ]
            if test_truncated:
                parts += [
                    "",
                    "# LAST TEST OUTPUT",
                    test_truncated.strip() or "(empty)",
                ]
            else:
                parts += [
                    "",
                    "# TEST OUTPUT",
                    "(not run yet, or no output)",
                ]
            extra_prompt_context = "\n".join(parts)

        # Pill shows problem title if provided, else problem_id
        pill_label = f"Problem: {problem_title}" if problem_title else f"Problem: {self._prettify(str(problem_id))}"
        if has_code:
            pill_label += "  ·  code shared"

        return ChatContext(
            section="code",
            course_id=f"problem_{problem_id}",  # reuse course_id slot for scoping
            module_id=None,
            section_id=None,
            extra_prompt_context=extra_prompt_context,
            pill_label=pill_label,
            contains_user_data=has_code,
            metadata={
                "problem_id": problem_id,
                "problem_title": problem_title,
                "language": language,
                "difficulty": difficulty,
                "code_shared": has_code,
                "code_chars": len(user_code),
            },
        )

    # ----------------------------------------------------------------------
    # HELPERS
    # ----------------------------------------------------------------------
    @staticmethod
    def _smart_truncate_code(code: str, language: str) -> str:
        """Truncate code to a budget while preserving structure.

        Strategy: if code is short enough, return as-is. Otherwise, keep
        the first N lines (where N is MAX_CODE_LINES) and add a marker.
        This is deliberately simple; a future version could preserve function
        signatures and lines near known error markers.
        """
        if len(code) <= MAX_CODE_CHARS:
            return code

        lines = code.splitlines()
        if len(lines) <= MAX_CODE_LINES:
            # Line count OK but char count too high — clip from end
            return code[:MAX_CODE_CHARS] + "\n# ... [truncated for context]"

        kept = lines[:MAX_CODE_LINES]
        kept.append(f"# ... [{len(lines) - MAX_CODE_LINES} more lines omitted]")
        return "\n".join(kept)

    @staticmethod
    def _prettify(raw_id: str) -> str:
        if not raw_id:
            return "unknown"
        return raw_id.replace("_", " ").replace("-", " ").title()
