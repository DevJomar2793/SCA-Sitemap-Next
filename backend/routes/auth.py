from fastapi import APIRouter, Depends, HTTPException, Response, status
from sqlalchemy.orm import Session

from config import Settings
from database import get_db
from model import AdminUser
from schema import AdminLogin, AdminRegister, AdminSessionRead, AdminUserRead
from security import (
    AUTH_COOKIE_NAME,
    AuthenticatedSession,
    authenticate_admin,
    authentication_error,
    create_session_token,
    get_current_admin,
    get_current_session,
    get_settings,
    require_trusted_origin,
)
from services.admin_users import DuplicateAdminEmailError, register_admin
from services.activity_logs import (
    AUTHENTICATION_MODULE,
    add_activity_log,
    commit_activity_log,
)

router = APIRouter(prefix="/auth", tags=["authentication"])


def duplicate_email_error() -> HTTPException:
    return HTTPException(
        status_code=status.HTTP_409_CONFLICT,
        detail="An account with this email already exists",
    )


@router.post(
    "/login",
    response_model=AdminSessionRead,
    dependencies=[Depends(require_trusted_origin)],
    summary="Log in as an administrator",
)
def login(
    payload: AdminLogin,
    response: Response,
    db: Session = Depends(get_db),
    settings: Settings = Depends(get_settings),
) -> dict[str, object]:
    admin = authenticate_admin(payload.email, payload.password, db)
    if admin is None:
        raise authentication_error(
            "incorrect_credentials",
            "Incorrect email or password",
        )

    session_token = create_session_token(admin, settings)
    add_activity_log(
        db,
        actor=admin,
        action="LOGIN",
        module=AUTHENTICATION_MODULE,
        record_id=admin.id,
        record_label=admin.email,
        changes=[],
    )
    commit_activity_log(db)
    response.set_cookie(
        key=AUTH_COOKIE_NAME,
        value=session_token.value,
        max_age=settings.auth_session_minutes * 60,
        httponly=True,
        secure=settings.auth_cookie_secure,
        samesite="none" if settings.auth_cookie_secure else "lax",
        path="/",
    )
    return {
        **AdminUserRead.model_validate(admin).model_dump(),
        "expires_at": session_token.expires_at,
    }


@router.get(
    "/session",
    response_model=AdminSessionRead,
    summary="Validate the current administrator session",
)
def get_session(
    session: AuthenticatedSession = Depends(get_current_session),
) -> dict[str, object]:
    return {
        **AdminUserRead.model_validate(session.admin).model_dump(),
        "expires_at": session.expires_at,
    }


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
    try:
        return register_admin(db, payload)
    except DuplicateAdminEmailError:
        raise duplicate_email_error() from None


@router.post(
    "/logout",
    status_code=status.HTTP_204_NO_CONTENT,
    dependencies=[Depends(require_trusted_origin)],
    summary="Log out the current administrator",
)
def logout(
    response: Response,
    admin: AdminUser = Depends(get_current_admin),
    db: Session = Depends(get_db),
    settings: Settings = Depends(get_settings),
) -> Response:
    add_activity_log(
        db,
        actor=admin,
        action="LOGOUT",
        module=AUTHENTICATION_MODULE,
        record_id=admin.id,
        record_label=admin.email,
        changes=[],
    )
    commit_activity_log(db)
    response.delete_cookie(
        key=AUTH_COOKIE_NAME,
        path="/",
        secure=settings.auth_cookie_secure,
        httponly=True,
        samesite="none" if settings.auth_cookie_secure else "lax",
    )
    response.status_code = status.HTTP_204_NO_CONTENT
    return response
