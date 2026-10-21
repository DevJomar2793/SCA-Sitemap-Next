from sys import prefix
from collections.abc import AsyncIterator
from contextlib import asynccontextmanager

from fastapi import APIRouter, FastAPI
from fastapi.middleware.cors import CORSMiddleware

from config import Settings
from database import SessionLocal, init_db
from routes.activity_logs import router as activity_logs_router
from routes.admin_pages import router as admin_pages_router
from routes.auth import router as auth_router
from routes.health import router as health_router
from security import bootstrap_admin


def create_database_lifespan(settings: Settings):
    @asynccontextmanager
    async def database_lifespan(_: FastAPI) -> AsyncIterator[None]:
        """Create database tables and the initial administrator."""
        init_db()
        with SessionLocal() as db:
            bootstrap_admin(db, settings)
        yield

    return database_lifespan


def create_app(
    settings: Settings | None = None,
    *,
    initialize_database: bool = True,
) -> FastAPI:
    resolved_settings = settings or Settings.from_environment()
    application = FastAPI(
        title=resolved_settings.app_name,
        version=resolved_settings.app_version,
        lifespan=(
            create_database_lifespan(resolved_settings)
            if initialize_database
            else None
        ),
    )
    application.state.settings = resolved_settings

    if resolved_settings.cors_origins:
        application.add_middleware(
            CORSMiddleware,
            allow_origins=list(resolved_settings.cors_origins),
            allow_credentials=True,
            allow_methods=["GET", "POST", "PATCH", "DELETE"],
            allow_headers=["*"],
        )

    api_router = APIRouter(prefix="/api/v1")
    api_router.include_router(health_router)
    api_router.include_router(auth_router)
    api_router.include_router(admin_pages_router)
    api_router.include_router(activity_logs_router)
    application.include_router(api_router)
    return application


app = create_app()
