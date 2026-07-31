import os
from dataclasses import dataclass
from pathlib import Path

from dotenv import load_dotenv

DEFAULT_APP_NAME = "SCA Sitemap API"
DEFAULT_APP_VERSION = "0.1.0"
DEFAULT_CORS_ORIGINS = ("http://localhost:3000",)
DEFAULT_AUTH_SESSION_MINUTES = 30

load_dotenv(Path(__file__).resolve().parents[1] / ".env")


def parse_boolean(value: str | None, *, default: bool = False) -> bool:
    if value is None:
        return default
    return value.strip().lower() in {"1", "true", "yes", "on"}


@dataclass(frozen=True, slots=True)
class Settings:
    app_name: str = DEFAULT_APP_NAME
    app_version: str = DEFAULT_APP_VERSION
    cors_origins: tuple[str, ...] = DEFAULT_CORS_ORIGINS
    auth_secret_key: str | None = None
    auth_cookie_secure: bool = False
    auth_session_minutes: int = DEFAULT_AUTH_SESSION_MINUTES
    admin_email: str | None = None
    admin_password: str | None = None
    admin_name: str | None = None

    @classmethod
    def from_environment(cls) -> "Settings":
        raw_origins = os.getenv("CORS_ORIGINS")
        cors_origins = DEFAULT_CORS_ORIGINS

        if raw_origins is not None:
            cors_origins = tuple(
                origin.strip()
                for origin in raw_origins.split(",")
                if origin.strip()
            )

        return cls(
            app_name=os.getenv("APP_NAME", DEFAULT_APP_NAME),
            app_version=os.getenv("APP_VERSION", DEFAULT_APP_VERSION),
            cors_origins=cors_origins,
            auth_secret_key=os.getenv("AUTH_SECRET_KEY"),
            auth_cookie_secure=parse_boolean(os.getenv("AUTH_COOKIE_SECURE")),
            auth_session_minutes=int(
                os.getenv(
                    "AUTH_SESSION_MINUTES",
                    str(DEFAULT_AUTH_SESSION_MINUTES),
                )
            ),
            admin_email=os.getenv("ADMIN_EMAIL"),
            admin_password=os.getenv("ADMIN_PASSWORD"),
            admin_name=os.getenv("ADMIN_NAME"),
        )
