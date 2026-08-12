from datetime import datetime, timezone
from math import ceil
from typing import Literal

from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session

from app.database import get_db
from app.schema import ActivityLogPageRead
from app.security import get_current_admin
from app.services.activity_logs import list_activity_logs

router = APIRouter(prefix="/activity-logs", tags=["activity logs"])


@router.get(
    "",
    response_model=ActivityLogPageRead,
    dependencies=[Depends(get_current_admin)],
    summary="List immutable activity logs",
)
def get_activity_logs(
    q: str | None = Query(default=None, max_length=200),
    user_id: int | None = Query(default=None, ge=1),
    action: Literal["ADD", "UPDATE", "DELETE"] | None = None,
    module: str | None = Query(default=None, max_length=80),
    date_from: datetime | None = None,
    date_to: datetime | None = None,
    page: int = Query(default=1, ge=1),
    page_size: int = Query(default=10, ge=1, le=100),
    db: Session = Depends(get_db),
) -> dict[str, object]:
    result = list_activity_logs(
        db,
        query=q,
        user_id=user_id,
        action=action,
        module=module,
        date_from=date_from,
        date_to=date_to,
        page=page,
        page_size=page_size,
    )
    items = [
        {
            "id": activity.id,
            "performed_by": (
                {
                    "id": actor.id,
                    "full_name": actor.full_name,
                    "email": actor.email,
                }
                if actor is not None
                else None
            ),
            "action": activity.action,
            "module": activity.module,
            "record_id": activity.record_id,
            "record_label": activity.record_label,
            "changes": activity.changes,
            "created_at": (
                activity.created_at.replace(tzinfo=timezone.utc)
                if activity.created_at.tzinfo is None
                else activity.created_at
            ),
        }
        for activity, actor in result.rows
    ]
    return {
        "items": items,
        "total": result.total,
        "page": page,
        "page_size": page_size,
        "page_count": ceil(result.total / page_size) if result.total else 0,
        "filter_options": {
            "users": [
                {"id": user.id, "full_name": user.full_name, "email": user.email}
                for user in result.users
            ],
            "modules": result.modules,
        },
    }
