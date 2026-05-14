"""Feature flag layer for MIRA.

Controls which users can access MIRA during rollout:
  - MIRA_ENABLED_FOR_ALL=true  → everyone sees it
  - MIRA_ENABLED_USER_IDS=1,2,3,4,5,6  → allowlist
  - MIRA_ADMIN_USER_IDS=1  → admin always sees it regardless of allowlist
  - MIRA_GLOBAL_KILL=true  → disable for EVERYONE (emergency)

Designed to be stupid-simple for the 6-tester pilot. Graduate to a DB-backed
flag table once the allowlist exceeds ~30 users.
"""
from __future__ import annotations

import os
from dataclasses import dataclass


@dataclass
class FeatureFlagConfig:
    enabled_for_all: bool = False
    allowlisted_user_ids: frozenset[int] = frozenset()
    admin_user_ids: frozenset[int] = frozenset()
    global_kill: bool = False

    @classmethod
    def from_env(cls) -> "FeatureFlagConfig":
        def _parse_ids(raw: str) -> frozenset[int]:
            if not raw:
                return frozenset()
            out: set[int] = set()
            for part in raw.split(","):
                part = part.strip()
                if part.isdigit():
                    out.add(int(part))
            return frozenset(out)

        return cls(
            enabled_for_all=os.environ.get("MIRA_ENABLED_FOR_ALL", "false").lower() == "true",
            allowlisted_user_ids=_parse_ids(os.environ.get("MIRA_ENABLED_USER_IDS", "")),
            admin_user_ids=_parse_ids(os.environ.get("MIRA_ADMIN_USER_IDS", "")),
            global_kill=os.environ.get("MIRA_GLOBAL_KILL", "false").lower() == "true",
        )


class FeatureFlags:
    """Runtime feature flag checker. Safe to share across requests (read-only)."""

    def __init__(self, config: FeatureFlagConfig):
        self.config = config

    def is_enabled_for(self, user_id: int) -> bool:
        """Main gate. Returns True iff this user may use MIRA."""
        if self.config.global_kill:
            return False
        if user_id in self.config.admin_user_ids:
            return True
        if self.config.enabled_for_all:
            return True
        return user_id in self.config.allowlisted_user_ids

    def is_admin(self, user_id: int) -> bool:
        return user_id in self.config.admin_user_ids

    def snapshot(self) -> dict:
        """For /admin/mira/feature-flags endpoint — operational visibility."""
        return {
            "enabled_for_all": self.config.enabled_for_all,
            "allowlist_size": len(self.config.allowlisted_user_ids),
            "allowlist": sorted(self.config.allowlisted_user_ids),
            "admin_ids": sorted(self.config.admin_user_ids),
            "global_kill": self.config.global_kill,
        }
