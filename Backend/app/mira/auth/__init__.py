"""MIRA auth layer — verifies Firebase ID tokens and resolves to Marevlo user_id."""
from app.mira.auth.firebase import (
    FirebaseAuth,
    FirebaseAuthError,
    AuthenticatedUser,
    get_current_user_dep,
)

__all__ = [
    "FirebaseAuth",
    "FirebaseAuthError",
    "AuthenticatedUser",
    "get_current_user_dep",
]
