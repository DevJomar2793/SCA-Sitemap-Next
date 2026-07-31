from collections.abc import Generator
from pathlib import Path

import pytest
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import Session, sessionmaker

from app.config import Settings
from app.database import Base, get_db
from app.main import create_app
from app.model import AdminUser
from app.security import hash_password

TEST_ADMIN_EMAIL = "admin@example.com"
TEST_ADMIN_NAME = "Test Administrator"
TEST_ADMIN_PASSWORD = "correct-horse-battery-staple"
TEST_AUTH_SECRET = "test-auth-secret-that-is-at-least-32-characters"


@pytest.fixture
def client(tmp_path: Path) -> Generator[TestClient, None, None]:
    """Provide an API client connected to a fresh temporary database."""
    database_path = tmp_path / "test-sitemap.db"
    test_engine = create_engine(
        f"sqlite:///{database_path.as_posix()}",
        connect_args={"check_same_thread": False},
    )
    TestSessionLocal = sessionmaker(
        bind=test_engine,
        autoflush=False,
        expire_on_commit=False,
    )
    Base.metadata.create_all(bind=test_engine)
    with TestSessionLocal() as db:
        db.add(
            AdminUser(
                email=TEST_ADMIN_EMAIL,
                full_name=TEST_ADMIN_NAME,
                password_hash=hash_password(TEST_ADMIN_PASSWORD),
            )
        )
        db.commit()

    def override_get_db() -> Generator[Session, None, None]:
        db = TestSessionLocal()
        try:
            yield db
        finally:
            db.close()

    application = create_app(
        Settings(auth_secret_key=TEST_AUTH_SECRET),
        initialize_database=False,
    )
    application.dependency_overrides[get_db] = override_get_db

    with TestClient(application) as test_client:
        login_response = test_client.post(
            "/api/v1/auth/login",
            json={
                "email": TEST_ADMIN_EMAIL,
                "password": TEST_ADMIN_PASSWORD,
            },
        )
        assert login_response.status_code == 200
        yield test_client

    application.dependency_overrides.clear()
    test_engine.dispose()
