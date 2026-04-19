import os
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.routes import notebook
from app.config import settings

app = FastAPI(title=settings.PROJECT_NAME)

# CORS — origins driven by env var, defaults to allow all
_raw_origins = os.getenv("CORS_ORIGINS", "*")
_origins = [o.strip() for o in _raw_origins.split(",") if o.strip()]

app.add_middleware(
    CORSMiddleware,
    allow_origins=_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(notebook.router, prefix="/api")

@app.get("/")
def root():
    return {"message": "Notebook backend running"}