from fastapi import APIRouter, Depends, HTTPException, status, Request
from fastapi.security import OAuth2PasswordRequestForm
from sqlalchemy.orm import Session
from sqlalchemy import select, text
from datetime import datetime, timezone, timedelta
import random
from redis import Redis
from redis.exceptions import RedisError
import logging

from app.core.dependencies import get_db
from app.auth.models.user import User
from app.auth.models.session import UserSession
from app.auth.models.email_otp import EmailOTP
from app.auth.schemas.user import UserCreate, UserOut
from app.auth.schemas.auth import Token, ForgotPasswordRequest, ResetPasswordRequest, GoogleLoginRequest
from app.auth.utils.security import (
    verify_password,
    create_access_token,
    create_refresh_token,
    decode_token,
    get_password_hash,
)
from app.auth.utils.email import send_otp_email
from app.auth.dependencies import oauth2_scheme, limiter
from app.core.config import REDIS_URL
from app.core.firebase import verify_firebase_id_token
from app.core.activity_model import ActivityLog


router = APIRouter(prefix="/auth", tags=["auth"])

redis = Redis.from_url(REDIS_URL, decode_responses=True)
logger = logging.getLogger("auth")


def _log_login_once_per_day(db: Session, user_id: int, source: str) -> None:
    exists = db.execute(
        text("""
            SELECT 1
            FROM activity_logs
            WHERE user_id = :uid
              AND action = 'login'
              AND DATE(created_at AT TIME ZONE 'UTC') = DATE(NOW() AT TIME ZONE 'UTC')
            LIMIT 1
        """),
        {"uid": user_id},
    ).scalar()
    if not exists:
        db.add(ActivityLog(user_id=user_id, action="login", meta={"source": source}))


@router.post("/login", response_model=Token)
@limiter.limit("10/minute")
def login(
    request: Request,
    form_data: OAuth2PasswordRequestForm = Depends(),
    db: Session = Depends(get_db),
):
    user = db.execute(select(User).where(User.email == form_data.username)).scalar_one_or_none()

    if not user or not verify_password(form_data.password, user.password_hash):
        raise HTTPException(status_code=401, detail="Incorrect email or password")

    if not user.is_active or (user.suspended_until and user.suspended_until > datetime.now(timezone.utc)) or user.deleted_at:
        raise HTTPException(status_code=403, detail="Account inactive, suspended or deleted")

    user.last_login_at = datetime.now(timezone.utc)
    ip_address = request.client.host if request.client else None
    user_agent = request.headers.get("user-agent")
    session = UserSession(
        user_id=user.id,
        ip_address=ip_address,
        device=(user_agent[:100] if user_agent else None),
    )
    _log_login_once_per_day(db, user.id, "password")
    db.add(session)
    db.commit()
    db.refresh(session)

    access_token = create_access_token({"sub": str(user.id), "sid": str(session.id)})
    refresh_token = create_refresh_token({"sub": str(user.id), "sid": str(session.id)})

    jti = decode_token(refresh_token)["jti"]
    try:
        redis.setex(f"refresh:{jti}", 30 * 24 * 3600, user.id)
    except RedisError as exc:
        logger.warning("Redis unavailable during login; skipping refresh token storage: %s", exc)

    return {
        "access_token": access_token,
        "refresh_token": refresh_token,
        "token_type": "bearer",
    }

@router.get("/me", response_model=UserOut)
def me(
    token: str = Depends(oauth2_scheme),
    db: Session = Depends(get_db),
):
    payload = decode_token(token)
    user_id = int(payload["sub"])
    user = db.get(User, user_id)
    if not user or not user.is_active:
        raise HTTPException(status_code=401, detail="User not found or inactive")
    return user


@router.post("/refresh", response_model=Token)
@limiter.limit("20/minute")
def refresh(
    request: Request,
    token: str = Depends(oauth2_scheme),
    db: Session = Depends(get_db),
):
    payload = decode_token(token)
    jti = payload["jti"]
    user_id = int(payload["sub"])

    try:
        stored_user_id = redis.get(f"refresh:{jti}")
    except RedisError as exc:
        logger.warning("Redis unavailable during refresh: %s", exc)
        raise HTTPException(status_code=503, detail="Auth cache unavailable. Please login again.")
    if not stored_user_id or int(stored_user_id) != user_id:
        raise HTTPException(status_code=401, detail="Invalid or revoked refresh token")

    user = db.get(User, user_id)
    if not user or not user.is_active:
        raise HTTPException(status_code=401, detail="User not found or inactive")

    new_access = create_access_token({"sub": str(user.id)})
    new_refresh = create_refresh_token({"sub": str(user.id)})

    try:
        redis.delete(f"refresh:{jti}")
    except RedisError as exc:
        logger.warning("Redis unavailable during refresh cleanup: %s", exc)
    new_jti = decode_token(new_refresh)["jti"]
    try:
        redis.setex(f"refresh:{new_jti}", 30 * 24 * 3600, user.id)
    except RedisError as exc:
        logger.warning("Redis unavailable during refresh save: %s", exc)

    return {
        "access_token": new_access,
        "refresh_token": new_refresh,
        "token_type": "bearer",
    }


@router.post("/logout")
@limiter.limit("10/minute")
def logout(
    request: Request,
    token: str = Depends(oauth2_scheme),
    db: Session = Depends(get_db),
):
    payload = decode_token(token)
    jti = payload["jti"]
    try:
        redis.delete(f"refresh:{jti}")
    except RedisError as exc:
        logger.warning("Redis unavailable during logout: %s", exc)
    user_id = int(payload["sub"])
    session_id = payload.get("sid")
    # Best-effort: mark latest session as logged out
    if session_id:
        session = db.get(UserSession, int(session_id))
    else:
        session = db.execute(
            select(UserSession)
            .where(UserSession.user_id == user_id)
            .order_by(UserSession.login_time.desc())
        ).scalar_one_or_none()
    if session and session.logout_time is None:
        session.logout_time = datetime.now(timezone.utc)
        db.commit()
    return {"message": "Logged out successfully"}


@router.post("/password/forgot")
@limiter.limit("5/minute")
def forgot_password(
    request: Request,
    payload: ForgotPasswordRequest,
    db: Session = Depends(get_db),
):
    user = db.execute(select(User).where(User.email == payload.email)).scalar_one_or_none()
    if not user:
        return {"message": "If the email exists, an OTP has been sent."}

    otp = str(random.randint(100000, 999999))
    otp_hash = get_password_hash(otp)

    # Mark previous OTPs as used (overwrite behavior)
    db.query(EmailOTP).filter(
        EmailOTP.user_id == user.id,
        EmailOTP.used_at.is_(None)
    ).update({EmailOTP.used_at: datetime.now(timezone.utc)})

    otp_entry = EmailOTP(
        user_id=user.id,
        code_hash=otp_hash,
        expires_at=datetime.now(timezone.utc) + timedelta(minutes=10),
    )
    db.add(otp_entry)
    db.commit()

    send_otp_email(user.email, otp)

    return {"message": "If the email exists, an OTP has been sent."}


@router.post("/password/reset")
@limiter.limit("5/minute")
def reset_password(
    request: Request,
    payload: ResetPasswordRequest,
    db: Session = Depends(get_db),
):
    user = db.execute(select(User).where(User.email == payload.email)).scalar_one_or_none()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    otp_entry = db.execute(
        select(EmailOTP)
        .where(EmailOTP.user_id == user.id)
        .where(EmailOTP.used_at.is_(None))
        .where(EmailOTP.expires_at > datetime.now(timezone.utc))
        .order_by(EmailOTP.created_at.desc())
        .limit(1)
    ).scalar_one_or_none()

    if not otp_entry or not verify_password(payload.otp, otp_entry.code_hash):
        raise HTTPException(status_code=400, detail="Invalid or expired OTP")

    otp_entry.used_at = datetime.now(timezone.utc)
    user.password_hash = get_password_hash(payload.new_password)
    user.last_login_at = None

    # Invalidate any other active OTPs for this user
    db.query(EmailOTP).filter(
        EmailOTP.user_id == user.id,
        EmailOTP.used_at.is_(None)
    ).update({EmailOTP.used_at: datetime.now(timezone.utc)})

    try:
        redis.delete(f"refresh:*")
    except RedisError as exc:
        logger.warning("Redis unavailable during password reset cleanup: %s", exc)

    db.commit()

    return {"message": "Password reset successful. Please login again."}


@router.post("/signup", response_model=UserOut, status_code=status.HTTP_201_CREATED)
@limiter.limit("5/minute")
def signup(
    request: Request,
    payload: UserCreate,
    db: Session = Depends(get_db),
):
    existing_email = db.execute(select(User).where(User.email == payload.email))
    if existing_email.scalar_one_or_none():
        raise HTTPException(status_code=400, detail="Email already registered")

    existing_username = db.execute(select(User).where(User.username == payload.username))
    if existing_username.scalar_one_or_none():
        raise HTTPException(status_code=400, detail="Username already taken")

    hashed_password = get_password_hash(payload.password)

    new_user = User(
        username=payload.username,
        email=payload.email,
        password_hash=hashed_password,
        is_active=True,
    )

    db.add(new_user)
    db.commit()
    db.refresh(new_user)

    return new_user


@router.post("/google", response_model=Token)
@limiter.limit("10/minute")
def google_login(
    request: Request,
    body: GoogleLoginRequest,
    db: Session = Depends(get_db),
):
    """
    Verify a Firebase Google ID token and return system-issued JWT tokens.

    Flow:
      1. Verify the Firebase ID token (Google identity).
      2. Lookup user by google_uid.
      3. If not found, lookup by email (account linking for existing email/password users).
      4. If still not found, create a new user (no password — Google-only account).
      5. Issue a session, access token, and refresh token — exactly as for normal login.
    """
    # 1. Verify identity via Firebase Admin SDK
    claims = verify_firebase_id_token(body.id_token)
    google_uid: str = claims["uid"]
    email: str = claims.get("email", "")
    name: str = claims.get("name", "")

    if not email:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Google account must have an email address.",
        )

    # 2. Try to find user by google_uid
    user = db.execute(
        select(User).where(User.google_uid == google_uid)
    ).scalar_one_or_none()

    # 3. Try to find by email (account linking)
    if user is None:
        user = db.execute(
            select(User).where(User.email == email)
        ).scalar_one_or_none()
        if user is not None:
            # Link this Google account to the existing email/password user
            user.google_uid = google_uid
            db.commit()
            db.refresh(user)

    # 4. Create a new user (Google-only account)
    if user is None:
        # Auto-generate a safe username from the email local-part
        base_username = email.split("@")[0].replace(".", "_").replace("+", "_")[:40]
        username = base_username
        suffix = 1
        while db.execute(select(User).where(User.username == username)).scalar_one_or_none():
            username = f"{base_username}_{suffix}"
            suffix += 1

        user = User(
            username=username,
            email=email,
            password_hash=None,     # No password for Google-only accounts
            google_uid=google_uid,
            is_active=True,
        )
        db.add(user)
        db.commit()
        db.refresh(user)

    # Guard: account must be active
    if not user.is_active or (user.suspended_until and user.suspended_until > datetime.now(timezone.utc)) or user.deleted_at:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Account inactive, suspended, or deleted")

    # 5. Create a DB session and issue our own JWTs (identical to normal login)
    user.last_login_at = datetime.now(timezone.utc)
    ip_address = request.client.host if request.client else None
    user_agent = request.headers.get("user-agent")
    session = UserSession(
        user_id=user.id,
        ip_address=ip_address,
        device=(user_agent[:100] if user_agent else None),
    )
    _log_login_once_per_day(db, user.id, "google")
    db.add(session)
    db.commit()
    db.refresh(session)

    access_token = create_access_token({"sub": str(user.id), "sid": str(session.id)})
    refresh_token = create_refresh_token({"sub": str(user.id), "sid": str(session.id)})

    jti = decode_token(refresh_token)["jti"]
    try:
        redis.setex(f"refresh:{jti}", 30 * 24 * 3600, user.id)
    except RedisError as exc:
        logger.warning("Redis unavailable during google login; skipping refresh token storage: %s", exc)

    return {
        "access_token": access_token,
        "refresh_token": refresh_token,
        "token_type": "bearer",
    }
