from fastapi import APIRouter, Depends, HTTPException, Response, status
from sqlalchemy import func, select
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session

from app.config import Settings
from app.database import get_db
from app.model import AdminUser
from app.schema import AdminLogin, AdminRegister, AdminUserRead
from app.security import (
    AUTH_COOKIE_NAME,
    authenticate_admin,
    authentication_error,
    create_session_token,
    get_current_admin,
    get_settings,
    hash_password,
    normalize_email,
    require_trusted_origin,
)

router = APIRouter(prefix="/auth", tags=["authentication"])


def duplicate_email_error() -> HTTPException:
    return HTTPException(
        status_code=status.HTTP_409_CONFLICT,
        detail="An account with this email already exists",
    )


@router.post(
    "/login",
    response_model=AdminUserRead,
    dependencies=[Depends(require_trusted_origin)],
    summary="Log in as an administrator",
)
def login(
    payload: AdminLogin,
    response: Response,
    db: Session = Depends(get_db),
    settings: Settings = Depends(get_settings),
) -> AdminUser:
    admin = authenticate_admin(str(payload.email), payload.password, db)
    if admin is None:
        raise authentication_error("Incorrect email or password")

    response.set_cookie(
        key=AUTH_COOKIE_NAME,
        value=create_session_token(admin, settings),
        max_age=settings.auth_session_minutes * 60,
        httponly=True,
        secure=settings.auth_cookie_secure,
        samesite="lax",
        path="/",
    )
    return admin


@router.post(
    "/register",
    response_model=AdminUserRead,
    status_code=status.HTTP_201_CREATED,
    responses={
        status.HTTP_403_FORBIDDEN: {"description": "Origin is not allowed"},
        status.HTTP_409_CONFLICT: {"description": "Email is already registered"},
    },
    dependencies=[Depends(require_trusted_origin)],
    summary="Register a new administrator",
)
def register(
    payload: AdminRegister,
    db: Session = Depends(get_db),
) -> AdminUser:
    email = normalize_email(str(payload.email))
    existing_admin = db.scalar(
        select(AdminUser).where(func.lower(AdminUser.email) == email)
    )
    if existing_admin is not None:
        raise duplicate_email_error()

    admin = AdminUser(
        email=email,
        full_name=payload.full_name,
        password_hash=hash_password(payload.password),
    )
    db.add(admin)
    try:
        db.commit()
    except IntegrityError:
        db.rollback()
        raise duplicate_email_error() from None

    db.refresh(admin)
    return admin


@router.get(
    "/me",
    response_model=AdminUserRead,
    summary="Get the current administrator",
)
def read_current_admin(
    admin: AdminUser = Depends(get_current_admin),
) -> AdminUser:
    return admin


@router.post(
    "/logout",
    status_code=status.HTTP_204_NO_CONTENT,
    dependencies=[Depends(require_trusted_origin)],
    summary="Log out the current administrator",
)
def logout(
    response: Response,
    settings: Settings = Depends(get_settings),
) -> Response:
    response.delete_cookie(
        key=AUTH_COOKIE_NAME,
        path="/",
        secure=settings.auth_cookie_secure,
        httponly=True,
        samesite="lax",
    )
    response.status_code = status.HTTP_204_NO_CONTENT
    return response
