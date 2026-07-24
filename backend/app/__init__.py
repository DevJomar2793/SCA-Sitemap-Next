"""SCA Sitemap API application package."""

from importlib import import_module
from types import ModuleType

__all__ = ["main"]


def __getattr__(name: str) -> ModuleType:
    """Resolve the legacy ``app:main.app`` Uvicorn target lazily."""
    if name == "main":
        return import_module("app.main")
    raise AttributeError(f"module {__name__!r} has no attribute {name!r}")
