"""
Profile CRUD helpers.
All stat computation happens here against the live DB.
"""
from __future__ import annotations

import os
import base64
import uuid
from datetime import date, timedelta, datetime, timezone
from typing import Dict, Optional

from sqlalchemy import func, text
from sqlalchemy.orm import Session

from app.profile.models.profile import UserProfile
from app.profile.models.user_achievement import UserAchievement

# ---------------------------------------------------------------------------
# Badge catalogue
# ---------------------------------------------------------------------------

BADGE_CATALOGUE: Dict[str, dict] = {
    "first_solve":       {"label": "First Blood",     "description": "Submitted your first accepted solution",   "icon": "⚡", "color": "#f59e0b"},
    "ten_solves":        {"label": "Problem Crusher",  "description": "10 accepted solutions",                   "icon": "🔥", "color": "#f43f5e"},
    "fifty_solves":      {"label": "Algorithm Ace",    "description": "50 accepted solutions",                   "icon": "🏆", "color": "#6366f1"},
    "hundred_solves":    {"label": "Code Legend",      "description": "100 accepted solutions",                  "icon": "💎", "color": "#8b5cf6"},
    "streak_7":          {"label": "Week Warrior",     "description": "7-day activity streak",                   "icon": "🗓️", "color": "#06b6d4"},
    "streak_30":         {"label": "Month Master",     "description": "30-day activity streak",                  "icon": "📅", "color": "#10b981"},
    "first_course":      {"label": "Scholar",          "description": "Completed your first course",             "icon": "📚", "color": "#06b6d4"},
    "profile_complete":  {"label": "Identity",         "description": "Filled in bio and location",              "icon": "👤", "color": "#8b5cf6"},
}

# XP award amounts
XP_TABLE = {
    "Easy":   10,
    "Medium": 25,
    "Hard":   50,
}
XP_COURSE_COMPLETE = 100
XP_STREAK_BONUS = 5   # per day when streak >= 3


# ---------------------------------------------------------------------------
# Profile read / create / update
# ---------------------------------------------------------------------------

def get_or_create_profile(db: Session, user_id: str) -> UserProfile:
    profile = db.get(UserProfile, user_id)
    if profile:
        return profile
    profile = UserProfile(user_id=user_id)
    db.add(profile)
    db.commit()
    db.refresh(profile)
    return profile


def update_profile(db: Session, user_id: str, data: dict) -> UserProfile:
    profile = get_or_create_profile(db, user_id)
    for key, val in data.items():
        if val is not None and hasattr(profile, key):
            setattr(profile, key, val)
    db.commit()
    db.refresh(profile)
    # Badge: profile complete
    if profile.bio and profile.location:
        _grant_badge(db, int(user_id), "profile_complete")
    return profile


def save_resume(db: Session, user_id: str, filename: str, content_b64: str) -> str:
    """Decode base64 resume, save to /uploads, return relative URL."""
    upload_dir = "/app/uploads"
    os.makedirs(upload_dir, exist_ok=True)
    ext = os.path.splitext(filename)[1] or ".pdf"
    safe_name = f"{user_id}_{uuid.uuid4().hex[:8]}{ext}"
    file_path = os.path.join(upload_dir, safe_name)

    file_bytes = base64.b64decode(content_b64)
    with open(file_path, "wb") as f:
        f.write(file_bytes)

    resume_url = f"/uploads/{safe_name}"
    profile = get_or_create_profile(db, user_id)
    profile.resume_url = resume_url
    db.commit()
    return resume_url


# ---------------------------------------------------------------------------
# Stats
# ---------------------------------------------------------------------------

def get_stats(db: Session, user_id: int) -> dict:
    uid = int(user_id)

    # XP from profile
    profile = db.get(UserProfile, str(uid))
    xp = profile.xp if profile else 0
    level = (xp // 100) + 1

    # Solved = unique problems with accepted submission
    solved_row = db.execute(
        text("""
            SELECT COUNT(DISTINCT problem_id)
            FROM problem_submissions
            WHERE user_id = :uid AND status = 'accepted'
        """),
        {"uid": uid},
    ).scalar() or 0

    # Rank = how many users have solved MORE problems than this user (1-indexed)
    rank_row = db.execute(
        text("""
            SELECT COUNT(DISTINCT s2.user_id) + 1 AS rank
            FROM (
                SELECT user_id, COUNT(DISTINCT problem_id) AS cnt
                FROM problem_submissions
                WHERE status = 'accepted'
                GROUP BY user_id
            ) s2
            WHERE s2.cnt > (
                SELECT COUNT(DISTINCT problem_id)
                FROM problem_submissions
                WHERE user_id = :uid AND status = 'accepted'
            )
        """),
        {"uid": uid},
    ).scalar() or 1

    # Courses completed = activity_logs with action = 'course_completed'
    courses_row = db.execute(
        text("""
            SELECT COUNT(*) FROM activity_logs
            WHERE user_id = :uid AND action = 'course_completed'
        """),
        {"uid": uid},
    ).scalar() or 0

    # Streak = max consecutive calendar days with ANY activity_log entry
    streak = _compute_streak(db, uid)

    return {
        "xp": xp,
        "level": level,
        "streak": streak,
        "rank": int(rank_row),
        "courses_completed": int(courses_row),
        "problems_solved": int(solved_row),
    }


def _compute_streak(db: Session, user_id: int) -> int:
    """Count consecutive calendar days ending today with at least one activity log."""
    rows = db.execute(
        text("""
            SELECT DISTINCT DATE(created_at AT TIME ZONE 'UTC') AS day
            FROM activity_logs
            WHERE user_id = :uid
            ORDER BY day DESC
        """),
        {"uid": user_id},
    ).fetchall()

    if not rows:
        return 0

    today = date.today()
    streak = 0
    expected = today

    for (day,) in rows:
        if day == expected:
            streak += 1
            expected = expected - timedelta(days=1)
        elif day == today - timedelta(days=1) and streak == 0:
            # Allow yesterday as starting day (user hasn't acted today yet)
            streak += 1
            expected = day - timedelta(days=1)
        else:
            break

    return streak


def get_activity(db: Session, user_id: int, days: int = 70) -> list:
    """Return list of {date, count} for the last N days."""
    rows = db.execute(
        text("""
            SELECT DATE(created_at AT TIME ZONE 'UTC') AS day, COUNT(*) AS cnt
            FROM activity_logs
            WHERE user_id = :uid
              AND created_at >= NOW() - INTERVAL ':days days'
            GROUP BY day
            ORDER BY day
        """.replace(":days days", f"{days} days")),
        {"uid": user_id},
    ).fetchall()
    return [{"date": str(r[0]), "count": int(r[1])} for r in rows]


# ---------------------------------------------------------------------------
# XP + achievements
# ---------------------------------------------------------------------------

def award_xp(db: Session, user_id: int, amount: int) -> int:
    """Add XP to user profile and return new total."""
    profile = get_or_create_profile(db, str(user_id))
    profile.xp = (profile.xp or 0) + amount
    db.commit()
    db.refresh(profile)
    return profile.xp


def check_and_award_achievements(db: Session, user_id: int):
    """Check all badge conditions and award any newly earned badges."""
    uid = int(user_id)
    profile = db.get(UserProfile, str(uid))

    # Solve counts
    solved = db.execute(
        text("SELECT COUNT(DISTINCT problem_id) FROM problem_submissions WHERE user_id=:uid AND status='accepted'"),
        {"uid": uid},
    ).scalar() or 0

    streak = _compute_streak(db, uid)

    courses = db.execute(
        text("SELECT COUNT(*) FROM activity_logs WHERE user_id=:uid AND action='course_completed'"),
        {"uid": uid},
    ).scalar() or 0

    conditions = {
        "first_solve":       solved >= 1,
        "ten_solves":        solved >= 10,
        "fifty_solves":      solved >= 50,
        "hundred_solves":    solved >= 100,
        "streak_7":          streak >= 7,
        "streak_30":         streak >= 30,
        "first_course":      courses >= 1,
        "profile_complete":  bool(profile and profile.bio and profile.location),
    }

    for key, met in conditions.items():
        if met:
            _grant_badge(db, uid, key)


def _grant_badge(db: Session, user_id: int, badge_key: str):
    exists = db.execute(
        text("SELECT 1 FROM user_achievements WHERE user_id=:uid AND badge_key=:key"),
        {"uid": user_id, "key": badge_key},
    ).scalar()
    if not exists:
        db.execute(
            text("INSERT INTO user_achievements (user_id, badge_key) VALUES (:uid, :key) ON CONFLICT DO NOTHING"),
            {"uid": user_id, "key": badge_key},
        )
        db.commit()


def get_achievements(db: Session, user_id: int) -> list:
    rows = db.execute(
        text("SELECT badge_key, earned_at FROM user_achievements WHERE user_id=:uid ORDER BY earned_at"),
        {"uid": int(user_id)},
    ).fetchall()

    result = []
    for badge_key, earned_at in rows:
        meta = BADGE_CATALOGUE.get(badge_key, {})
        result.append({
            "badge_key": badge_key,
            "label": meta.get("label", badge_key),
            "description": meta.get("description", ""),
            "icon": meta.get("icon", "🏅"),
            "color": meta.get("color", "#6366f1"),
            "earned_at": earned_at,
        })
    return result
