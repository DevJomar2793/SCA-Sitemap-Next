from collections.abc import Generator
from pathlib import Path
from time import sleep

import pytest
from fastapi.testclient import TestClient
from sqlalchemy import create_engine, inspect
from sqlalchemy.orm import Session, sessionmaker

from app.core.config import Settings
from app.database import Base, get_db
from app.main import create_app

API_PATH = "/api/v1/admin-sitemaps"

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


@pytest.fixture
def client(tmp_path: Path) -> Generator[TestClient, None, None]:
    database_path = tmp_path / "test-sitemap.db"
    test_engine = create_engine(
        f"sqlite:///{database_path.as_posix()}",
        connect_args={"check_same_thread": False},
    )
    testing_session = sessionmaker(
        bind=test_engine,
        autoflush=False,
        expire_on_commit=False,
    )
    Base.metadata.create_all(bind=test_engine)

    def override_get_db() -> Generator[Session, None, None]:
        database = testing_session()
        try:
            yield database
        finally:
            database.close()

    application = create_app(Settings(), initialize_database=False)
    application.dependency_overrides[get_db] = override_get_db

    with TestClient(application) as test_client:
        yield test_client

    application.dependency_overrides.clear()
    test_engine.dispose()


def test_admin_sitemap_table_has_expected_columns(tmp_path: Path) -> None:
    test_engine = create_engine(f"sqlite:///{(tmp_path / 'schema.db').as_posix()}")
    Base.metadata.create_all(bind=test_engine)

    columns = {column["name"] for column in inspect(test_engine).get_columns("admin_sitemap")}

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


def test_crud_flow(client: TestClient) -> None:
    create_response = client.post(API_PATH, json=VALID_PAYLOAD)

    assert create_response.status_code == 201
    created = create_response.json()
    assert created["id"] == 1
    assert created["screen_number"] == "001"
    assert created["created_at"] is not None
    assert created["updated_at"] is not None

    list_response = client.get(API_PATH)
    assert list_response.status_code == 200
    assert list_response.json() == [created]

    read_response = client.get(f"{API_PATH}/1")
    assert read_response.status_code == 200
    assert read_response.json() == created

    sleep(1.1)
    update_response = client.patch(
        f"{API_PATH}/1",
        json={"notes": "Updated notes"},
    )
    assert update_response.status_code == 200
    updated = update_response.json()
    assert updated["notes"] == "Updated notes"
    assert updated["alpha"] == created["alpha"]
    assert updated["created_at"] == created["created_at"]
    assert updated["updated_at"] > created["updated_at"]

    delete_response = client.delete(f"{API_PATH}/1")
    assert delete_response.status_code == 204
    assert delete_response.content == b""
    assert client.get(f"{API_PATH}/1").status_code == 404
    assert client.get(API_PATH).json() == []


@pytest.mark.parametrize(
    ("method", "path", "payload"),
    [
        ("post", API_PATH, {**VALID_PAYLOAD, "alpha": "  "}),
        ("post", API_PATH, {key: value for key, value in VALID_PAYLOAD.items() if key != "notes"}),
        ("patch", f"{API_PATH}/1", {}),
        ("patch", f"{API_PATH}/1", {"notes": None}),
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
    assert client.get(f"{API_PATH}/999").status_code == 404
    assert client.patch(f"{API_PATH}/999", json={"notes": "Missing"}).status_code == 404
    assert client.delete(f"{API_PATH}/999").status_code == 404
