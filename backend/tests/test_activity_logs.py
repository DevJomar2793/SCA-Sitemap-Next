"""Tests for immutable sitemap activity history."""

from datetime import datetime, timedelta, timezone

import pytest
from fastapi.testclient import TestClient
from sqlalchemy import select

import app.services.sitemap_pages as sitemap_pages
from app.database import get_db
from app.model import ActivityLog, AdminSitemap, AdminUser

ACTIVITY_PATH = "/api/v1/activity-logs"
CREATE_PATH = "/api/v1/add-admin-page"
UPDATE_PATH = "/api/v1/update-admin-page/{id}"
DELETE_PATH = "/api/v1/delete-admin-page/{id}"
VALID_PAYLOAD = {
    "alpha": "A",
    "screen_number": "001",
    "screen_type": "Landing",
    "screen_description": "Main landing screen",
    "notes": "Initial version",
    "page_location": "/",
}


def get_logs(client: TestClient, **params):
    response = client.get(ACTIVITY_PATH, params=params)
    assert response.status_code == 200
    return response.json()


def test_manual_crud_creates_complete_newest_first_history(
    client: TestClient,
) -> None:
    created = client.post(CREATE_PATH, json=VALID_PAYLOAD).json()
    update_response = client.patch(
        UPDATE_PATH.format(id=created["id"]),
        json={"alpha": "MG", "screen_description": "Manager list"},
    )
    assert update_response.status_code == 200
    assert client.delete(DELETE_PATH.format(id=created["id"])).status_code == 204

    response = get_logs(client)

    assert response["total"] == 3
    assert response["page"] == 1
    assert response["page_size"] == 10
    assert response["page_count"] == 1
    assert [item["action"] for item in response["items"]] == [
        "DELETE",
        "UPDATE",
        "ADD",
    ]
    assert response["items"][0]["record_label"] == "MG-001-Manager list"
    assert response["items"][0]["performed_by"]["email"] == "admin@example.com"

    update_changes = {
        change["field"]: change for change in response["items"][1]["changes"]
    }
    assert update_changes["alpha"] == {
        "field": "alpha",
        "previous_value": "A",
        "new_value": "MG",
    }
    assert update_changes["file_label"]["previous_value"] == "A-001"
    assert update_changes["file_label"]["new_value"] == "MG-001"
    assert update_changes["screen_label"]["new_value"] == "MG-001-Manager list"

    add_changes = response["items"][2]["changes"]
    assert all(change["previous_value"] is None for change in add_changes)
    assert all(change["new_value"] is not None for change in add_changes)
    delete_changes = response["items"][0]["changes"]
    assert all(change["previous_value"] is not None for change in delete_changes)
    assert all(change["new_value"] is None for change in delete_changes)


def test_no_op_and_failed_updates_do_not_create_logs(client: TestClient) -> None:
    created = client.post(CREATE_PATH, json=VALID_PAYLOAD).json()

    no_op = client.patch(
        UPDATE_PATH.format(id=created["id"]),
        json=VALID_PAYLOAD,
    )
    invalid = client.patch(
        UPDATE_PATH.format(id=created["id"]),
        json={"notes": "   "},
    )

    assert no_op.status_code == 200
    assert invalid.status_code == 422
    assert get_logs(client)["total"] == 1


def test_audit_and_sitemap_change_roll_back_together(
    client: TestClient,
    monkeypatch,
) -> None:
    def reject_commit(db) -> None:
        db.rollback()
        raise RuntimeError("simulated commit failure")

    monkeypatch.setattr(sitemap_pages, "commit_changes", reject_commit)

    with pytest.raises(RuntimeError, match="simulated commit failure"):
        client.post(CREATE_PATH, json=VALID_PAYLOAD)

    get_db_override = client.app.dependency_overrides[get_db]
    db_generator = get_db_override()
    db = next(db_generator)
    try:
        assert db.scalar(select(ActivityLog)) is None
        assert db.scalar(select(AdminSitemap)) is None
    finally:
        db_generator.close()


def test_activity_filters_search_and_pagination(client: TestClient) -> None:
    first = client.post(CREATE_PATH, json=VALID_PAYLOAD).json()
    second = client.post(
        CREATE_PATH,
        json={**VALID_PAYLOAD, "alpha": "B", "screen_number": "002"},
    ).json()
    client.patch(
        UPDATE_PATH.format(id=first["id"]),
        json={"notes": "Ready for review"},
    )
    client.delete(DELETE_PATH.format(id=second["id"]))

    first_page = get_logs(client, page=1, page_size=1)
    assert first_page["total"] == 4
    assert first_page["page_count"] == 4
    assert len(first_page["items"]) == 1

    assert get_logs(client, action="UPDATE")["total"] == 1
    assert get_logs(client, module="sitemap")["total"] == 4
    assert get_logs(client, q="Ready for review")["items"][0]["action"] == "UPDATE"
    user_id = first_page["filter_options"]["users"][0]["id"]
    assert get_logs(client, user_id=user_id)["total"] == 4
    assert first_page["filter_options"]["modules"] == ["Sitemap"]

    now = datetime.now(timezone.utc)
    assert (
        get_logs(client, date_from=(now - timedelta(days=1)).isoformat())["total"]
        == 4
    )
    assert (
        get_logs(client, date_to=(now - timedelta(days=1)).isoformat())["total"]
        == 0
    )


def test_activity_uses_current_actor_profile_and_unknown_fallback(
    client: TestClient,
) -> None:
    client.post(CREATE_PATH, json=VALID_PAYLOAD)
    get_db_override = client.app.dependency_overrides[get_db]
    db_generator = get_db_override()
    db = next(db_generator)
    try:
        admin = db.get(AdminUser, 1)
        assert admin is not None
        admin.full_name = "Renamed Administrator"
        db.commit()
    finally:
        db_generator.close()

    assert get_logs(client)["items"][0]["performed_by"]["full_name"] == (
        "Renamed Administrator"
    )

    db_generator = get_db_override()
    db = next(db_generator)
    try:
        activity = db.scalar(select(ActivityLog))
        assert activity is not None
        activity.actor_user_id = 999
        db.commit()
    finally:
        db_generator.close()

    assert get_logs(client)["items"][0]["performed_by"] is None


def test_excel_import_is_not_audited(client: TestClient) -> None:
    from test_excel_import import upload, workbook_bytes

    client.post(CREATE_PATH, json=VALID_PAYLOAD)
    assert upload(client, workbook_bytes()).status_code == 200
    logs = get_logs(client)
    assert logs["total"] == 1
    assert logs["items"][0]["action"] == "ADD"


def test_activity_logs_are_authenticated_and_read_only(client: TestClient) -> None:
    client.cookies.clear()
    assert client.get(ACTIVITY_PATH).status_code == 401
    assert client.post(ACTIVITY_PATH, json={}).status_code == 405
    assert client.patch(f"{ACTIVITY_PATH}/1", json={}).status_code == 404
    assert client.delete(f"{ACTIVITY_PATH}/1").status_code == 404
