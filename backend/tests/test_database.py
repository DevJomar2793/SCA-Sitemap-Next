import pytest

from config import Settings
from database import build_database_url


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
