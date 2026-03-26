"""
Firebase Admin SDK initialization.

The SDK is initialized once at import time using one of two strategies:
  1. FIREBASE_CREDENTIALS_JSON  – a JSON string of the service account (ideal for Cloud Run secrets).
  2. FIREBASE_CREDENTIALS_PATH  – a file system path to the service account JSON (ideal for Docker volume mounts).

If neither is set the app will fail fast at startup, which is preferable to a
silent misconfiguration that surfaces only at runtime.
"""

import os
import json
import logging

import firebase_admin
from firebase_admin import credentials, auth as firebase_auth
from fastapi import HTTPException, status

logger = logging.getLogger("firebase")

_app: firebase_admin.App | None = None


def _init_firebase() -> firebase_admin.App:
    """Initialize Firebase Admin SDK exactly once and return the App instance."""
    global _app
    if _app is not None:
        return _app

    cred_json = os.getenv("FIREBASE_CREDENTIALS_JSON")
    cred_path = os.getenv("FIREBASE_CREDENTIALS_PATH")

    if cred_json:
        # Inline JSON – preferred for Cloud Run / secrets managers
        cred_dict = json.loads(cred_json)
        cred = credentials.Certificate(cred_dict)
        logger.info("Firebase Admin SDK initialized from FIREBASE_CREDENTIALS_JSON env var.")
    elif cred_path:
        # File path – preferred for local dev / Docker volume mounts
        cred = credentials.Certificate(cred_path)
        logger.info("Firebase Admin SDK initialized from file: %s", cred_path)
    else:
        raise RuntimeError(
            "Firebase credentials are not configured. "
            "Set FIREBASE_CREDENTIALS_JSON (JSON string) or "
            "FIREBASE_CREDENTIALS_PATH (path to JSON file)."
        )

    _app = firebase_admin.initialize_app(cred)
    return _app


# Do NOT initialize at module import time so startup failures are avoided.
# It will be lazy-initialized on the first call to verify_firebase_id_token.
# _init_firebase()

def verify_firebase_id_token(id_token: str) -> dict:
    # Ensure Firebase is initialized before verifying
    _init_firebase()
    """
    Verify a Firebase ID token and return its decoded claims.

    Raises HTTP 401 if the token is invalid, expired, or revoked.
    """
    try:
        decoded = firebase_auth.verify_id_token(id_token, check_revoked=True)
        return decoded
    except firebase_auth.RevokedIdTokenError:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Firebase token has been revoked. Please sign in again.",
        )
    except firebase_auth.ExpiredIdTokenError:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Firebase token has expired. Please sign in again.",
        )
    except firebase_auth.InvalidIdTokenError:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid Firebase token.",
        )
    except Exception as exc:
        logger.error("Unexpected Firebase token verification error: %s", exc)
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Could not verify Google identity.",
        )
