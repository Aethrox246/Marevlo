"""Structured tracing for MIRA.

Every MIRA endpoint call produces one trace. Traces are JSON lines to
stdout by default; production deployment can pipe to Loki/Datadog/etc.

No external dependencies — just `logging` + `json`.
"""
from __future__ import annotations

import json
import logging
from dataclasses import asdict, dataclass, field
from datetime import datetime
from decimal import Decimal
from typing import Any


_logger = logging.getLogger("mira.trace")
_logger.setLevel(logging.INFO)
if not _logger.handlers:
    _h = logging.StreamHandler()
    _h.setFormatter(logging.Formatter("%(message)s"))
    _logger.addHandler(_h)
    _logger.propagate = False


@dataclass
class Trace:
    """One MIRA call's trace."""
    trace_id: str
    user_id: int
    tier: str
    endpoint: str
    timestamp: str = field(default_factory=lambda: datetime.utcnow().isoformat())
    course_id: str | None = None
    module_id: str | None = None
    section_id: str | None = None
    depth_classified: str | None = None
    matched_concepts: list[str] = field(default_factory=list)
    style_selected: str | None = None
    style_blended: str | None = None
    model: str | None = None
    tokens_in_fresh: int = 0
    tokens_in_cached: int = 0
    tokens_out: int = 0
    cost_inr: float = 0.0
    latency_ms: dict[str, int] = field(default_factory=dict)
    cache_hit_ratio: float = 0.0
    errors: list[str] = field(default_factory=list)
    extra: dict[str, Any] = field(default_factory=dict)


def emit(trace: Trace) -> None:
    """Log one trace as a JSON line."""
    payload = asdict(trace)
    # Convert Decimal → float for JSON
    _logger.info(json.dumps(payload, default=_default))


def _default(o: Any):
    if isinstance(o, Decimal):
        return float(o)
    if isinstance(o, datetime):
        return o.isoformat()
    return str(o)


def new_trace_id() -> str:
    """Short trace id — e.g. 'mira-2026-04-21-a1b2c3'."""
    import secrets
    date = datetime.utcnow().strftime("%Y-%m-%d")
    return f"mira-{date}-{secrets.token_hex(4)}"
