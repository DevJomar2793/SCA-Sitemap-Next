"""Database operations and search rules for sitemap pages."""

import re

from sqlalchemy import delete, func, or_, select
from sqlalchemy.orm import Session

from app.model import AdminSitemap, AdminUser
from app.schema import AdminSitemapCreate, AdminSitemapUpdate
from app.services.activity_logs import SITEMAP_MODULE, add_activity_log

PREFIXED_SCREEN_PATTERN = re.compile(
    r"^(?P<alpha>[A-Za-z][A-Za-z-]*)[\s_-]+(?P<screen_number>.+)$"
)
AUDITED_FIELDS = (
    "alpha",
    "screen_number",
    "screen_type",
    "screen_description",
    "file_label",
    "screen_label",
    "notes",
    "page_location",
)


class SitemapPageNotFoundError(Exception):
    """Raised when a sitemap page does not exist."""


def generate_sitemap_labels(
    alpha: str,
    screen_number: str,
    screen_description: str,
) -> dict[str, str]:
    """Generate the canonical file and screen labels from their source fields."""
    file_label = f"{alpha.strip()}-{screen_number.strip()}"
    screen_label = f"{file_label}-{screen_description.strip()}"
    return {"file_label": file_label, "screen_label": screen_label}


def sitemap_snapshot(page: AdminSitemap) -> dict[str, str]:
    return {field: getattr(page, field) for field in AUDITED_FIELDS}


def snapshot_changes(
    values: dict[str, str],
    *,
    action: str,
) -> list[dict[str, str | None]]:
    return [
        {
            "field": field,
            "previous_value": value if action == "DELETE" else None,
            "new_value": value if action == "ADD" else None,
        }
        for field, value in values.items()
    ]


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
    actor: AdminUser,
) -> AdminSitemap:
    """Create and persist one sitemap page."""
    values = payload.model_dump()
    values.update(
        generate_sitemap_labels(
            values["alpha"],
            values["screen_number"],
            values["screen_description"],
        )
    )
    sitemap_page = AdminSitemap(**values)
    db.add(sitemap_page)
    db.flush()
    add_activity_log(
        db,
        actor_user_id=actor.id,
        action="ADD",
        module=SITEMAP_MODULE,
        record_id=sitemap_page.id,
        record_label=sitemap_page.screen_label,
        changes=snapshot_changes(sitemap_snapshot(sitemap_page), action="ADD"),
    )
    commit_changes(db)
    db.refresh(sitemap_page)
    return sitemap_page


def update_sitemap_page(
    db: Session,
    page_id: int,
    payload: AdminSitemapUpdate,
    actor: AdminUser,
) -> AdminSitemap:
    """Apply validated partial changes to one sitemap page."""
    sitemap_page = get_sitemap_page(db, page_id)
    previous_values = sitemap_snapshot(sitemap_page)
    for field, value in payload.model_dump(exclude_unset=True).items():
        setattr(sitemap_page, field, value)

    generated_labels = generate_sitemap_labels(
        sitemap_page.alpha,
        sitemap_page.screen_number,
        sitemap_page.screen_description,
    )
    sitemap_page.file_label = generated_labels["file_label"]
    sitemap_page.screen_label = generated_labels["screen_label"]

    current_values = sitemap_snapshot(sitemap_page)
    changes = [
        {
            "field": field,
            "previous_value": previous_values[field],
            "new_value": current_values[field],
        }
        for field in AUDITED_FIELDS
        if previous_values[field] != current_values[field]
    ]
    if changes:
        add_activity_log(
            db,
            actor_user_id=actor.id,
            action="UPDATE",
            module=SITEMAP_MODULE,
            record_id=sitemap_page.id,
            record_label=sitemap_page.screen_label,
            changes=changes,
        )

    commit_changes(db)
    db.refresh(sitemap_page)
    return sitemap_page


def delete_sitemap_page(db: Session, page_id: int, actor: AdminUser) -> None:
    """Delete one sitemap page."""
    sitemap_page = get_sitemap_page(db, page_id)
    snapshot = sitemap_snapshot(sitemap_page)
    add_activity_log(
        db,
        actor_user_id=actor.id,
        action="DELETE",
        module=SITEMAP_MODULE,
        record_id=sitemap_page.id,
        record_label=sitemap_page.screen_label,
        changes=snapshot_changes(snapshot, action="DELETE"),
    )
    db.delete(sitemap_page)
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
