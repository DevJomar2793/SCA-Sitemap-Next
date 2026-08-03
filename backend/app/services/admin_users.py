"""Database operations for administrator accounts."""

from sqlalchemy import func, select
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session

from app.model import AdminUser
from app.schema import AdminRegister
from app.security import hash_password, normalize_email


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
        db.commit()
    except IntegrityError as error:
        db.rollback()
        raise DuplicateAdminEmailError from error

    db.refresh(admin)
    return admin
