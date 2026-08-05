from datetime import datetime, timedelta, timezone
from pathlib import Path

import jwt
import pytest
from fastapi.testclient import TestClient
from sqlalchemy import create_engine, select
from sqlalchemy.orm import Session

from app.config import Settings
from app.database import Base, get_db
from app.model import AdminUser
from app.security import (
    AUTH_COOKIE_NAME,
    JWT_ALGORITHM,
    bootstrap_admin,
    verify_password,
)
from conftest import (
    TEST_ADMIN_EMAIL,
    TEST_ADMIN_NAME,
    TEST_ADMIN_PASSWORD,
    TEST_AUTH_SECRET,
)

LOGIN_PATH = "/api/v1/auth/login"
REGISTER_PATH = "/api/v1/auth/register"
PROTECTED_PATH = "/api/v1/get-admin-pages"
LOGOUT_PATH = "/api/v1/auth/logout"


def log_in(client: TestClient, *, email: str, password: str):
    return client.post(
        LOGIN_PATH,
        json={"email": email, "password": password},
    )


def test_login_sets_http_only_session_cookie(client: TestClient) -> None:
    client.cookies.clear()

    response = log_in(
        client,
        email=f"  {TEST_ADMIN_EMAIL.upper()}  ",
        password=TEST_ADMIN_PASSWORD,
    )

    assert response.status_code == 200
    assert response.json() == {
        "id": 1,
        "email": TEST_ADMIN_EMAIL,
        "full_name": TEST_ADMIN_NAME,
        "is_active": True,
        "created_at": response.json()["created_at"],
    }
    cookie = response.headers["set-cookie"].lower()
    assert f"{AUTH_COOKIE_NAME}=" in cookie
    assert "httponly" in cookie
    assert "samesite=lax" in cookie
    assert "max-age=1800" in cookie
    assert "secure" not in cookie

    protected_response = client.get(PROTECTED_PATH)
    assert protected_response.status_code == 200


def test_authenticated_admin_can_register_another_admin(
    client: TestClient,
) -> None:
    creator = client.get(PROTECTED_PATH).json()
    creator_cookie = client.cookies.get(AUTH_COOKIE_NAME)

    response = client.post(
        REGISTER_PATH,
        json={
            "email": "  SECOND.ADMIN@EXAMPLE.COM ",
            "full_name": "  Second Administrator  ",
            "password": "another-secure-password",
        },
    )

    assert response.status_code == 201
    assert response.json() == {
        "id": 2,
        "email": "second.admin@example.com",
        "full_name": "Second Administrator",
        "is_active": True,
        "created_at": response.json()["created_at"],
    }
    assert "password" not in response.text
    assert "set-cookie" not in response.headers
    assert client.cookies.get(AUTH_COOKIE_NAME) == creator_cookie
    assert client.get(PROTECTED_PATH).json() == creator

    get_db_override = client.app.dependency_overrides[get_db]
    db_generator = get_db_override()
    db = next(db_generator)
    try:
        registered_admin = db.scalar(
            select(AdminUser).where(
                AdminUser.email == "second.admin@example.com"
            )
        )
        assert registered_admin is not None
        assert registered_admin.password_hash != "another-secure-password"
        assert verify_password(
            "another-secure-password",
            registered_admin.password_hash,
        )
    finally:
        db_generator.close()

    client.cookies.clear()
    login_response = log_in(
        client,
        email="second.admin@example.com",
        password="another-secure-password",
    )
    assert login_response.status_code == 200
    assert login_response.json()["id"] == 2


def test_register_rejects_duplicate_email_case_insensitively(
    client: TestClient,
) -> None:
    response = client.post(
        REGISTER_PATH,
        json={
            "email": TEST_ADMIN_EMAIL.upper(),
            "full_name": "Replacement Administrator",
            "password": "another-secure-password",
        },
    )

    assert response.status_code == 409
    assert response.json() == {
        "detail": "An account with this email already exists"
    }
    assert client.get(PROTECTED_PATH).status_code == 200


@pytest.mark.parametrize(
    "payload",
    [
        {
            "email": "not-an-email",
            "full_name": "New Administrator",
            "password": "another-secure-password",
        },
        {
            "email": "new@example.com",
            "full_name": "   ",
            "password": "another-secure-password",
        },
        {
            "email": "new@example.com",
            "full_name": "x" * 121,
            "password": "another-secure-password",
        },
        {
            "email": "new@example.com",
            "full_name": "New Administrator",
            "password": "four",
        },
        {
            "email": "new@example.com",
            "full_name": "New Administrator",
            "password": "x" * 129,
        },
    ],
)
def test_register_validates_account_fields(
    client: TestClient,
    payload: dict[str, str],
) -> None:
    assert client.post(REGISTER_PATH, json=payload).status_code == 422


def test_public_registration_creates_an_active_administrator(
    client: TestClient,
) -> None:
    client.cookies.clear()

    response = client.post(
        REGISTER_PATH,
        json={
            "email": "new@example.com",
            "full_name": "New Administrator",
            "password": "another-secure-password",
        },
    )

    assert response.status_code == 201
    assert response.json()["email"] == "new@example.com"
    assert response.json()["full_name"] == "New Administrator"
    assert response.json()["is_active"] is True


@pytest.mark.parametrize(
    ("email", "password"),
    [
        (TEST_ADMIN_EMAIL, "wrong-password"),
        ("missing@example.com", TEST_ADMIN_PASSWORD),
    ],
)
def test_invalid_credentials_return_generic_401(
    client: TestClient,
    email: str,
    password: str,
) -> None:
    client.cookies.clear()

    response = log_in(client, email=email, password=password)

    assert response.status_code == 401
    assert response.json() == {"detail": "Incorrect email or password"}
    assert AUTH_COOKIE_NAME not in client.cookies


def test_logout_clears_session_cookie(client: TestClient) -> None:
    response = client.post(LOGOUT_PATH)

    assert response.status_code == 204
    assert response.content == b""
    assert AUTH_COOKIE_NAME not in client.cookies
    assert client.get(PROTECTED_PATH).status_code == 401


@pytest.mark.parametrize("token", ["not-a-token", ""])
def test_invalid_or_missing_session_returns_401(
    client: TestClient,
    token: str,
) -> None:
    client.cookies.clear()
    if token:
        client.cookies.set(AUTH_COOKIE_NAME, token)

    response = client.get(PROTECTED_PATH)

    assert response.status_code == 401
    assert response.json() == {"detail": "Not authenticated"}


def test_expired_session_returns_401(client: TestClient) -> None:
    now = datetime.now(timezone.utc)
    token = jwt.encode(
        {
            "sub": "1",
            "iat": now - timedelta(hours=1),
            "exp": now - timedelta(minutes=1),
        },
        TEST_AUTH_SECRET,
        algorithm=JWT_ALGORITHM,
    )
    client.cookies.set(AUTH_COOKIE_NAME, token)

    assert client.get(PROTECTED_PATH).status_code == 401


def test_disabled_admin_session_returns_401(client: TestClient) -> None:
    get_db_override = client.app.dependency_overrides[get_db]
    db_generator = get_db_override()
    db = next(db_generator)
    try:
        admin = db.get(AdminUser, 1)
        assert admin is not None
        admin.is_active = False
        db.commit()
    finally:
        db_generator.close()

    assert client.get(PROTECTED_PATH).status_code == 401


def test_current_admin_endpoint_is_removed(client: TestClient) -> None:
    assert client.get("/api/v1/auth/me").status_code == 404


@pytest.mark.parametrize(
    ("method", "path"),
    [
        ("get", "/api/v1/get-admin-pages"),
        ("get", "/api/v1/get-admin-pages/1"),
        ("post", "/api/v1/add-admin-page"),
        ("patch", "/api/v1/update-admin-page/1"),
        ("delete", "/api/v1/delete-admin-page/1"),
        ("post", "/api/v1/import-sitemap-pages"),
    ],
)
def test_dashboard_apis_require_authentication(
    client: TestClient,
    method: str,
    path: str,
) -> None:
    client.cookies.clear()

    response = client.request(method, path)

    assert response.status_code == 401


def test_health_and_public_search_remain_anonymous(client: TestClient) -> None:
    client.cookies.clear()

    assert client.get("/api/v1/health").status_code == 200
    assert (
        client.get("/api/v1/search-sitemap-pages", params={"q": "001"}).status_code
        == 200
    )


@pytest.mark.parametrize(
    ("method", "path"),
    [
        ("post", LOGIN_PATH),
        ("post", REGISTER_PATH),
        ("post", LOGOUT_PATH),
        ("post", "/api/v1/add-admin-page"),
        ("patch", "/api/v1/update-admin-page/1"),
        ("delete", "/api/v1/delete-admin-page/1"),
        ("post", "/api/v1/import-sitemap-pages"),
    ],
)
def test_untrusted_origins_cannot_make_state_changes(
    client: TestClient,
    method: str,
    path: str,
) -> None:
    response = client.request(
        method,
        path,
        headers={"Origin": "https://malicious.example"},
    )

    assert response.status_code == 403
    assert response.json() == {"detail": "Request origin is not allowed"}


def test_bootstrap_creates_hashed_admin_once(tmp_path: Path) -> None:
    engine = create_engine(f"sqlite:///{(tmp_path / 'auth.db').as_posix()}")
    Base.metadata.create_all(bind=engine)
    settings = Settings(
        auth_secret_key=TEST_AUTH_SECRET,
        admin_email=f"  {TEST_ADMIN_EMAIL.upper()} ",
        admin_password=TEST_ADMIN_PASSWORD,
        admin_name=TEST_ADMIN_NAME,
    )

    with Session(engine) as db:
        created = bootstrap_admin(db, settings)
        assert created is not None
        assert created.email == TEST_ADMIN_EMAIL
        assert created.password_hash != TEST_ADMIN_PASSWORD
        assert verify_password(TEST_ADMIN_PASSWORD, created.password_hash)

        assert bootstrap_admin(db, settings) is None
        assert len(list(db.scalars(select(AdminUser)))) == 1

    engine.dispose()


@pytest.mark.parametrize(
    ("settings", "message"),
    [
        (
            Settings(
                auth_secret_key=TEST_AUTH_SECRET,
                admin_email=TEST_ADMIN_EMAIL,
                admin_password="four",
                admin_name=TEST_ADMIN_NAME,
            ),
            "ADMIN_PASSWORD must be at least 5 characters",
        ),
        (
            Settings(
                auth_secret_key="short",
                admin_email=TEST_ADMIN_EMAIL,
                admin_password=TEST_ADMIN_PASSWORD,
                admin_name=TEST_ADMIN_NAME,
            ),
            "AUTH_SECRET_KEY must be configured",
        ),
    ],
)
def test_bootstrap_rejects_insecure_configuration(
    tmp_path: Path,
    settings: Settings,
    message: str,
) -> None:
    engine = create_engine(f"sqlite:///{(tmp_path / 'invalid.db').as_posix()}")
    Base.metadata.create_all(bind=engine)

    with Session(engine) as db, pytest.raises(RuntimeError, match=message):
        bootstrap_admin(db, settings)

    engine.dispose()
