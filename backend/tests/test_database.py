import pytest
from sqlalchemy import inspect, text

import database
from config import Settings
from database import build_database_url, upgrade_admin_user_schema


def database_settings(**overrides: str | None) -> Settings:
    values: dict[str, str | None] = {
        "postgres_host": "localhost",
        "postgres_port": "5432",
        "postgres_db": "sca_sitemap",
        "postgres_user": "sca_sitemap",
        "postgres_password": "password with spaces",
    }
    values.update(overrides)
    return Settings(**values)


def test_build_database_url_uses_postgres_parameters() -> None:
    database_url = build_database_url(database_settings())

    assert database_url.render_as_string(hide_password=False) == (
        "postgresql+psycopg://sca_sitemap:password with spaces@"
        "localhost:5432/sca_sitemap"
    )


@pytest.mark.parametrize(
    ("overrides", "message"),
    [
        ({"postgres_host": None}, "POSTGRES_HOST"),
        ({"postgres_port": "not-a-number"}, "POSTGRES_PORT must be a number"),
        ({"postgres_port": "70000"}, "POSTGRES_PORT must be between 1 and 65535"),
    ],
)
def test_build_database_url_rejects_invalid_parameters(
    overrides: dict[str, str | None],
    message: str,
) -> None:
    with pytest.raises(RuntimeError, match=message):
        build_database_url(database_settings(**overrides))


def test_admin_upgrade_preserves_existing_account_access(
    database_engine,
    monkeypatch,
) -> None:
    with database_engine.begin() as connection:
        connection.execute(
            text("ALTER TABLE admin_users DROP COLUMN approval_status")
        )
        connection.execute(
            text(
                """
                INSERT INTO admin_users
                    (email, full_name, password_hash, is_active)
                VALUES
                    ('active@example.com', 'Active Admin', 'hash', true),
                    ('inactive@example.com', 'Inactive Admin', 'hash', false)
                """
            )
        )

    monkeypatch.setattr(database, "engine", database_engine)
    upgrade_admin_user_schema()

    columns = {
        column["name"]: column
        for column in inspect(database_engine).get_columns("admin_users")
    }
    assert columns["approval_status"]["nullable"] is False

    with database_engine.connect() as connection:
        rows = connection.execute(
            text(
                "SELECT email, approval_status FROM admin_users ORDER BY email"
            )
        ).all()
    assert [tuple(row) for row in rows] == [
        ("active@example.com", "approved"),
        ("inactive@example.com", "rejected"),
    ]
