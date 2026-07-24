from fastapi.testclient import TestClient

from app.core.config import Settings
from app.main import create_app

FRONTEND_ORIGIN = "http://localhost:3000"
UNCONFIGURED_ORIGIN = "https://example.com"


def create_test_client() -> TestClient:
    settings = Settings(cors_origins=(FRONTEND_ORIGIN,))
    return TestClient(create_app(settings))


def test_health_check() -> None:
    with create_test_client() as client:
        response = client.get("/api/v1/health")

    assert response.status_code == 200
    assert response.json() == {"status": "ok"}


def test_root_is_not_defined() -> None:
    with create_test_client() as client:
        response = client.get("/")

    assert response.status_code == 404


def test_configured_origin_is_allowed() -> None:
    with create_test_client() as client:
        response = client.options(
            "/api/v1/health",
            headers={
                "Origin": FRONTEND_ORIGIN,
                "Access-Control-Request-Method": "GET",
            },
        )

    assert response.status_code == 200
    assert response.headers["access-control-allow-origin"] == FRONTEND_ORIGIN


def test_unconfigured_origin_is_not_allowed() -> None:
    with create_test_client() as client:
        response = client.options(
            "/api/v1/health",
            headers={
                "Origin": UNCONFIGURED_ORIGIN,
                "Access-Control-Request-Method": "GET",
            },
        )

    assert "access-control-allow-origin" not in response.headers
