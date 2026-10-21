from collections.abc import Generator
import os

import pytest
from fastapi.testclient import TestClient
from sqlalchemy import create_engine, delete
from sqlalchemy.orm import Session, sessionmaker

TEST_DATABASE_URL = os.getenv("TEST_DATABASE_URL")
if not TEST_DATABASE_URL:
    raise RuntimeError("TEST_DATABASE_URL must point to an isolated PostgreSQL database")

from config import Settings
from database import Base, get_db
from main import create_app
from model import ActivityLog, AdminUser
from security import hash_password

TEST_ADMIN_EMAIL = "admin@example.com"
TEST_ADMIN_NAME = "Test Administrator"
TEST_ADMIN_PASSWORD = "correct-horse-battery-staple"
TEST_AUTH_SECRET = "test-auth-secret-that-is-at-least-32-characters"


@pytest.fixture
def database_engine() -> Generator:
    """Provide a clean PostgreSQL database for one test."""
    test_engine = create_engine(TEST_DATABASE_URL, pool_pre_ping=True)
    Base.metadata.drop_all(bind=test_engine)
    Base.metadata.create_all(bind=test_engine)
    yield test_engine
    Base.metadata.drop_all(bind=test_engine)
    test_engine.dispose()


@pytest.fixture
def client(database_engine) -> Generator[TestClient, None, None]:
    """Provide an API client connected to a fresh PostgreSQL test database."""
    test_engine = database_engine
    TestSessionLocal = sessionmaker(
        bind=test_engine,
        autoflush=False,
        expire_on_commit=False,
    )
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
        with TestSessionLocal() as db:
            db.execute(delete(ActivityLog))
            db.commit()
        yield test_client

    application.dependency_overrides.clear()
