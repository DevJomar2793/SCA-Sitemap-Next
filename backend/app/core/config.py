import os
from dataclasses import dataclass

DEFAULT_APP_NAME = "SCA Sitemap API"
DEFAULT_APP_VERSION = "0.1.0"
DEFAULT_CORS_ORIGINS = ("http://localhost:3000",)


@dataclass(frozen=True, slots=True)
class Settings:
    app_name: str = DEFAULT_APP_NAME
    app_version: str = DEFAULT_APP_VERSION
    cors_origins: tuple[str, ...] = DEFAULT_CORS_ORIGINS

    @classmethod
    def from_environment(cls) -> "Settings":
        raw_origins = os.getenv("CORS_ORIGINS")
        cors_origins = (
            tuple(origin.strip() for origin in raw_origins.split(",") if origin.strip())
            if raw_origins is not None
            else DEFAULT_CORS_ORIGINS
        )

        return cls(
            app_name=os.getenv("APP_NAME", DEFAULT_APP_NAME),
            app_version=os.getenv("APP_VERSION", DEFAULT_APP_VERSION),
            cors_origins=cors_origins,
        )
