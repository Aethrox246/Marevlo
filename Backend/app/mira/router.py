"""MIRA FastAPI router — mounted at /api/mira/* in Marevlo.

Endpoints:
    GET  /api/mira/feature-check       Is MIRA enabled for this user?
    POST /api/mira/chat                Main chat (course/code/research contexts)
    POST /api/mira/feedback            Belief + bandit update
    GET  /api/mira/profile             User's cognitive state
    GET  /api/mira/quota               Tier-specific remaining quota
    GET  /api/mira/recent              Recent interactions for this user
    GET  /api/mira/preferences         Current user preferences
    PATCH /api/mira/preferences        Update preferences (code visibility toggle)

Admin endpoints (require X-Admin-Token header):
    GET  /admin/mira/stats             Aggregate stats
    GET  /admin/mira/users             All users + tier + interaction count
    GET  /admin/mira/feature-flags     Current feature flag state
    GET  /admin/mira/export/{user_id}  Full data dump for one user (GDPR)
    POST /admin/mira/set-tier          Override a user's tier

All non-admin endpoints require Firebase ID token in Authorization header.
Feature flag check runs first — non-allowlisted users get 403.
"""
from __future__ import annotations

import csv
import io
import logging
import os
from contextlib import asynccontextmanager
from datetime import datetime
from typing import Any, Optional

from fastapi import APIRouter, Depends, Header, HTTPException, Request, status
from fastapi.responses import JSONResponse, StreamingResponse
from pydantic import BaseModel, Field
from sqlalchemy import select, text, func
from sqlalchemy.ext.asyncio import AsyncSession

from app.mira.auth.firebase import (
    AuthenticatedUser,
    FirebaseAuth,
    FirebaseAuthError,
)
from app.mira.chat_pipeline import ChatPipeline, PipelineResult
from app.mira.claude.client import ClaudeClientBase
from app.mira.context_providers import (
    ChatContext,
    CodeContextProvider,
    CourseContextProvider,
    ResearchContextProvider,
)
from app.mira.feature_flags import FeatureFlags
from app.mira.models.db_models import (
    MiraEpisodic,
    MiraUserProfile,
)
from app.mira.models.schemas import Tier
from app.mira.preferences import (
    UserPreferences,
    code_is_allowed,
    get_user_preferences,
    update_user_preferences,
)
from app.mira.quota_enforcer import QuotaEnforcer
from app.mira.retrieval.lattice import LatticeLoader
from app.mira.retrieval.retriever import Retriever

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/api/mira", tags=["mira"])
admin_router = APIRouter(prefix="/admin/mira", tags=["mira-admin"])


# =============================================================================
# REQUEST / RESPONSE MODELS
# =============================================================================
class ChatRequestIn(BaseModel):
    message: str = Field(..., min_length=1, max_length=4000)
    # Section is required — tells backend which ContextProvider to use
    section: str = Field(..., pattern="^(course|code|research|general)$")
    # Universal scoping IDs (section-specific keys are accepted too via extras)
    course_id: str | None = None
    module_id: str | None = None
    section_id: str | None = None
    # Section-specific payload (anything the context provider needs)
    context_payload: dict[str, Any] = Field(default_factory=dict)


class FeedbackIn(BaseModel):
    concept_id: str
    style_used: str = Field(..., pattern="^(analogy|visual|mathematical|code|storytelling|socratic)$")
    understood: bool


class PreferencesIn(BaseModel):
    code_visibility: str | None = Field(None, pattern="^(always_off|always_on|ask_each_time)$")


class SetTierIn(BaseModel):
    user_id: int
    tier: str = Field(..., pattern="^(free|starter|plus|pro|elite|spark)$")


# =============================================================================
# DEPENDENCY INJECTION HELPERS
# =============================================================================
def _get_state(request: Request) -> dict[str, Any]:
    """Pull MIRA state dict set at app startup via app.state.mira = {...}."""
    state = getattr(request.app.state, "mira", None)
    if state is None:
        raise HTTPException(
            status_code=500,
            detail="MIRA not initialized. See app.state.mira wiring in main.py.",
        )
    return state


def _get_feature_flags(request: Request) -> FeatureFlags:
    return _get_state(request)["feature_flags"]


def _get_firebase_auth(request: Request) -> FirebaseAuth:
    return _get_state(request)["firebase_auth"]


def _get_claude(request: Request) -> ClaudeClientBase:
    return _get_state(request)["claude"]


def _get_retriever(request: Request) -> Retriever:
    return _get_state(request)["retriever"]


def _get_quota(request: Request) -> QuotaEnforcer:
    return _get_state(request)["quota_enforcer"]


def _get_db_factory(request: Request):
    return _get_state(request)["db_factory"]  # callable -> AsyncSession context


# =============================================================================
# AUTH DEPENDENCY
# =============================================================================
async def require_user(
    request: Request,
    authorization: str | None = Header(None),
    x_dev_user_id: str | None = Header(None, alias="X-Dev-User-Id"),
) -> AuthenticatedUser:
    """Verify Firebase token and resolve Marevlo user_id.

    Supports a DEV_MODE_ALLOW_HEADER_UID escape hatch (never enable in prod).
    """
    firebase_auth = _get_firebase_auth(request)
    db_factory = _get_db_factory(request)
    dev_mode = (
        os.environ.get("MIRA_DEV_MODE_ALLOW_HEADER_UID", "false").lower() == "true"
    )

    # Dev escape hatch: X-Dev-User-Id header for local testing
    if dev_mode and x_dev_user_id and x_dev_user_id.isdigit():
        user_id = int(x_dev_user_id)
        async with db_factory() as db:
            result = await db.execute(
                text("SELECT id, email FROM users WHERE id = :id"),
                {"id": user_id},
            )
            row = result.first()
            if row is None:
                raise HTTPException(404, f"Dev user_id {user_id} not found")
            return AuthenticatedUser(
                user_id=user_id,
                firebase_uid=f"dev-{user_id}",
                email=row.email,
            )

    if not authorization or not authorization.lower().startswith("bearer "):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Missing Bearer token",
        )
    token = authorization.split(" ", 1)[1].strip()

    async with db_factory() as db:
        try:
            return await firebase_auth.authenticate(db, token)
        except FirebaseAuthError as e:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail=f"Authentication failed: {e}",
            ) from e


async def require_enabled_user(
    request: Request,
    user: AuthenticatedUser = Depends(require_user),
) -> AuthenticatedUser:
    """Gate on feature flag AFTER auth succeeds."""
    flags = _get_feature_flags(request)
    if not flags.is_enabled_for(user.user_id):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="MIRA is not enabled for your account yet.",
        )
    return user


def require_admin(
    x_admin_token: str | None = Header(None, alias="X-Admin-Token"),
) -> bool:
    expected = os.environ.get("MIRA_ADMIN_TOKEN", "").strip()
    if not expected:
        raise HTTPException(500, "MIRA_ADMIN_TOKEN env var not set")
    if x_admin_token != expected:
        raise HTTPException(403, "Invalid admin token")
    return True


# =============================================================================
# FEATURE CHECK — called on widget mount
# =============================================================================
@router.get("/feature-check")
async def feature_check(
    request: Request,
    user: AuthenticatedUser = Depends(require_user),  # auth only, not feature-gated
):
    """Widget calls this on mount. If enabled=false, widget doesn't render."""
    flags = _get_feature_flags(request)
    return {
        "enabled": flags.is_enabled_for(user.user_id),
        "is_admin": flags.is_admin(user.user_id),
    }


# =============================================================================
# CHAT
# =============================================================================
def _pick_context_provider(section: str):
    if section == "course":
        return CourseContextProvider()
    if section == "code":
        return CodeContextProvider()
    if section == "research":
        return ResearchContextProvider()
    # "general" falls through to course provider with no scoping
    return CourseContextProvider()


@router.post("/chat")
async def chat(
    request: Request,
    payload: ChatRequestIn,
    user: AuthenticatedUser = Depends(require_enabled_user),
):
    db_factory = _get_db_factory(request)
    claude = _get_claude(request)
    retriever = _get_retriever(request)
    quota = _get_quota(request)

    async with db_factory() as db:
        # 1. Ensure profile exists
        profile = await db.get(MiraUserProfile, user.user_id)
        if profile is None:
            profile = MiraUserProfile(
                user_id=user.user_id,
                tier="plus",  # default tier for newly-onboarded MIRA users
                quota_period_resets_at=_first_of_next_month(),
                beliefs={},
                bandit_state={},
                personal_prompt={},
                preferences={},
            )
            db.add(profile)
            await db.commit()
            await db.refresh(profile)

        # 2. Build context via appropriate provider
        provider = _pick_context_provider(payload.section)

        # Merge payload.context_payload with top-level IDs
        # (frontend can send either style)
        merged_payload = {
            "course_id": payload.course_id,
            "module_id": payload.module_id,
            "section_id": payload.section_id,
            **payload.context_payload,
        }

        # 3. For code section: strip code unless user has opted in
        if payload.section == "code":
            prefs = await get_user_preferences(db, user.user_id)
            if not code_is_allowed(prefs):
                merged_payload.pop("user_code", None)
                merged_payload.pop("last_test_output", None)

        ctx = provider.build(merged_payload)

        # 4. Build pipeline with request-scoped DB session
        pipeline = ChatPipeline(
            db=db,
            claude=claude,
            retriever=retriever,
            lattice_loader=LatticeLoader(db),
            quota_enforcer=quota,
        )

        result: PipelineResult = await pipeline.handle(
            user_id=user.user_id,
            question=payload.message,
            course_id=ctx.course_id,
            module_id=ctx.module_id,
            section_id=ctx.section_id,
            extra_prompt_context=ctx.extra_prompt_context,
        )

    return {
        "trace_id": result.trace_id,
        "response": result.response,
        "matched_concepts": result.matched_concepts,
        "depth": result.depth.value if result.depth else None,
        "style_used": result.style_used.value if result.style_used else None,
        "blend_style": result.blend_style.value if result.blend_style else None,
        "model": result.model,
        "tokens_in": result.tokens_in,
        "tokens_out": result.tokens_out,
        "cost_inr": float(result.cost_inr),
        "latency_ms": result.latency_ms,
        "quota_remaining": result.quota_remaining,
        "rate_limited": result.rate_limited,
        "domain_redirected": result.domain_redirected,
        "section": payload.section,
        "context_pill": ctx.pill_label,
    }


# =============================================================================
# FEEDBACK
# =============================================================================
@router.post("/feedback")
async def feedback(
    request: Request,
    payload: FeedbackIn,
    user: AuthenticatedUser = Depends(require_enabled_user),
):
    db_factory = _get_db_factory(request)

    async with db_factory() as db:
        profile = await db.get(MiraUserProfile, user.user_id)
        if profile is None:
            raise HTTPException(404, "No MIRA profile — send a chat first")

        # Update beliefs
        from app.mira.cognitive.tracker import BayesianCognitiveStateTracker

        tracker = BayesianCognitiveStateTracker(
            beliefs=profile.beliefs or {},
        )
        updated_belief = tracker.update_on_feedback(
            concept_id=payload.concept_id,
            understood=payload.understood,
            style_used=payload.style_used,
        )
        profile.beliefs = tracker.beliefs

        # Update bandit
        from app.mira.cognitive.bandit import ThompsonBandit, ExplanationStyle

        bandit = ThompsonBandit.from_state(profile.bandit_state or {})
        bandit.update(
            arm=ExplanationStyle(payload.style_used),
            reward=1.0 if payload.understood else 0.0,
        )
        profile.bandit_state = bandit.to_state()

        await db.commit()

        # Next-style suggestion (what the bandit recommends now)
        next_style = bandit.select(rng=None).value

    return {
        "updated_p_known": updated_belief.p_known,
        "mastery": updated_belief.mastery,
        "next_style_suggestion": next_style,
    }


# =============================================================================
# PROFILE
# =============================================================================
@router.get("/profile")
async def profile_endpoint(
    request: Request,
    user: AuthenticatedUser = Depends(require_enabled_user),
):
    db_factory = _get_db_factory(request)
    quota = _get_quota(request)

    async with db_factory() as db:
        profile = await db.get(MiraUserProfile, user.user_id)
        if profile is None:
            return {
                "user_id": user.user_id,
                "tier": "plus",
                "concepts_tracked": 0,
                "total_interactions": 0,
                "dominant_style": None,
                "bandit_stats": {},
                "personal_prompt_observations": [],
                "top_concepts": [],
            }

        tier = Tier(profile.tier)
        # Bandit summary
        from app.mira.cognitive.bandit import ThompsonBandit
        from app.mira.models.schemas import ExplainStyle

        bandit_state = profile.bandit_state or {}
        if isinstance(bandit_state, dict):
            from app.mira.models.schemas import StyleBanditState
            bandit_state = StyleBanditState(**bandit_state)
        
        # Get expected values for each style
        expected_vals = ThompsonBandit.get_expected_values(bandit_state)
        bandit_stats = {}
        for style in ExplainStyle:
            if style.value in expected_vals:
                ev = expected_vals[style.value]
                arm = bandit_state.arms.get(style.value)
                if arm:
                    attempts = arm.alpha + arm.beta - 2  # pseudo-count priors
                    bandit_stats[style.value] = {
                        "expected_value": round(ev, 3),
                        "attempts": max(0, int(attempts)),
                        "successes": max(0, int(arm.alpha - 1)),
                    }
        
        dominant = ThompsonBandit.get_dominant_style(bandit_state)
        dominant = dominant.value if dominant else None

        # Top concepts by p_known
        beliefs = profile.beliefs or {}
        concepts = sorted(
            (
                {
                    "concept_id": cid,
                    "p_known": (b.get("p_known") if isinstance(b, dict) else 0),
                    "mastery": (b.get("mastery") if isinstance(b, dict) else "learning"),
                }
                for cid, b in beliefs.items()
            ),
            key=lambda c: c["p_known"] or 0,
            reverse=True,
        )[:15]

        # Total interactions
        count_result = await db.execute(
            select(func.count()).select_from(MiraEpisodic).where(
                MiraEpisodic.user_id == user.user_id
            )
        )
        total_interactions = int(count_result.scalar() or 0)

        # Personal prompt observations
        observations = []
        pp = profile.personal_prompt or {}
        if isinstance(pp, dict):
            obs_list = pp.get("observations", [])
            if isinstance(obs_list, list):
                observations = [str(o) for o in obs_list[-15:]]

        # Quota
        q = await quota.get_status(user.user_id, tier)

    return {
        "user_id": user.user_id,
        "tier": profile.tier,
        "concepts_tracked": len(beliefs),
        "total_interactions": total_interactions,
        "dominant_style": dominant,
        "bandit_stats": bandit_stats,
        "personal_prompt_observations": observations,
        "top_concepts": concepts,
        "quota_used": q.used,
        "quota_limit": q.limit,
        "quota_remaining": q.remaining,
    }


# =============================================================================
# QUOTA
# =============================================================================
@router.get("/quota")
async def quota_endpoint(
    request: Request,
    user: AuthenticatedUser = Depends(require_enabled_user),
):
    db_factory = _get_db_factory(request)
    quota = _get_quota(request)

    async with db_factory() as db:
        profile = await db.get(MiraUserProfile, user.user_id)
        tier = Tier(profile.tier) if profile else Tier.FREE

    status_obj = await quota.get_status(user.user_id, tier)
    return {
        "tier": tier.value,
        "used": status_obj.used,
        "limit": status_obj.limit,
        "remaining": status_obj.remaining,
        "resets_at": status_obj.period_resets_at.isoformat(),
    }


# =============================================================================
# RECENT
# =============================================================================
@router.get("/recent")
async def recent(
    request: Request,
    user: AuthenticatedUser = Depends(require_enabled_user),
    limit: int = 20,
):
    db_factory = _get_db_factory(request)
    limit = max(1, min(50, limit))

    async with db_factory() as db:
        result = await db.execute(
            select(MiraEpisodic)
            .where(MiraEpisodic.user_id == user.user_id)
            .order_by(MiraEpisodic.created_at.desc())
            .limit(limit)
        )
        rows = result.scalars().all()

    return [
        {
            "id": r.id,
            "interaction_type": r.interaction_type,
            "course_id": r.course_id,
            "module_id": r.module_id,
            "depth": r.depth,
            "style_used": r.style_used,
            "payload": r.payload,
            "cost_inr": float(r.cost_inr) if r.cost_inr is not None else 0,
            "created_at": r.created_at.isoformat() if r.created_at else None,
        }
        for r in rows
    ]


# =============================================================================
# PREFERENCES
# =============================================================================
@router.get("/preferences")
async def get_prefs(
    request: Request,
    user: AuthenticatedUser = Depends(require_enabled_user),
):
    db_factory = _get_db_factory(request)
    async with db_factory() as db:
        prefs = await get_user_preferences(db, user.user_id)
    return prefs.to_dict()


@router.patch("/preferences")
async def update_prefs(
    request: Request,
    payload: PreferencesIn,
    user: AuthenticatedUser = Depends(require_enabled_user),
):
    db_factory = _get_db_factory(request)
    updates = {k: v for k, v in payload.model_dump().items() if v is not None}
    if not updates:
        raise HTTPException(400, "No updates provided")

    async with db_factory() as db:
        # Ensure profile exists
        profile = await db.get(MiraUserProfile, user.user_id)
        if profile is None:
            profile = MiraUserProfile(
                user_id=user.user_id,
                tier="plus",
                quota_period_resets_at=_first_of_next_month(),
                beliefs={},
                bandit_state={},
                personal_prompt={},
                preferences={},
            )
            db.add(profile)
            await db.commit()
        prefs = await update_user_preferences(db, user.user_id, updates)

    return prefs.to_dict()


# =============================================================================
# ADMIN
# =============================================================================
@admin_router.get("/stats", dependencies=[Depends(require_admin)])
async def admin_stats(request: Request):
    db_factory = _get_db_factory(request)
    async with db_factory() as db:
        r1 = await db.execute(select(func.count()).select_from(MiraUserProfile))
        r2 = await db.execute(select(func.count()).select_from(MiraEpisodic))
        r3 = await db.execute(
            select(func.coalesce(func.sum(MiraEpisodic.cost_inr), 0)).select_from(
                MiraEpisodic
            )
        )
        r4 = await db.execute(
            select(func.count()).select_from(MiraEpisodic).where(
                MiraEpisodic.created_at > datetime.utcnow().replace(hour=0, minute=0, second=0)
            )
        )

    return {
        "total_users": int(r1.scalar() or 0),
        "total_interactions": int(r2.scalar() or 0),
        "total_cost_inr": float(r3.scalar() or 0),
        "interactions_today": int(r4.scalar() or 0),
    }


@admin_router.get("/users", dependencies=[Depends(require_admin)])
async def admin_users(request: Request):
    db_factory = _get_db_factory(request)
    async with db_factory() as db:
        result = await db.execute(
            select(
                MiraUserProfile.user_id,
                MiraUserProfile.tier,
                MiraUserProfile.created_at,
                MiraUserProfile.quota_used_this_period,
            ).order_by(MiraUserProfile.user_id)
        )
        rows = result.all()

    return [
        {
            "user_id": r.user_id,
            "tier": r.tier,
            "quota_used_this_period": r.quota_used_this_period,
            "created_at": r.created_at.isoformat() if r.created_at else None,
        }
        for r in rows
    ]


@admin_router.get("/feature-flags", dependencies=[Depends(require_admin)])
async def admin_feature_flags(request: Request):
    flags = _get_feature_flags(request)
    return flags.snapshot()


@admin_router.post("/set-tier", dependencies=[Depends(require_admin)])
async def admin_set_tier(request: Request, payload: SetTierIn):
    db_factory = _get_db_factory(request)
    async with db_factory() as db:
        profile = await db.get(MiraUserProfile, payload.user_id)
        if profile is None:
            raise HTTPException(404, f"No MIRA profile for user {payload.user_id}")
        profile.tier = payload.tier
        await db.commit()
    return {"user_id": payload.user_id, "tier": payload.tier}


@admin_router.get("/export/{user_id}", dependencies=[Depends(require_admin)])
async def admin_export_user(request: Request, user_id: int):
    """GDPR-style data export for one user."""
    db_factory = _get_db_factory(request)
    async with db_factory() as db:
        profile = await db.get(MiraUserProfile, user_id)
        if profile is None:
            raise HTTPException(404, f"No MIRA data for user {user_id}")

        result = await db.execute(
            select(MiraEpisodic)
            .where(MiraEpisodic.user_id == user_id)
            .order_by(MiraEpisodic.created_at)
        )
        episodic_rows = result.scalars().all()

    return {
        "user_id": user_id,
        "profile": {
            "tier": profile.tier,
            "beliefs": profile.beliefs,
            "bandit_state": profile.bandit_state,
            "personal_prompt": profile.personal_prompt,
            "preferences": profile.preferences,
            "created_at": profile.created_at.isoformat() if profile.created_at else None,
        },
        "episodic": [
            {
                "id": r.id,
                "interaction_type": r.interaction_type,
                "course_id": r.course_id,
                "module_id": r.module_id,
                "section_id": r.section_id,
                "depth": r.depth,
                "style_used": r.style_used,
                "payload": r.payload,
                "cost_inr": float(r.cost_inr) if r.cost_inr is not None else 0,
                "created_at": r.created_at.isoformat() if r.created_at else None,
            }
            for r in episodic_rows
        ],
    }


@admin_router.get("/export-all.csv", dependencies=[Depends(require_admin)])
async def admin_export_all_csv(request: Request):
    """Dump all MIRA interactions as CSV for spreadsheet analysis."""
    db_factory = _get_db_factory(request)

    async def _stream():
        buf = io.StringIO()
        writer = csv.writer(buf)
        writer.writerow([
            "id", "user_id", "interaction_type", "course_id", "module_id",
            "depth", "style_used", "model", "tokens_in", "tokens_out",
            "cost_inr", "created_at",
        ])
        yield buf.getvalue()
        buf.seek(0); buf.truncate()

        async with db_factory() as db:
            result = await db.execute(
                select(MiraEpisodic).order_by(MiraEpisodic.created_at.desc()).limit(10000)
            )
            for r in result.scalars():
                writer.writerow([
                    r.id, r.user_id, r.interaction_type, r.course_id, r.module_id,
                    r.depth, r.style_used, r.model,
                    (r.tokens_in_fresh or 0) + (r.tokens_in_cached or 0),
                    r.tokens_out or 0,
                    float(r.cost_inr or 0),
                    r.created_at.isoformat() if r.created_at else "",
                ])
                chunk = buf.getvalue()
                if chunk:
                    yield chunk
                    buf.seek(0); buf.truncate()

    return StreamingResponse(
        _stream(),
        media_type="text/csv",
        headers={"Content-Disposition": "attachment; filename=mira_interactions.csv"},
    )


# =============================================================================
# HELPERS
# =============================================================================
def _first_of_next_month() -> datetime:
    from datetime import timezone
    now = datetime.now(timezone.utc)
    if now.month == 12:
        return now.replace(year=now.year + 1, month=1, day=1, hour=0, minute=0, second=0, microsecond=0)
    return now.replace(month=now.month + 1, day=1, hour=0, minute=0, second=0, microsecond=0)
