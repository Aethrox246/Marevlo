import os
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from slowapi import Limiter
from slowapi.util import get_remote_address
from slowapi.errors import RateLimitExceeded
from fastapi.responses import JSONResponse

# Routers
from app.submissions.routers.run import router as run_router
from app.auth.routers.auth import router as auth_router
from app.chat.routers.chat import router as chat_router
from app.feed.routers.feed import router as feed_router
from app.profile.routers.me import router as profile_router
# Import models so SQLAlchemy registers FK targets in metadata
from app.problems.models.problem import Problem  # noqa: F401
from app.auth.models.session import UserSession  # noqa: F401
from app.profile.models.profile import UserProfile  # noqa: F401
from app.profile.models.user_achievement import UserAchievement  # noqa: F401

limiter = Limiter(key_func=get_remote_address)

app = FastAPI(
    title="AlgoSphere API",
    version="1.0"
)

app.state.limiter = limiter
app.add_exception_handler(RateLimitExceeded, lambda request, exc: JSONResponse(
    status_code=429,
    content={"detail": "Rate limit exceeded"}
))

# CORS: restrict to known frontend URL(s)
_raw_origins = os.getenv(
    "FRONTEND_URL",
    "http://localhost:5173,https://marevlo.vercel.app"
)

_allow_origins = [o.strip() for o in _raw_origins.split(",") if o.strip()]
print("CORS ORIGINS:", _allow_origins)

app.add_middleware(
    CORSMiddleware,
    allow_origins=_allow_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Code execution router
app.include_router(run_router, prefix="/execute", tags=["execute"])

# Auth router
app.include_router(auth_router)

# Chat router
from app.chat.routers.ws import router as chat_ws_router
app.include_router(chat_router)
app.include_router(chat_ws_router)

# Feed router
app.include_router(feed_router)

# Profile router
app.include_router(profile_router)



@app.get("/")
def root():
    return {"message": "AlgoSphere backend running"}
