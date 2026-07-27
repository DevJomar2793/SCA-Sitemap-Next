from collections.abc import AsyncIterator
from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.api.router import api_router
from app.config import Settings
from app.database import init_db


@asynccontextmanager
async def database_lifespan(_: FastAPI) -> AsyncIterator[None]:
    """Create missing database tables when the API starts."""
    init_db()
    yield


def create_app(
    settings: Settings | None = None,
    *,
    initialize_database: bool = True,
) -> FastAPI:
    resolved_settings = settings or Settings.from_environment()
    application = FastAPI(
        title=resolved_settings.app_name,
        version=resolved_settings.app_version,
        lifespan=database_lifespan if initialize_database else None,
    )

    if resolved_settings.cors_origins:
        application.add_middleware(
            CORSMiddleware,
            allow_origins=list(resolved_settings.cors_origins),
            allow_credentials=False,
            allow_methods=["GET", "POST", "PATCH", "DELETE"],
            allow_headers=["*"],
        )

    application.include_router(api_router)
    return application


app = create_app()
