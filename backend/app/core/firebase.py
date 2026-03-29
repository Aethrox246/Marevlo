"""
Firebase Admin SDK initialization.

The SDK is initialized once at import time using one of two strategies:
  1. FIREBASE_CREDENTIALS_JSON  – a JSON string of the service account (ideal for Cloud Run secrets).
  2. FIREBASE_CREDENTIALS_PATH  – a file system path to the service account JSON (ideal for Docker volume mounts).

If neither is set the app will fail fast at startup, which is preferable to a
silent misconfiguration that surfaces only at runtime.
"""

import logging

import firebase_admin
from firebase_admin import credentials, auth as firebase_auth
from fastapi import HTTPException, status

logger = logging.getLogger("firebase")

_app: firebase_admin.App | None = None


def _init_firebase() -> firebase_admin.App:
    global _app
    if _app is not None:
        return _app

    # 🔥 Load Firebase credentials from Secret Manager (mounted file)
    cred = credentials.Certificate("/secrets/firebase-service-account")

    _app = firebase_admin.initialize_app(cred)
    logger.info("Firebase initialized from Secret Manager")

    return _app


def verify_firebase_id_token(id_token: str) -> dict:
    _init_firebase()

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
        logger.error("Unexpected Firebase error: %s", exc)
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Could not verify Google identity.",
        )