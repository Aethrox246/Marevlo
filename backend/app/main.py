from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

# Routers
from app.submissions.routers.run import router as run_router
from app.auth.routers.auth import router as auth_router

app = FastAPI(
    title="Marevlo API",
    version="1.0"
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://localhost:3000"],
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
    return {"message": "Marevlo backend running"}
