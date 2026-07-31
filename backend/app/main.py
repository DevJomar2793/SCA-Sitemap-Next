from collections.abc import AsyncIterator
from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.api.router import api_router
from app.config import Settings
from app.database import SessionLocal, init_db
from app.security import bootstrap_admin


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

    application.include_router(api_router)
    return application


app = create_app()
