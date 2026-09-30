from collections.abc import Generator
import os

from sqlalchemy import create_engine
from sqlalchemy.engine import URL
from sqlalchemy.orm import DeclarativeBase, Session, sessionmaker

from config import Settings


def build_database_url(settings: Settings) -> str | URL:
    """Build the PostgreSQL connection from separate environment values."""
    missing = [
        name
        for name, value in (
            ("POSTGRES_HOST", settings.postgres_host),
            ("POSTGRES_PORT", settings.postgres_port),
            ("POSTGRES_DB", settings.postgres_db),
            ("POSTGRES_USER", settings.postgres_user),
            ("POSTGRES_PASSWORD", settings.postgres_password),
        )
        if not value or not value.strip()
    ]
    if missing:
        raise RuntimeError("PostgreSQL requires: " + ", ".join(missing))

    assert settings.postgres_port is not None
    try:
        port = int(settings.postgres_port)
    except ValueError as error:
        raise RuntimeError("POSTGRES_PORT must be a number") from error

    if not 1 <= port <= 65535:
        raise RuntimeError("POSTGRES_PORT must be between 1 and 65535")

    assert settings.postgres_host is not None
    assert settings.postgres_db is not None
    assert settings.postgres_user is not None
    assert settings.postgres_password is not None
    return URL.create(
        "postgresql+psycopg",
        username=settings.postgres_user,
        password=settings.postgres_password,
        host=settings.postgres_host,
        port=port,
        database=settings.postgres_db,
    )


TEST_DATABASE_URL = os.getenv("TEST_DATABASE_URL")
database_connection = TEST_DATABASE_URL or build_database_url(
    Settings.from_environment()
)


class Base(DeclarativeBase):
    pass


engine = create_engine(
    database_connection,
    pool_pre_ping=True,
)
SessionLocal = sessionmaker(bind=engine, autoflush=False, expire_on_commit=False)


def init_db() -> None:
    # Import the model before creating tables so SQLAlchemy knows its structure.
    import model  # noqa: F401

    Base.metadata.create_all(bind=engine)


def get_db() -> Generator[Session, None, None]:
    # FastAPI opens one session per request and always closes it afterward.
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
