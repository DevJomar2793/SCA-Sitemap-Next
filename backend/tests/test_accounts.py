"""Tests for administrator account approval."""

from fastapi.testclient import TestClient
from sqlalchemy import select

from conftest import TEST_ADMIN_EMAIL
from database import get_db
from model import ActivityLog

ACCOUNTS_PATH = "/api/v1/accounts"
REGISTER_PATH = "/api/v1/auth/register"
LOGIN_PATH = "/api/v1/auth/login"
NEW_ACCOUNT = {
    "email": "pending@example.com",
    "full_name": "Pending Administrator",
    "password": "secure-password",
}


def register_pending_account(client: TestClient) -> dict:
    response = client.post(REGISTER_PATH, json=NEW_ACCOUNT)
    assert response.status_code == 201
    return response.json()


def test_accounts_require_authentication(client: TestClient) -> None:
    client.cookies.clear()

    assert client.get(ACCOUNTS_PATH).status_code == 401
    assert client.patch(f"{ACCOUNTS_PATH}/1/approve").status_code == 401
    assert client.patch(f"{ACCOUNTS_PATH}/1/reject").status_code == 401


def test_list_accounts_puts_pending_accounts_first(client: TestClient) -> None:
    pending = register_pending_account(client)

    response = client.get(ACCOUNTS_PATH)

    assert response.status_code == 200
    assert [account["id"] for account in response.json()] == [pending["id"], 1]
    assert response.json()[0]["approval_status"] == "pending"
    assert response.json()[1]["email"] == TEST_ADMIN_EMAIL
    assert all(account["role"] == "admin" for account in response.json())


def test_approve_account_allows_sign_in_and_creates_audit_log(
    client: TestClient,
) -> None:
    pending = register_pending_account(client)

    response = client.patch(f"{ACCOUNTS_PATH}/{pending['id']}/approve")

    assert response.status_code == 200
    assert response.json()["approval_status"] == "approved"
    assert response.json()["is_active"] is True

    get_db_override = client.app.dependency_overrides[get_db]
    db_generator = get_db_override()
    db = next(db_generator)
    try:
        event = db.scalar(
            select(ActivityLog).where(ActivityLog.action == "APPROVE")
        )
        assert event is not None
        assert event.actor_email == TEST_ADMIN_EMAIL
        assert event.record_label == NEW_ACCOUNT["email"]
    finally:
        db_generator.close()

    client.cookies.clear()
    login_response = client.post(
        LOGIN_PATH,
        json={
            "email": NEW_ACCOUNT["email"],
            "password": NEW_ACCOUNT["password"],
        },
    )
    assert login_response.status_code == 200


def test_rejected_account_is_permanent_and_cannot_sign_in(
    client: TestClient,
) -> None:
    pending = register_pending_account(client)

    response = client.patch(f"{ACCOUNTS_PATH}/{pending['id']}/reject")

    assert response.status_code == 200
    assert response.json()["approval_status"] == "rejected"
    assert response.json()["is_active"] is False
    assert client.patch(f"{ACCOUNTS_PATH}/{pending['id']}/approve").status_code == 409

    duplicate_response = client.post(REGISTER_PATH, json=NEW_ACCOUNT)
    assert duplicate_response.status_code == 409

    client.cookies.clear()
    login_response = client.post(
        LOGIN_PATH,
        json={
            "email": NEW_ACCOUNT["email"],
            "password": NEW_ACCOUNT["password"],
        },
    )
    assert login_response.status_code == 403
    assert login_response.json()["detail"] == {
        "code": "account_rejected",
        "message": "Your account registration was rejected",
    }


def test_account_transition_requires_pending_account(client: TestClient) -> None:
    response = client.patch(f"{ACCOUNTS_PATH}/1/approve")
    missing_response = client.patch(f"{ACCOUNTS_PATH}/999/approve")

    assert response.status_code == 409
    assert response.json() == {
        "detail": "Only pending accounts can be approved"
    }
    assert missing_response.status_code == 404
    assert missing_response.json() == {"detail": "Account not found"}
