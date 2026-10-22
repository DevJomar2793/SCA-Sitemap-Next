from collections.abc import Generator
import os

from sqlalchemy import create_engine, inspect, text
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
    upgrade_admin_user_schema()
    upgrade_activity_log_schema()


def upgrade_admin_user_schema() -> None:
    """Add account approval status without losing existing administrators."""
    inspector = inspect(engine)
    if "admin_users" not in inspector.get_table_names():
        return

    with engine.begin() as connection:
        connection.execute(
            text(
                "ALTER TABLE admin_users "
                "ADD COLUMN IF NOT EXISTS approval_status VARCHAR(16)"
            )
        )
        connection.execute(
            text(
                """
                UPDATE admin_users
                SET approval_status = CASE
                    WHEN is_active THEN 'approved'
                    ELSE 'rejected'
                END
                WHERE approval_status IS NULL
                """
            )
        )
        connection.execute(
            text(
                "ALTER TABLE admin_users ALTER COLUMN approval_status "
                "SET DEFAULT 'pending'"
            )
        )
        connection.execute(
            text(
                "ALTER TABLE admin_users ALTER COLUMN approval_status SET NOT NULL"
            )
        )


def upgrade_activity_log_schema() -> None:
    """Apply the small audit-log upgrade needed by existing databases."""
    inspector = inspect(engine)
    if "activity_logs" not in inspector.get_table_names():
        return

    with engine.begin() as connection:
        connection.execute(
            text(
                "ALTER TABLE activity_logs "
                "ADD COLUMN IF NOT EXISTS actor_full_name VARCHAR(120)"
            )
        )
        connection.execute(
            text(
                "ALTER TABLE activity_logs "
                "ADD COLUMN IF NOT EXISTS actor_email VARCHAR(320)"
            )
        )
        connection.execute(
            text("ALTER TABLE activity_logs ALTER COLUMN record_id DROP NOT NULL")
        )

        connection.execute(
            text(
                """
                UPDATE activity_logs
                SET actor_full_name = admin_users.full_name,
                    actor_email = admin_users.email
                FROM admin_users
                WHERE activity_logs.actor_user_id = admin_users.id
                  AND (
                    activity_logs.actor_full_name IS NULL
                    OR activity_logs.actor_email IS NULL
                  )
                """
            )
        )


def get_db() -> Generator[Session, None, None]:
    # FastAPI opens one session per request and always closes it afterward.
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
