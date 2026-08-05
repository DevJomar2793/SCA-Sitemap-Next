from datetime import datetime, timedelta, timezone

import jwt
from fastapi import Depends, HTTPException, Request, status
from jwt.exceptions import InvalidTokenError
from pydantic import EmailStr, TypeAdapter, ValidationError
from pwdlib import PasswordHash
from sqlalchemy import func, select
from sqlalchemy.orm import Session

from app.config import Settings
from app.database import get_db
from app.model import AdminUser

AUTH_COOKIE_NAME = "sca_session"
JWT_ALGORITHM = "HS256"
MINIMUM_SECRET_LENGTH = 32
MINIMUM_BOOTSTRAP_PASSWORD_LENGTH = 5

password_hash = PasswordHash.recommended()
DUMMY_PASSWORD_HASH = password_hash.hash("not-a-real-admin-password")
email_adapter = TypeAdapter(EmailStr)


def get_settings(request: Request) -> Settings:
    return request.app.state.settings


def normalize_email(email: str) -> str:
    return str(email_adapter.validate_python(email.strip())).casefold()


def validate_auth_settings(settings: Settings) -> str:
    secret = settings.auth_secret_key
    if not secret or len(secret) < MINIMUM_SECRET_LENGTH:
        raise RuntimeError(
            "AUTH_SECRET_KEY must be configured with at least 32 characters"
        )
    if settings.auth_session_minutes <= 0:
        raise RuntimeError("AUTH_SESSION_MINUTES must be greater than zero")
    return secret


def hash_password(password: str) -> str:
    return password_hash.hash(password)


def verify_password(password: str, stored_hash: str) -> bool:
    return password_hash.verify(password, stored_hash)


def create_session_token(admin: AdminUser, settings: Settings) -> str:
    secret = validate_auth_settings(settings)
    issued_at = datetime.now(timezone.utc)
    expires_at = issued_at + timedelta(minutes=settings.auth_session_minutes)
    return jwt.encode(
        {
            "sub": str(admin.id),
            "iat": issued_at,
            "exp": expires_at,
        },
        secret,
        algorithm=JWT_ALGORITHM,
    )


def decode_session_token(token: str, settings: Settings) -> int:
    secret = validate_auth_settings(settings)
    payload = jwt.decode(
        token,
        secret,
        algorithms=[JWT_ALGORITHM],
        options={"require": ["sub", "iat", "exp"]},
    )
    subject = payload.get("sub")
    if not isinstance(subject, str) or not subject.isdigit():
        raise InvalidTokenError("Invalid subject")
    return int(subject)


def authenticate_admin(email: str, password: str, db: Session) -> AdminUser | None:
    normalized_email = normalize_email(email)
    statement = select(AdminUser).where(
        func.lower(AdminUser.email) == normalized_email
    )
    admin = db.scalar(statement)

    if admin is None:
        verify_password(password, DUMMY_PASSWORD_HASH)
        return None

    if not verify_password(password, admin.password_hash) or not admin.is_active:
        return None
    return admin


def bootstrap_admin(db: Session, settings: Settings) -> AdminUser | None:
    validate_auth_settings(settings)
    if db.scalar(select(func.count()).select_from(AdminUser)):
        return None

    missing = [
        variable
        for variable, value in (
            ("ADMIN_EMAIL", settings.admin_email),
            ("ADMIN_PASSWORD", settings.admin_password),
            ("ADMIN_NAME", settings.admin_name),
        )
        if not value or not value.strip()
    ]
    if missing:
        raise RuntimeError(
            "The first administrator requires: " + ", ".join(missing)
        )

    assert settings.admin_email is not None
    assert settings.admin_password is not None
    assert settings.admin_name is not None

    if len(settings.admin_password) < MINIMUM_BOOTSTRAP_PASSWORD_LENGTH:
        raise RuntimeError(
            f"ADMIN_PASSWORD must be at least "
            f"{MINIMUM_BOOTSTRAP_PASSWORD_LENGTH} characters"
        )
    if len(settings.admin_password) > 128:
        raise RuntimeError("ADMIN_PASSWORD must be at most 128 characters")

    try:
        email = normalize_email(settings.admin_email)
    except ValidationError as error:
        raise RuntimeError("ADMIN_EMAIL must be a valid email address") from error

    admin = AdminUser(
        email=email,
        full_name=settings.admin_name.strip(),
        password_hash=hash_password(settings.admin_password),
    )
    db.add(admin)
    db.commit()
    db.refresh(admin)
    return admin


def authentication_error(detail: str = "Not authenticated") -> HTTPException:
    return HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail=detail,
    )


def get_current_admin(
    request: Request,
    db: Session = Depends(get_db),
    settings: Settings = Depends(get_settings),
) -> AdminUser:
    token = request.cookies.get(AUTH_COOKIE_NAME)
    if not token:
        raise authentication_error()

    try:
        admin_id = decode_session_token(token, settings)
    except (InvalidTokenError, RuntimeError):
        raise authentication_error() from None

    admin = db.get(AdminUser, admin_id)
    if admin is None or not admin.is_active:
        raise authentication_error()
    return admin


def require_trusted_origin(
    request: Request,
    settings: Settings = Depends(get_settings),
) -> None:
    origin = request.headers.get("origin")
    if origin is not None and origin not in settings.cors_origins:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Request origin is not allowed",
        )
