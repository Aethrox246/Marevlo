"""Frustration detector.

Counts frustration signals within a session. When the count crosses a
threshold, the calling code triggers an intervention:
  - Softer tone in next response
  - Force a style change in the bandit
  - Suggest a break or different topic
  - Offer to step back to prerequisites

Signals detected:
  1. REPEAT_QUESTION: user asking the same concept twice in short succession
  2. NEGATIVE_FEEDBACK: explicit "didn't understand" clicks
  3. SHORT_ANGRY_MESSAGE: very short + ALL CAPS or punctuation-heavy
  4. PROFANITY: mild profanity indicates frustration
  5. RAPID_FIRE: sending messages faster than reading responses

No LLM calls. All heuristics with configurable thresholds.
"""
from __future__ import annotations

import re
from dataclasses import dataclass
from datetime import datetime, timedelta
from enum import Enum


class FrustrationSignal(str, Enum):
    REPEAT_QUESTION = "repeat_question"
    NEGATIVE_FEEDBACK = "negative_feedback"
    SHORT_ANGRY = "short_angry"
    PROFANITY = "profanity"
    RAPID_FIRE = "rapid_fire"


class FrustrationAction(str, Enum):
    NONE = "none"
    SOFTEN_TONE = "soften_tone"                  # 2-3 signals
    CHANGE_STYLE = "change_style"                # 4-5 signals
    SUGGEST_BREAK = "suggest_break"              # 6+ signals
    OFFER_PREREQUISITES = "offer_prereqs"        # 4+ signals AND p_known low


@dataclass
class FrustrationCheck:
    signal_count: int
    recent_signals: list[FrustrationSignal]
    action: FrustrationAction
    tone_message: str | None  # text to prepend to next LLM response


# ---------------------------------------------------------------------------
# PATTERNS
# ---------------------------------------------------------------------------

# Mild profanity — we don't want to be prudish about "damn" / "shit" in
# an engineering context (those are normal), but flag the escalation.
_PROFANITY_PATTERNS = [
    r"\bwtf\b",
    r"\bfuck(?:ing)?\b",
    r"\bbullshit\b",
    r"\bbloody hell\b",
    r"\bwth\b",
]

# ALL CAPS indicator — at least 60% uppercase and longer than 8 chars
def _is_all_caps(text: str) -> bool:
    letters = [c for c in text if c.isalpha()]
    if len(letters) < 8:
        return False
    upper = sum(1 for c in letters if c.isupper())
    return upper / len(letters) >= 0.6


# Punctuation-heavy indicator — more than 2 consecutive punctuation marks
def _is_punctuation_heavy(text: str) -> bool:
    return bool(re.search(r"[?!]{3,}|\.{4,}", text))


class FrustrationDetector:
    """Per-session frustration tracker. Operates on a rolling window.

    In production, the session state lives in Redis with a 30-minute TTL.
    This class is stateless — caller supplies state and updates.
    """

    # Thresholds
    REPEAT_WINDOW_MINUTES = 5
    RAPID_FIRE_WINDOW_SECONDS = 10
    RAPID_FIRE_COUNT = 3

    # Signal → action escalation
    ACTION_THRESHOLDS = {
        0: FrustrationAction.NONE,
        1: FrustrationAction.NONE,
        2: FrustrationAction.SOFTEN_TONE,
        3: FrustrationAction.SOFTEN_TONE,
        4: FrustrationAction.CHANGE_STYLE,
        5: FrustrationAction.CHANGE_STYLE,
    }
    SUGGEST_BREAK_THRESHOLD = 6

    @staticmethod
    def detect_signals(
        message: str,
        previous_messages: list[tuple[datetime, str]],
        prev_feedback_negative: bool = False,
        concept_asked_before_recently: bool = False,
    ) -> list[FrustrationSignal]:
        """Run all detectors on the current message + short history.

        previous_messages: list of (timestamp, message_text) from this session.
        prev_feedback_negative: did the user just click "didn't understand"?
        concept_asked_before_recently: is the same concept being re-asked?
        """
        signals: list[FrustrationSignal] = []
        msg_lower = message.lower()

        # 1. PROFANITY
        for pattern in _PROFANITY_PATTERNS:
            if re.search(pattern, msg_lower):
                signals.append(FrustrationSignal.PROFANITY)
                break

        # 2. SHORT_ANGRY (all caps / punctuation heavy short message)
        if len(message) <= 60:
            if _is_all_caps(message) or _is_punctuation_heavy(message):
                signals.append(FrustrationSignal.SHORT_ANGRY)

        # 3. NEGATIVE_FEEDBACK (caller passes this in)
        if prev_feedback_negative:
            signals.append(FrustrationSignal.NEGATIVE_FEEDBACK)

        # 4. REPEAT_QUESTION (caller determines concept repeat)
        if concept_asked_before_recently:
            signals.append(FrustrationSignal.REPEAT_QUESTION)

        # 5. RAPID_FIRE (3+ messages within 10 seconds)
        if len(previous_messages) >= FrustrationDetector.RAPID_FIRE_COUNT - 1:
            now = datetime.utcnow()
            recent_window = previous_messages[
                -(FrustrationDetector.RAPID_FIRE_COUNT - 1):
            ]
            oldest_time = recent_window[0][0]
            if now - oldest_time < timedelta(
                seconds=FrustrationDetector.RAPID_FIRE_WINDOW_SECONDS
            ):
                signals.append(FrustrationSignal.RAPID_FIRE)

        return signals

    @staticmethod
    def decide_action(
        signal_count: int,
        recent_signals: list[FrustrationSignal],
        concept_p_known: float | None = None,
    ) -> FrustrationCheck:
        """Given total signal count in this session, decide intervention."""
        # High signal + low mastery → suggest prerequisites
        if (
            signal_count >= 4
            and concept_p_known is not None
            and concept_p_known < 0.3
        ):
            return FrustrationCheck(
                signal_count=signal_count,
                recent_signals=recent_signals,
                action=FrustrationAction.OFFER_PREREQUISITES,
                tone_message=(
                    "I notice this concept might be building on something "
                    "you haven't fully locked in yet. Want to step back "
                    "and strengthen the prerequisites first?"
                ),
            )

        # Escalation
        if signal_count >= FrustrationDetector.SUGGEST_BREAK_THRESHOLD:
            return FrustrationCheck(
                signal_count=signal_count,
                recent_signals=recent_signals,
                action=FrustrationAction.SUGGEST_BREAK,
                tone_message=(
                    "Let's take a quick break — sometimes stepping away for "
                    "5 minutes makes the next explanation click. Come back "
                    "whenever you're ready."
                ),
            )

        action = FrustrationDetector.ACTION_THRESHOLDS.get(
            min(signal_count, 5),
            FrustrationAction.CHANGE_STYLE,
        )

        tone_message: str | None = None
        if action == FrustrationAction.SOFTEN_TONE:
            tone_message = (
                "Let me try to explain this differently — no pressure, "
                "take your time."
            )
        elif action == FrustrationAction.CHANGE_STYLE:
            tone_message = (
                "I think my previous approach wasn't landing. Let me "
                "switch to a different angle."
            )

        return FrustrationCheck(
            signal_count=signal_count,
            recent_signals=recent_signals,
            action=action,
            tone_message=tone_message,
        )

    @staticmethod
    def should_force_style_change(action: FrustrationAction) -> bool:
        """Caller uses this to override the bandit's style selection."""
        return action in {
            FrustrationAction.CHANGE_STYLE,
            FrustrationAction.SUGGEST_BREAK,
        }
