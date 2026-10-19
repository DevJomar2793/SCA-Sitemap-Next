"""Database operations for administrator accounts."""

from sqlalchemy import func, select
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session

from model import AdminUser
from schema import AdminRegister
from security import hash_password, normalize_email
from services.activity_logs import ADMINISTRATORS_MODULE, add_activity_log


class DuplicateAdminEmailError(Exception):
    """Raised when an email address already belongs to an administrator."""


def register_admin(db: Session, payload: AdminRegister) -> AdminUser:
    """Create an active administrator from validated registration input."""
    email = normalize_email(str(payload.email))
    existing_admin = db.scalar(
        select(AdminUser).where(func.lower(AdminUser.email) == email)
    )
    if existing_admin is not None:
        raise DuplicateAdminEmailError

    admin = AdminUser(
        email=email,
        full_name=payload.full_name,
        password_hash=hash_password(payload.password),
    )
    db.add(admin)

    try:
        db.flush()
        add_activity_log(
            db,
            actor=admin,
            action="REGISTER",
            module=ADMINISTRATORS_MODULE,
            record_id=admin.id,
            record_label=admin.email,
            changes=[
                {
                    "field": "full_name",
                    "previous_value": None,
                    "new_value": admin.full_name,
                },
                {
                    "field": "email",
                    "previous_value": None,
                    "new_value": admin.email,
                },
                {
                    "field": "is_active",
                    "previous_value": None,
                    "new_value": str(admin.is_active),
                },
            ],
        )
        db.commit()
    except IntegrityError as error:
        db.rollback()
        raise DuplicateAdminEmailError from error
    except Exception:
        db.rollback()
        raise

    db.refresh(admin)
    return admin
