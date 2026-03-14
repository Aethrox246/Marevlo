from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

# Routers
from app.submissions.routers.run import router as run_router
from app.auth.routers.auth import router as auth_router
# Import models so SQLAlchemy registers FK targets in metadata
from app.problems.models.problem import Problem  # noqa: F401
from app.auth.models.session import UserSession  # noqa: F401

app = FastAPI(
    title="AlgoSphere API",
    version="1.0"
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://localhost:3000"],
    allow_origin_regex=r"^http://(localhost|127\.0\.0\.1):\d+$",
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Code execution router
app.include_router(run_router, prefix="/execute", tags=["execute"])

# Auth router
app.include_router(auth_router)

@app.get("/")
def root():
    return {"message": "AlgoSphere backend running"}
