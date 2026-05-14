"""
Firebase Admin SDK — verifies Google ID tokens.

Lazy-initialized so the module can be imported during tests without a
real credentials file.
"""
from __future__ import annotations

import json
import logging
import os
from typing import Optional

from app.core.config import get_settings
from app.core.exceptions import TokenError

logger = logging.getLogger(__name__)

_app = None  # firebase_admin.App


def _init_firebase():
    global _app
    if _app is not None:
        return _app

    import firebase_admin
    from firebase_admin import credentials

    s = get_settings()
    if s.FIREBASE_CREDENTIALS_JSON:
        cred = credentials.Certificate(json.loads(s.FIREBASE_CREDENTIALS_JSON))
        _app = firebase_admin.initialize_app(cred)
        logger.info("firebase_init source=env")
        return _app

    if s.FIREBASE_CREDENTIALS_PATH and os.path.isfile(s.FIREBASE_CREDENTIALS_PATH):
        cred = credentials.Certificate(s.FIREBASE_CREDENTIALS_PATH)
        _app = firebase_admin.initialize_app(cred)
        logger.info("firebase_init source=file path=%s", s.FIREBASE_CREDENTIALS_PATH)
        return _app

    raise RuntimeError(
        "Firebase credentials not found. Set FIREBASE_CREDENTIALS_JSON or "
        "FIREBASE_CREDENTIALS_PATH."
    )


def verify_google_id_token(id_token: str) -> dict:
    """Verify a Firebase Google ID token and return the claims dict.

    Raises TokenError on any verification failure — handled by the global
    exception handler as 401.
    """
    _init_firebase()
    from firebase_admin import auth as firebase_auth

    try:
        return firebase_auth.verify_id_token(id_token, check_revoked=True)
    except firebase_auth.RevokedIdTokenError as exc:
        raise TokenError("Google token has been revoked") from exc
    except firebase_auth.ExpiredIdTokenError as exc:
        raise TokenError("Google token has expired") from exc
    except firebase_auth.InvalidIdTokenError as exc:
        raise TokenError("Invalid Google token") from exc
    except Exception as exc:
        logger.error("firebase_verify_unexpected_error err=%s", exc)
        raise TokenError("Could not verify Google identity") from exc
