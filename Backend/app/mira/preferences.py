"""MIRA user preferences.

Stored in mira_user_profiles.preferences (JSONB). Extensible key-value map.
For v4.0 the only preference is code_visibility:
  - "always_off" (default): MIRA never sees code in Code IDE
  - "always_on": MIRA always sees code when user asks from Code IDE
  - "ask_each_time": widget prompts per-session (future)

We intentionally keep this small and backward-compatible. Adding new prefs
= new key with safe default.
"""
from __future__ import annotations

from dataclasses import dataclass
from typing import Any, Literal

from sqlalchemy.ext.asyncio import AsyncSession

from app.mira.models.db_models import MiraUserProfile

CodeVisibility = Literal["always_off", "always_on", "ask_each_time"]


@dataclass
class UserPreferences:
    code_visibility: CodeVisibility = "always_off"

    def to_dict(self) -> dict[str, Any]:
        return {"code_visibility": self.code_visibility}

    @classmethod
    def from_dict(cls, data: dict[str, Any] | None) -> "UserPreferences":
        if not data:
            return cls()
        vis = data.get("code_visibility", "always_off")
        if vis not in ("always_off", "always_on", "ask_each_time"):
            vis = "always_off"
        return cls(code_visibility=vis)


async def get_user_preferences(
    db: AsyncSession,
    user_id: int,
) -> UserPreferences:
    """Load preferences for a user. Returns defaults if profile doesn't exist yet."""
    profile = await db.get(MiraUserProfile, user_id)
    if profile is None:
        return UserPreferences()
    prefs_raw = getattr(profile, "preferences", None) or {}
    return UserPreferences.from_dict(prefs_raw)


async def update_user_preferences(
    db: AsyncSession,
    user_id: int,
    updates: dict[str, Any],
) -> UserPreferences:
    """Merge updates into user preferences and persist.

    Creates the profile if it doesn't exist yet (with defaults).
    Returns the resulting preferences object.
    """
    profile = await db.get(MiraUserProfile, user_id)
    if profile is None:
        # Caller should have ensured profile exists, but be defensive
        raise ValueError(f"No MIRA profile for user_id={user_id}")

    current = UserPreferences.from_dict(profile.preferences or {}).to_dict()
    current.update(updates)
    validated = UserPreferences.from_dict(current)
    profile.preferences = validated.to_dict()
    await db.commit()
    return validated


def code_is_allowed(prefs: UserPreferences) -> bool:
    """Business rule: should MIRA see code for this user's Code IDE requests?"""
    return prefs.code_visibility == "always_on"
