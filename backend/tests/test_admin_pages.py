"""Tests for the admin page CRUD endpoints and database table."""

from time import sleep

import pytest
from fastapi.testclient import TestClient
from sqlalchemy import inspect

CREATE_PATH = "/api/v1/add-admin-page"
LIST_PATH = "/api/v1/get-admin-pages"
READ_PATH = "/api/v1/get-admin-pages/{id}"
UPDATE_PATH = "/api/v1/update-admin-page/{id}"
DELETE_PATH = "/api/v1/delete-admin-page/{id}"
SEARCH_PATH = "/api/v1/search-sitemap-pages"

VALID_PAYLOAD = {
    "alpha": "A",
    "screen_number": "001",
    "screen_type": "Landing",
    "screen_description": "Main landing screen",
    "notes": "Initial version",
    "page_location": "/",
}


def test_admin_sitemap_table_has_expected_columns(database_engine) -> None:
    columns = {
        column["name"]
        for column in inspect(database_engine).get_columns("page_list")
    }

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
def test_crud_flow(client: TestClient) -> None:
    create_response = client.post(CREATE_PATH, json=VALID_PAYLOAD)

    assert create_response.status_code == 201
    created = create_response.json()
    assert created["id"] == 1
    assert created["screen_number"] == "001"
    assert created["file_label"] == "A-001"
    assert created["screen_label"] == "A-001-Main landing screen"
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
    assert updated["file_label"] == "A-001"
    assert updated["screen_label"] == "A-001-Main landing screen"
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


def test_create_trims_sources_before_generating_labels(client: TestClient) -> None:
    response = client.post(
        CREATE_PATH,
        json={
            **VALID_PAYLOAD,
            "alpha": " a ",
            "screen_number": " 003 ",
            "screen_description": " Main screen ",
        },
    )

    assert response.status_code == 201
    created = response.json()
    assert created["alpha"] == "a"
    assert created["screen_number"] == "003"
    assert created["file_label"] == "a-003"
    assert created["screen_label"] == "a-003-Main screen"


def test_source_updates_regenerate_both_labels(client: TestClient) -> None:
    created = client.post(CREATE_PATH, json=VALID_PAYLOAD).json()

    response = client.patch(
        UPDATE_PATH.format(id=created["id"]),
        json={
            "alpha": "MG",
            "screen_number": "04",
            "screen_description": "Manager list",
        },
    )

    assert response.status_code == 200
    updated = response.json()
    assert updated["file_label"] == "MG-04"
    assert updated["screen_label"] == "MG-04-Manager list"


@pytest.mark.parametrize("field", ["file_label", "screen_label"])
@pytest.mark.parametrize(
    ("method", "path", "payload"),
    [
        ("post", CREATE_PATH, VALID_PAYLOAD),
        ("patch", UPDATE_PATH.format(id=1), {"notes": "Updated"}),
    ],
)
def test_write_requests_reject_generated_label_fields(
    client: TestClient,
    field: str,
    method: str,
    path: str,
    payload: dict[str, str],
) -> None:
    response = client.request(method, path, json={**payload, field: "override"})

    assert response.status_code == 422
    assert "System-generated fields must not be provided" in response.text


def test_search_by_screen_number_returns_all_alpha_matches(
    client: TestClient,
) -> None:
    second_payload = {
        **VALID_PAYLOAD,
        "alpha": "B",
    }
    unmatched_payload = {
        **VALID_PAYLOAD,
        "screen_number": "002",
    }
    for payload in (VALID_PAYLOAD, second_payload, unmatched_payload):
        assert client.post(CREATE_PATH, json=payload).status_code == 201

    response = client.get(SEARCH_PATH, params={"q": "001"})

    assert response.status_code == 200
    assert [record["alpha"] for record in response.json()] == ["A", "B"]


@pytest.mark.parametrize("query", ["a-001", "A 001"])
def test_search_by_prefixed_identifier_is_case_and_separator_insensitive(
    client: TestClient,
    query: str,
) -> None:
    assert client.post(CREATE_PATH, json=VALID_PAYLOAD).status_code == 201
    assert (
        client.post(
            CREATE_PATH,
            json={**VALID_PAYLOAD, "alpha": "B"},
        ).status_code
        == 201
    )

    response = client.get(SEARCH_PATH, params={"q": query})

    assert response.status_code == 200
    assert len(response.json()) == 1
    assert response.json()[0]["alpha"] == "A"


def test_search_returns_empty_list_when_no_screen_matches(
    client: TestClient,
) -> None:
    assert client.get(SEARCH_PATH, params={"q": "999"}).json() == []


@pytest.mark.parametrize("query", ["03", "A-03"])
def test_search_treats_leading_zeroes_as_equivalent(
    client: TestClient,
    query: str,
) -> None:
    assert (
        client.post(
            CREATE_PATH,
            json={**VALID_PAYLOAD, "screen_number": "3"},
        ).status_code
        == 201
    )

    response = client.get(SEARCH_PATH, params={"q": query})

    assert response.status_code == 200
    assert response.json()[0]["screen_number"] == "3"


@pytest.mark.parametrize("query", ["", "   "])
def test_search_rejects_blank_queries(client: TestClient, query: str) -> None:
    response = client.get(SEARCH_PATH, params={"q": query})

    assert response.status_code == 422


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
