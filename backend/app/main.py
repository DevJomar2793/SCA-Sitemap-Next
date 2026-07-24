import sys
from collections.abc import AsyncIterator
from contextlib import asynccontextmanager
from pathlib import Path

# Add backend directory to sys.path if running as script
sys.path.insert(0, str(Path(__file__).resolve().parent.parent))

import uvicorn
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.api.router import api_router
from app.core.config import Settings
from app.database import init_db


@asynccontextmanager
async def database_lifespan(_: FastAPI) -> AsyncIterator[None]:
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

if __name__ == "__main__":
    uvicorn.run("app.main:app", host="127.0.0.1", port=8000, reload=True)
