"""Database operations for administrator accounts."""

from sqlalchemy import case, func, select
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session

from model import AdminUser
from schema import AdminRegister
from security import hash_password, normalize_email
from services.activity_logs import ADMINISTRATORS_MODULE, add_activity_log


class DuplicateAdminEmailError(Exception):
    """Raised when an email address already belongs to an administrator."""


class AdminAccountNotFoundError(Exception):
    """Raised when the requested administrator does not exist."""


class InvalidApprovalTransitionError(Exception):
    """Raised when an account is no longer waiting for approval."""


def register_admin(db: Session, payload: AdminRegister) -> AdminUser:
    """Create the first administrator as approved and later accounts as pending."""
    email = normalize_email(str(payload.email))
    existing_admin = db.scalar(
        select(AdminUser).where(func.lower(AdminUser.email) == email)
    )
    if existing_admin is not None:
        raise DuplicateAdminEmailError

    is_first_account = (db.scalar(select(func.count(AdminUser.id))) or 0) == 0
    approval_status = "approved" if is_first_account else "pending"
    admin = AdminUser(
        email=email,
        full_name=payload.full_name,
        password_hash=hash_password(payload.password),
        is_active=is_first_account,
        approval_status=approval_status,
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
                    "field": "approval_status",
                    "previous_value": None,
                    "new_value": admin.approval_status,
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


def list_admin_accounts(db: Session) -> list[AdminUser]:
    """Return pending accounts first, followed by the newest accounts."""
    pending_first = case((AdminUser.approval_status == "pending", 0), else_=1)
    return list(
        db.scalars(
            select(AdminUser).order_by(
                pending_first,
                AdminUser.created_at.desc(),
                AdminUser.id.desc(),
            )
        )
    )


def approve_admin_account(
    db: Session,
    account_id: int,
    actor: AdminUser,
) -> AdminUser:
    account = db.get(AdminUser, account_id)
    if account is None:
        raise AdminAccountNotFoundError
    if account.approval_status != "pending":
        raise InvalidApprovalTransitionError(
            "Only pending accounts can be approved"
        )

    account.approval_status = "approved"
    account.is_active = True
    add_activity_log(
        db,
        actor=actor,
        action="APPROVE",
        module=ADMINISTRATORS_MODULE,
        record_id=account.id,
        record_label=account.email,
        changes=[
            {
                "field": "approval_status",
                "previous_value": "pending",
                "new_value": "approved",
            },
            {
                "field": "is_active",
                "previous_value": "False",
                "new_value": "True",
            },
        ],
    )
    try:
        db.commit()
    except Exception:
        db.rollback()
        raise
    db.refresh(account)
    return account


def reject_admin_account(
    db: Session,
    account_id: int,
    actor: AdminUser,
) -> AdminUser:
    account = db.get(AdminUser, account_id)
    if account is None:
        raise AdminAccountNotFoundError
    if account.approval_status != "pending":
        raise InvalidApprovalTransitionError(
            "Only pending accounts can be rejected"
        )

    account.approval_status = "rejected"
    account.is_active = False
    add_activity_log(
        db,
        actor=actor,
        action="REJECT",
        module=ADMINISTRATORS_MODULE,
        record_id=account.id,
        record_label=account.email,
        changes=[
            {
                "field": "approval_status",
                "previous_value": "pending",
                "new_value": "rejected",
            }
        ],
    )
    try:
        db.commit()
    except Exception:
        db.rollback()
        raise
    db.refresh(account)
    return account
