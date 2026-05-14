"""
MIRA auth — uses the main backend's JWT.

Originally MIRA verified raw Firebase ID tokens on every request and looked up
the user by `users.firebase_uid`. After the integration we let the main
backend handle Firebase login at `/auth/google`; from then on the frontend has
a Marevlo-issued JWT in localStorage. MIRA decodes that same JWT here, so
there is exactly one auth path and no extra Firebase round-trip per request.

The file is named `firebase.py` purely for backward compat with existing
imports inside MIRA — there is no Firebase code in it anymore.
"""
from __future__ import annotations

import logging
import os
from dataclasses import dataclass

from fastapi import Header, HTTPException, Request, status
from sqlalchemy import text
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.exceptions import TokenError
from app.core.security import decode_token

logger = logging.getLogger(__name__)


class FirebaseAuthError(Exception):
    """Raised when JWT verification or user resolution fails."""


@dataclass
class AuthenticatedUser:
    """What the rest of MIRA receives after auth."""
    user_id: int
    firebase_uid: str           # kept for log compat; populated as f"jwt-{user_id}"
    email: str | None = None
    display_name: str | None = None


class FirebaseAuth:
    """Decodes Marevlo's access JWT and resolves the user.

    `dev_mode_fake_uid` keeps the in-MIRA test path working — pass an integer
    user_id (as a string) to short-circuit verification.
    """

    def __init__(
        self,
        *,
        credentials_json: str | None = None,   # ignored, kept for wiring compat
        credentials_path: str | None = None,   # ignored
        dev_mode_fake_uid: str | None = None,
    ):
        self._dev_mode_fake_uid = dev_mode_fake_uid

    async def authenticate(self, db: AsyncSession, token: str) -> AuthenticatedUser:
        if self._dev_mode_fake_uid is not None:
            try:
                uid = int(self._dev_mode_fake_uid)
            except ValueError as e:
                raise FirebaseAuthError("Bad dev fake uid") from e
            return await self._resolve(db, uid)

        try:
            payload = decode_token(token, expected_type="access")
            user_id = int(payload["sub"])
        except (TokenError, KeyError, TypeError, ValueError) as e:
            raise FirebaseAuthError(f"Invalid access token: {e}") from e

        return await self._resolve(db, user_id)

    async def _resolve(self, db: AsyncSession, user_id: int) -> AuthenticatedUser:
        result = await db.execute(
            text("SELECT id, email, username FROM users WHERE id = :id LIMIT 1"),
            {"id": user_id},
        )
        row = result.first()
        if row is None:
            raise FirebaseAuthError(f"user_id {user_id} not found")
        return AuthenticatedUser(
            user_id=int(row.id),
            firebase_uid=f"jwt-{row.id}",
            email=row.email,
            display_name=row.username,
        )


def get_current_user_dep(
    *,
    firebase_auth: FirebaseAuth,
    get_db,
):
    """FastAPI dependency factory — kept for wiring compatibility."""
    dev_mode_header = (
        os.environ.get("MIRA_DEV_MODE_ALLOW_HEADER_UID", "false").lower() == "true"
    )

    async def _dep(
        request: Request,
        authorization: str | None = Header(None),
        x_dev_user_id: str | None = Header(None, alias="X-Dev-User-Id"),
    ) -> AuthenticatedUser:
        if dev_mode_header and x_dev_user_id and x_dev_user_id.isdigit():
            async with get_db() as db:
                result = await db.execute(
                    text("SELECT id, email, username FROM users WHERE id = :id"),
                    {"id": int(x_dev_user_id)},
                )
                row = result.first()
                if row is None:
                    raise HTTPException(404, f"User {x_dev_user_id} not found")
                return AuthenticatedUser(
                    user_id=int(row.id),
                    firebase_uid=f"dev-{row.id}",
                    email=row.email,
                    display_name=row.username,
                )

        if not authorization or not authorization.lower().startswith("bearer "):
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Missing or malformed Authorization header",
            )
        token = authorization.split(" ", 1)[1].strip()

        async with get_db() as db:
            try:
                return await firebase_auth.authenticate(db, token)
            except FirebaseAuthError as e:
                raise HTTPException(
                    status_code=status.HTTP_401_UNAUTHORIZED,
                    detail=f"Authentication failed: {e}",
                ) from e

    return _dep
