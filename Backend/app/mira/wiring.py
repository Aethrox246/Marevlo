"""MIRA wiring helper — simplifies adding MIRA to an existing FastAPI app.

Usage in your existing app/main.py:

    from fastapi import FastAPI
    from contextlib import asynccontextmanager
    from app.mira.wiring import init_mira_on_startup, shutdown_mira
    from app.mira.router import router as mira_router, admin_router as mira_admin_router

    @asynccontextmanager
    async def lifespan(app: FastAPI):
        # ...your existing startup code...
        await init_mira_on_startup(app)
        yield
        await shutdown_mira(app)

    app = FastAPI(lifespan=lifespan, ...)
    app.include_router(mira_router)
    app.include_router(mira_admin_router)

This file reads config from environment variables and stores state on
app.state.mira = {...} which the router reads at request time.
"""
from __future__ import annotations

import logging
import os
from contextlib import asynccontextmanager

from fastapi import FastAPI

logger = logging.getLogger(__name__)


async def init_mira_on_startup(app: FastAPI) -> None:
    """Initialize MIRA subsystems and attach them to app.state.mira.

    Env vars required:
      ANTHROPIC_API_KEY              (required for real Claude calls)
      FIREBASE_CREDENTIALS_JSON      (or FIREBASE_CREDENTIALS_PATH)
      DATABASE_URL                   (used only if MIRA's own session factory needed)

    Env vars optional:
      OPENAI_API_KEY                 (enables OpenAI embeddings; else FakeEmbedder)
      QDRANT_URL                     (defaults to http://qdrant:6333)
      REDIS_URL                      (defaults to redis://redis:6379/0)
      MIRA_ENABLED_FOR_ALL           ("true"/"false")
      MIRA_ENABLED_USER_IDS          ("1,2,3,4,5,6")
      MIRA_ADMIN_USER_IDS            ("1")
      MIRA_GLOBAL_KILL               ("true"/"false")
      MIRA_ADMIN_TOKEN               (static token for /admin/mira/*)
      MIRA_DEV_MODE_ALLOW_HEADER_UID ("true" to accept X-Dev-User-Id; dev only)
    """
    from app.mira.auth.firebase import FirebaseAuth
    from app.mira.claude.client import ClaudeClient, MockClaudeClient
    from app.mira.feature_flags import FeatureFlagConfig, FeatureFlags
    from app.mira.quota_enforcer import (
        InMemoryQuotaBackend,
        QuotaEnforcer,
        RedisQuotaBackend,
    )
    from app.mira.retrieval.qdrant_client import (
        InMemoryVectorStore,
        QdrantVectorStore,
    )
    from app.mira.retrieval.retriever import (
        FakeEmbedder,
        OpenAIEmbedder,
        Retriever,
    )

    # 1. Claude client
    anthropic_key = os.environ.get("ANTHROPIC_API_KEY", "").strip()
    if anthropic_key:
        claude = ClaudeClient(api_key=anthropic_key)
        logger.info("[mira] Using real ClaudeClient")
    else:
        claude = MockClaudeClient()
        logger.warning(
            "[mira] ANTHROPIC_API_KEY not set; using MockClaudeClient. "
            "Do NOT use in production."
        )

    # 2. Embedder
    openai_key = os.environ.get("OPENAI_API_KEY", "").strip()
    if openai_key:
        embedder = OpenAIEmbedder(api_key=openai_key)
        logger.info("[mira] Using OpenAIEmbedder")
    else:
        embedder = FakeEmbedder(dimension=128)
        logger.warning(
            "[mira] OPENAI_API_KEY not set; using FakeEmbedder (lower-quality retrieval)"
        )

    # 3. Vector store
    qdrant_url = os.environ.get("QDRANT_URL", "http://qdrant:6333")
    try:
        vector_store = QdrantVectorStore(url=qdrant_url)
        await vector_store.ensure_collection()
        logger.info("[mira] Qdrant connected at %s", qdrant_url)
    except Exception as e:
        logger.warning("[mira] Qdrant unavailable (%s); using InMemoryVectorStore", e)
        vector_store = InMemoryVectorStore()

    # 4. Retriever
    retriever = Retriever(embedder=embedder, vector_store=vector_store)

    # 5. Quota backend (Redis preferred, in-memory fallback)
    redis_url = os.environ.get("REDIS_URL", "redis://redis:6379/0")
    try:
        quota_backend = RedisQuotaBackend(redis_url=redis_url)
        await quota_backend.ping()
        logger.info("[mira] Redis quota backend connected")
    except Exception as e:
        logger.warning("[mira] Redis unavailable (%s); using InMemoryQuotaBackend", e)
        quota_backend = InMemoryQuotaBackend()

    quota_enforcer = QuotaEnforcer(backend=quota_backend)

    # 6. Auth — uses main backend's JWT_SECRET (no Firebase round-trip).
    # The class is still called FirebaseAuth for import-compat; it now decodes
    # Marevlo access tokens and resolves users.id.
    dev_fake = os.environ.get("MIRA_DEV_FAKE_FIREBASE_UID")  # tests only
    firebase_auth = FirebaseAuth(dev_mode_fake_uid=dev_fake)

    # 7. Feature flags
    feature_flags = FeatureFlags(FeatureFlagConfig.from_env())

    # 8. DB factory — engineer must wire this to Marevlo's existing session
    # If you already store an async session factory on app.state (e.g.
    # app.state.db_session_factory), reuse it. Otherwise create one from
    # DATABASE_URL here.
    db_factory = await _resolve_db_factory(app)

    # 9. Store on app.state
    app.state.mira = {
        "claude": claude,
        "retriever": retriever,
        "vector_store": vector_store,
        "embedder": embedder,
        "quota_enforcer": quota_enforcer,
        "firebase_auth": firebase_auth,
        "feature_flags": feature_flags,
        "db_factory": db_factory,
    }
    logger.info("[mira] startup complete")


async def shutdown_mira(app: FastAPI) -> None:
    state = getattr(app.state, "mira", None)
    if state is None:
        return
    # Close anything that needs closing
    vs = state.get("vector_store")
    if hasattr(vs, "aclose"):
        try:
            await vs.aclose()
        except Exception:
            pass
    logger.info("[mira] shutdown complete")


async def _resolve_db_factory(app: FastAPI):
    """Return an async context manager factory that yields an AsyncSession.

    Priority:
      1. app.state.async_session_factory (Marevlo's existing)
      2. app.state.db_session_factory
      3. Create one from DATABASE_URL
    """
    existing = getattr(app.state, "async_session_factory", None) \
        or getattr(app.state, "db_session_factory", None)

    if existing:
        logger.info("[mira] Reusing Marevlo's async_session_factory")

        @asynccontextmanager
        async def _factory():
            async with existing() as session:
                yield session

        return _factory

    # Create our own. The main backend uses sync psycopg2; MIRA needs an async
    # engine, so we swap the driver in the URL — same database, separate pool.
    from sqlalchemy.ext.asyncio import async_sessionmaker, create_async_engine

    db_url = os.environ.get("DATABASE_URL")
    if not db_url:
        raise RuntimeError(
            "[mira] DATABASE_URL not set and no existing session factory on app.state"
        )

    if "+psycopg2" in db_url:
        db_url = db_url.replace("+psycopg2", "+asyncpg")
    elif db_url.startswith("postgresql://"):
        db_url = db_url.replace("postgresql://", "postgresql+asyncpg://", 1)

    engine = create_async_engine(db_url, echo=False, pool_pre_ping=True)
    SessionLocal = async_sessionmaker(engine, expire_on_commit=False)

    @asynccontextmanager
    async def _factory():
        async with SessionLocal() as session:
            yield session

    logger.info("[mira] Created own async_session_factory from DATABASE_URL")
    return _factory
