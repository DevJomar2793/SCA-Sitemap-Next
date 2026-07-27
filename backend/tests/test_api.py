from fastapi.testclient import TestClient
from uvicorn.importer import import_from_string

from app.config import Settings
from app.main import app, create_app

FRONTEND_ORIGIN = "http://localhost:3000"
UNCONFIGURED_ORIGIN = "https://example.com"


def create_test_client() -> TestClient:
    settings = Settings(cors_origins=(FRONTEND_ORIGIN,))
    return TestClient(create_app(settings, initialize_database=False))


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


def test_crud_methods_are_allowed_for_configured_origin() -> None:
    with create_test_client() as client:
        response = client.options(
            "/api/v1/update-admin-page/1",
            headers={
                "Origin": FRONTEND_ORIGIN,
                "Access-Control-Request-Method": "PATCH",
            },
        )

    assert response.status_code == 200
    assert response.headers["access-control-allow-methods"] == "GET, POST, PATCH, DELETE"


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


def test_standard_asgi_target_resolves() -> None:
    assert import_from_string("app.main:app") is app
