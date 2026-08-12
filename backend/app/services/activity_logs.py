"""Immutable audit-log recording and query operations."""

from dataclasses import dataclass
from datetime import datetime
from typing import Literal

from sqlalchemy import String, cast, func, or_, select
from sqlalchemy.orm import Session

from app.model import ActivityLog, AdminUser

ActivityAction = Literal["ADD", "UPDATE", "DELETE"]
SITEMAP_MODULE = "Sitemap"


@dataclass(slots=True)
class ActivityLogQueryResult:
    rows: list[tuple[ActivityLog, AdminUser | None]]
    total: int
    users: list[AdminUser]
    modules: list[str]


def add_activity_log(
    db: Session,
    *,
    actor_user_id: int,
    action: ActivityAction,
    module: str,
    record_id: int,
    record_label: str,
    changes: list[dict[str, str | None]],
) -> ActivityLog:
    """Stage an immutable activity record in the caller's transaction."""
    activity = ActivityLog(
        actor_user_id=actor_user_id,
        action=action,
        module=module,
        record_id=record_id,
        record_label=record_label,
        changes=changes,
    )
    db.add(activity)
    return activity


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
                func.lower(AdminUser.full_name).like(pattern),
                func.lower(AdminUser.email).like(pattern),
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

    base_query = (
        select(ActivityLog, AdminUser)
        .outerjoin(AdminUser, AdminUser.id == ActivityLog.actor_user_id)
        .where(*conditions)
    )
    rows = list(
        db.execute(
            base_query.order_by(ActivityLog.created_at.desc(), ActivityLog.id.desc())
            .offset((page - 1) * page_size)
            .limit(page_size)
        ).all()
    )
    total = db.scalar(
        select(func.count(ActivityLog.id))
        .outerjoin(AdminUser, AdminUser.id == ActivityLog.actor_user_id)
        .where(*conditions)
    ) or 0
    users = list(
        db.scalars(
            select(AdminUser)
            .join(ActivityLog, ActivityLog.actor_user_id == AdminUser.id)
            .distinct()
            .order_by(AdminUser.full_name, AdminUser.email)
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
        modules=modules,
    )
