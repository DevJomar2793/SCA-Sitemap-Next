"""Immutable audit-log recording and query operations."""

from dataclasses import dataclass
from datetime import datetime
from typing import Literal

from sqlalchemy import String, cast, func, or_, select
from sqlalchemy.orm import Session

from model import ActivityLog, AdminUser

ActivityAction = Literal[
    "ADD",
    "UPDATE",
    "DELETE",
    "LOGIN",
    "LOGOUT",
    "REGISTER",
    "IMPORT",
]
SITEMAP_MODULE = "Sitemap"
AUTHENTICATION_MODULE = "Authentication"
ADMINISTRATORS_MODULE = "Administrators"


@dataclass(frozen=True, slots=True)
class ActivityActorSnapshot:
    id: int
    full_name: str
    email: str


@dataclass(slots=True)
class ActivityLogQueryResult:
    rows: list[ActivityLog]
    total: int
    users: list[ActivityActorSnapshot]
    actions: list[ActivityAction]
    modules: list[str]


def add_activity_log(
    db: Session,
    *,
    actor: AdminUser,
    action: ActivityAction,
    module: str,
    record_id: int | None,
    record_label: str,
    changes: list[dict[str, str | None]],
) -> ActivityLog:
    """Stage an immutable activity record in the caller's transaction."""
    activity = ActivityLog(
        actor_user_id=actor.id,
        actor_full_name=actor.full_name,
        actor_email=actor.email,
        action=action,
        module=module,
        record_id=record_id,
        record_label=record_label,
        changes=changes,
    )
    db.add(activity)
    return activity


def commit_activity_log(db: Session) -> None:
    """Commit a standalone audit event and restore the session after failure."""
    try:
        db.commit()
    except Exception:
        db.rollback()
        raise


def list_activity_logs(
    db: Session,
    *,
    query: str | None,
    user_id: int | None,
    action: ActivityAction | None,
    module: str | None,
    date_from: datetime | None,
    date_to: datetime | None,
    page: int,
    page_size: int,
) -> ActivityLogQueryResult:
    """Return a filtered page plus complete user/module filter options."""
    conditions = []
    if query:
        pattern = f"%{query.strip().lower()}%"
        conditions.append(
            or_(
                func.lower(ActivityLog.actor_full_name).like(pattern),
                func.lower(ActivityLog.actor_email).like(pattern),
                func.lower(ActivityLog.action).like(pattern),
                func.lower(ActivityLog.module).like(pattern),
                func.lower(ActivityLog.record_label).like(pattern),
                func.lower(cast(ActivityLog.changes, String)).like(pattern),
            )
        )
    if user_id is not None:
        conditions.append(ActivityLog.actor_user_id == user_id)
    if action is not None:
        conditions.append(ActivityLog.action == action)
    if module:
        conditions.append(func.lower(ActivityLog.module) == module.strip().lower())
    if date_from is not None:
        conditions.append(ActivityLog.created_at >= date_from)
    if date_to is not None:
        conditions.append(ActivityLog.created_at < date_to)

    base_query = select(ActivityLog).where(*conditions)
    rows = list(
        db.scalars(
            base_query.order_by(ActivityLog.created_at.desc(), ActivityLog.id.desc())
            .offset((page - 1) * page_size)
            .limit(page_size)
        )
    )
    total = db.scalar(
        select(func.count(ActivityLog.id)).where(*conditions)
    ) or 0
    user_rows = db.execute(
        select(
            ActivityLog.actor_user_id,
            func.max(ActivityLog.actor_full_name),
            func.max(ActivityLog.actor_email),
        )
        .where(
            ActivityLog.actor_full_name.is_not(None),
            ActivityLog.actor_email.is_not(None),
        )
        .group_by(ActivityLog.actor_user_id)
        .order_by(
            func.max(ActivityLog.actor_full_name),
            func.max(ActivityLog.actor_email),
        )
    ).all()
    users = [
        ActivityActorSnapshot(
            id=user_id,
            full_name=full_name,
            email=email,
        )
        for user_id, full_name, email in user_rows
        if full_name is not None and email is not None
    ]
    actions = list(
        db.scalars(
            select(ActivityLog.action)
            .distinct()
            .order_by(ActivityLog.action)
        )
    )
    modules = list(
        db.scalars(
            select(ActivityLog.module)
            .distinct()
            .order_by(ActivityLog.module)
        )
    )
    return ActivityLogQueryResult(
        rows=rows,
        total=total,
        users=users,
        actions=actions,
        modules=modules,
    )
