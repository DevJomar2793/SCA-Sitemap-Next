"""Database operations and search rules for sitemap pages."""

import re

from sqlalchemy import delete, func, or_, select
from sqlalchemy.orm import Session

from app.model import AdminSitemap
from app.schema import AdminSitemapCreate, AdminSitemapUpdate

PREFIXED_SCREEN_PATTERN = re.compile(
    r"^(?P<alpha>[A-Za-z][A-Za-z-]*)[\s_-]+(?P<screen_number>.+)$"
)


class SitemapPageNotFoundError(Exception):
    """Raised when a sitemap page does not exist."""


def get_sitemap_page(db: Session, page_id: int) -> AdminSitemap:
    """Return one sitemap page or raise a domain-specific not-found error."""
    sitemap_page = db.get(AdminSitemap, page_id)
    if sitemap_page is None:
        raise SitemapPageNotFoundError
    return sitemap_page


def list_sitemap_pages(db: Session) -> list[AdminSitemap]:
    """Return sitemap pages in their stable database order."""
    statement = select(AdminSitemap).order_by(AdminSitemap.id)
    return list(db.scalars(statement))


def search_sitemap_pages(db: Session, identifier: str) -> list[AdminSitemap]:
    """Find pages by a screen number, with optional alpha prefix support."""
    alpha: str | None = None
    screen_number = identifier
    prefixed_identifier = PREFIXED_SCREEN_PATTERN.fullmatch(identifier)
    if prefixed_identifier:
        alpha = prefixed_identifier.group("alpha")
        screen_number = prefixed_identifier.group("screen_number").strip()

    screen_number_condition = (
        func.lower(AdminSitemap.screen_number) == screen_number.lower()
    )
    if screen_number.isdigit():
        normalized_number = screen_number.lstrip("0") or "0"
        screen_number_condition = or_(
            screen_number_condition,
            func.ltrim(AdminSitemap.screen_number, "0") == normalized_number,
        )

    conditions = [screen_number_condition]
    if alpha:
        conditions.append(func.lower(AdminSitemap.alpha) == alpha.lower())

    statement = select(AdminSitemap).where(*conditions).order_by(AdminSitemap.id)
    return list(db.scalars(statement))


def create_sitemap_page(
    db: Session,
    payload: AdminSitemapCreate,
) -> AdminSitemap:
    """Create and persist one sitemap page."""
    sitemap_page = AdminSitemap(**payload.model_dump())
    db.add(sitemap_page)
    commit_changes(db)
    db.refresh(sitemap_page)
    return sitemap_page


def update_sitemap_page(
    db: Session,
    page_id: int,
    payload: AdminSitemapUpdate,
) -> AdminSitemap:
    """Apply validated partial changes to one sitemap page."""
    sitemap_page = get_sitemap_page(db, page_id)
    for field, value in payload.model_dump(exclude_unset=True).items():
        setattr(sitemap_page, field, value)

    commit_changes(db)
    db.refresh(sitemap_page)
    return sitemap_page


def delete_sitemap_page(db: Session, page_id: int) -> None:
    """Delete one sitemap page."""
    db.delete(get_sitemap_page(db, page_id))
    commit_changes(db)


def replace_sitemap_pages(db: Session, records: list[dict[str, str]]) -> None:
    """Replace all sitemap pages after a workbook has been fully validated."""
    db.execute(delete(AdminSitemap))
    db.add_all(AdminSitemap(**record) for record in records)
    commit_changes(db)


def commit_changes(db: Session) -> None:
    """Commit a unit of work and leave the session usable after an error."""
    try:
        db.commit()
    except Exception:
        db.rollback()
        raise
