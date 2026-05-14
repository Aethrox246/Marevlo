"""Typing cadence analyzer — detect bot-like or pasted input.

Given a list of keystroke timestamps (or inter-keystroke intervals),
compute signals that suggest the answer wasn't typed by a human:
  - Impossibly fast overall (< 50 WPM burst over 100+ chars)
  - Uniform intervals (variance near zero)
  - Burst pattern (large gap, then fast block = paste)

NOT foolproof — a tech-savvy cheater can work around this. The goal is
to raise the cost of cheating and trigger manual review on egregious cases.

Pure math, no LLM.
"""
from __future__ import annotations

import statistics
from dataclasses import dataclass


@dataclass
class CadenceAnalysis:
    char_count: int
    duration_ms: int
    wpm_equivalent: float
    mean_interval_ms: float
    interval_stdev_ms: float
    max_gap_ms: int
    suspicious_reasons: list[str]

    @property
    def is_suspicious(self) -> bool:
        return len(self.suspicious_reasons) > 0


class TypingCadenceAnalyzer:
    # Thresholds
    MAX_HUMAN_WPM = 120  # world record typing is ~216, but sustained = ~100
    MIN_INTERVAL_STDEV_MS = 20  # humans have natural variation
    PASTE_GAP_MS = 300  # gap followed by fast block suggests paste

    @staticmethod
    def analyze(
        char_count: int,
        intervals_ms: list[int],
    ) -> CadenceAnalysis:
        """intervals_ms[i] = time between keystroke i and i+1."""
        reasons: list[str] = []

        if not intervals_ms or char_count < 10:
            return CadenceAnalysis(
                char_count=char_count,
                duration_ms=0,
                wpm_equivalent=0,
                mean_interval_ms=0,
                interval_stdev_ms=0,
                max_gap_ms=0,
                suspicious_reasons=[],
            )

        total_ms = sum(intervals_ms)
        mean_interval = statistics.mean(intervals_ms)
        stdev_interval = (
            statistics.stdev(intervals_ms) if len(intervals_ms) > 1 else 0.0
        )
        max_gap = max(intervals_ms)

        # WPM: (chars / 5) / (total_ms / 60000)
        wpm = (char_count / 5) / (total_ms / 60000) if total_ms > 0 else 0

        if wpm > TypingCadenceAnalyzer.MAX_HUMAN_WPM and char_count > 100:
            reasons.append(f"impossibly fast typing: {wpm:.0f} WPM over {char_count} chars")

        if (
            stdev_interval < TypingCadenceAnalyzer.MIN_INTERVAL_STDEV_MS
            and len(intervals_ms) > 30
        ):
            reasons.append(
                f"mechanically uniform intervals: stdev={stdev_interval:.1f}ms"
            )

        # Look for big gap followed by a fast burst (paste pattern)
        for i in range(len(intervals_ms) - 5):
            if intervals_ms[i] > TypingCadenceAnalyzer.PASTE_GAP_MS:
                following = intervals_ms[i + 1 : i + 6]
                if following and statistics.mean(following) < 20:
                    reasons.append(
                        f"paste pattern at char {i}: {intervals_ms[i]}ms gap "
                        f"then {statistics.mean(following):.0f}ms avg burst"
                    )
                    break

        return CadenceAnalysis(
            char_count=char_count,
            duration_ms=total_ms,
            wpm_equivalent=round(wpm, 1),
            mean_interval_ms=round(mean_interval, 1),
            interval_stdev_ms=round(stdev_interval, 1),
            max_gap_ms=max_gap,
            suspicious_reasons=reasons,
        )
