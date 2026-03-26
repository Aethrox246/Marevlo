import os

IDE_API_URL = os.getenv(
    "IDE_API_URL",
    "http://localhost:4000"
)

JWT_SECRET = os.getenv("JWT_SECRET", "dev-secret-change-me")
ALGORITHM = os.getenv("JWT_ALGORITHM", "HS256")
ACCESS_TOKEN_EXPIRE_MINUTES = int(os.getenv("ACCESS_TOKEN_EXPIRE_MINUTES", "15"))
REFRESH_TOKEN_EXPIRE_DAYS = int(os.getenv("REFRESH_TOKEN_EXPIRE_DAYS", "30"))

REDIS_URL = os.getenv("REDIS_URL", "redis://redis:6379/0")
IDE_API_URL = os.getenv("IDE_API_URL", "http://ide-api:4000")

# Firebase credentials are read directly by app/core/firebase.py:
# FIREBASE_CREDENTIALS_JSON  - JSON string (Cloud Run / secrets manager)
# FIREBASE_CREDENTIALS_PATH  - file path (local dev / Docker volume mount)
