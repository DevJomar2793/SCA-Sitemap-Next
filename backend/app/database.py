from collections.abc import Generator
from pathlib import Path

from sqlalchemy import Engine, create_engine, inspect
from sqlalchemy.orm import DeclarativeBase, Session, sessionmaker

DATABASE_PATH = Path(__file__).resolve().parent.parent / "sitemap.db"
DATABASE_URL = f"sqlite:///{DATABASE_PATH.as_posix()}"


class Base(DeclarativeBase):
    pass


engine = create_engine(
    DATABASE_URL,
    connect_args={"check_same_thread": False},
)
SessionLocal = sessionmaker(bind=engine, autoflush=False, expire_on_commit=False)

LEGACY_TABLE_NAME = "admin_sitemap"
SITEMAP_TABLE_NAME = "page_list"
SITEMAP_COLUMNS = (
    "id",
    "alpha",
    "screen_number",
    "screen_type",
    "screen_description",
    "file_label",
    "screen_label",
    "notes",
    "page_location",
    "created_at",
    "updated_at",
)


def migrate_legacy_table(database_engine: Engine) -> None:
    """Move records from the former admin_sitemap table into page_list."""
    table_names = set(inspect(database_engine).get_table_names())

    if LEGACY_TABLE_NAME in table_names and SITEMAP_TABLE_NAME not in table_names:
        with database_engine.begin() as connection:
            connection.exec_driver_sql(
                f"ALTER TABLE {LEGACY_TABLE_NAME} RENAME TO {SITEMAP_TABLE_NAME}"
            )
        return

    if {LEGACY_TABLE_NAME, SITEMAP_TABLE_NAME}.issubset(table_names):
        columns = ", ".join(SITEMAP_COLUMNS)
        matching_columns = " AND ".join(
            f"current.{column} IS legacy.{column}" for column in SITEMAP_COLUMNS
        )
        with database_engine.begin() as connection:
            connection.exec_driver_sql(
                f"INSERT OR IGNORE INTO {SITEMAP_TABLE_NAME} ({columns}) "
                f"SELECT {columns} FROM {LEGACY_TABLE_NAME}"
            )
            unmatched_records = connection.exec_driver_sql(
                f"SELECT COUNT(*) FROM {LEGACY_TABLE_NAME} AS legacy "
                f"WHERE NOT EXISTS ("
                f"SELECT 1 FROM {SITEMAP_TABLE_NAME} AS current "
                f"WHERE {matching_columns}"
                f")"
            ).scalar_one()
            if unmatched_records == 0:
                connection.exec_driver_sql(f"DROP TABLE {LEGACY_TABLE_NAME}")


def init_db() -> None:
    # Import the model before creating tables so SQLAlchemy knows its structure.
    from app import model  # noqa: F401

    migrate_legacy_table(engine)
    Base.metadata.create_all(bind=engine)


def get_db() -> Generator[Session, None, None]:
    # FastAPI opens one session per request and always closes it afterward.
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
