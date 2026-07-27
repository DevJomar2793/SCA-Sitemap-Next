"""Tests for the admin page CRUD endpoints and database table."""

from pathlib import Path
from time import sleep

import pytest
from fastapi.testclient import TestClient
from sqlalchemy import create_engine, inspect, text

from app.database import Base, migrate_legacy_table

CREATE_PATH = "/api/v1/add-admin-page"
LIST_PATH = "/api/v1/get-admin-pages"
READ_PATH = "/api/v1/get-admin-pages/{id}"
UPDATE_PATH = "/api/v1/update-admin-page/{id}"
DELETE_PATH = "/api/v1/delete-admin-page/{id}"

VALID_PAYLOAD = {
    "alpha": "A",
    "screen_number": "001",
    "screen_type": "Landing",
    "screen_description": "Main landing screen",
    "file_label": "landing.tsx",
    "screen_label": "Landing page",
    "notes": "Initial version",
    "page_location": "/",
}


def test_admin_sitemap_table_has_expected_columns(tmp_path: Path) -> None:
    test_engine = create_engine(f"sqlite:///{(tmp_path / 'schema.db').as_posix()}")
    Base.metadata.create_all(bind=test_engine)

    columns = {column["name"] for column in inspect(test_engine).get_columns("page_list")}

    assert columns == {
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
    }
    test_engine.dispose()


def test_legacy_table_is_renamed_without_losing_records(tmp_path: Path) -> None:
    test_engine = create_engine(f"sqlite:///{(tmp_path / 'legacy.db').as_posix()}")
    with test_engine.begin() as connection:
        connection.exec_driver_sql(
            """
            CREATE TABLE admin_sitemap (
                id INTEGER PRIMARY KEY,
                alpha VARCHAR NOT NULL,
                screen_number VARCHAR NOT NULL,
                screen_type VARCHAR NOT NULL,
                screen_description VARCHAR NOT NULL,
                file_label VARCHAR NOT NULL,
                screen_label VARCHAR NOT NULL,
                notes VARCHAR NOT NULL,
                page_location VARCHAR NOT NULL,
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP NOT NULL,
                updated_at DATETIME DEFAULT CURRENT_TIMESTAMP NOT NULL
            )
            """
        )
        connection.execute(
            text(
                """
                INSERT INTO admin_sitemap (
                    id, alpha, screen_number, screen_type, screen_description,
                    file_label, screen_label, notes, page_location
                ) VALUES (
                    1, 'A', '001', 'Landing', 'Main landing screen',
                    'landing.tsx', 'Landing page', 'Initial version', '/'
                )
                """
            )
        )

    migrate_legacy_table(test_engine)

    assert inspect(test_engine).has_table("page_list")
    assert not inspect(test_engine).has_table("admin_sitemap")
    with test_engine.connect() as connection:
        assert connection.execute(text("SELECT COUNT(*) FROM page_list")).scalar_one() == 1
    test_engine.dispose()


def test_crud_flow(client: TestClient) -> None:
    create_response = client.post(CREATE_PATH, json=VALID_PAYLOAD)

    assert create_response.status_code == 201
    created = create_response.json()
    assert created["id"] == 1
    assert created["screen_number"] == "001"
    assert created["created_at"] is not None
    assert created["updated_at"] is not None

    list_response = client.get(LIST_PATH)
    assert list_response.status_code == 200
    assert list_response.json() == [created]

    read_response = client.get(READ_PATH.format(id=1))
    assert read_response.status_code == 200
    assert read_response.json() == created

    sleep(1.1)
    update_response = client.patch(
        UPDATE_PATH.format(id=1),
        json={"notes": "Updated notes"},
    )
    assert update_response.status_code == 200
    updated = update_response.json()
    assert updated["notes"] == "Updated notes"
    assert updated["alpha"] == created["alpha"]
    assert updated["created_at"] == created["created_at"]
    assert updated["updated_at"] > created["updated_at"]

    delete_response = client.delete(DELETE_PATH.format(id=1))
    assert delete_response.status_code == 204
    assert delete_response.content == b""
    assert client.get(READ_PATH.format(id=1)).status_code == 404
    assert client.get(LIST_PATH).json() == []


@pytest.mark.parametrize(
    ("method", "path", "payload"),
    [
        ("post", CREATE_PATH, {**VALID_PAYLOAD, "alpha": "  "}),
        (
            "post",
            CREATE_PATH,
            {key: value for key, value in VALID_PAYLOAD.items() if key != "notes"},
        ),
        ("patch", UPDATE_PATH.format(id=1), {}),
        ("patch", UPDATE_PATH.format(id=1), {"notes": None}),
    ],
)
def test_invalid_payloads_return_422(
    client: TestClient,
    method: str,
    path: str,
    payload: dict[str, str | None],
) -> None:
    response = client.request(method, path, json=payload)

    assert response.status_code == 422


def test_missing_records_return_404(client: TestClient) -> None:
    assert client.get(READ_PATH.format(id=999)).status_code == 404
    assert (
        client.patch(
            UPDATE_PATH.format(id=999),
            json={"notes": "Missing"},
        ).status_code
        == 404
    )
    assert client.delete(DELETE_PATH.format(id=999)).status_code == 404


@pytest.mark.parametrize(
    ("method", "path"),
    [
        ("post", "/api/v1/admin-sitemaps"),
        ("get", "/api/v1/admin-sitemaps"),
        ("get", "/api/v1/admin-sitemaps/1"),
        ("patch", "/api/v1/admin-sitemaps/1"),
        ("delete", "/api/v1/admin-sitemaps/1"),
    ],
)
def test_removed_admin_sitemap_routes_return_404(
    client: TestClient,
    method: str,
    path: str,
) -> None:
    response = client.request(method, path, json={})

    assert response.status_code == 404
