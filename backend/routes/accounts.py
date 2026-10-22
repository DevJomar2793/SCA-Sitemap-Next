from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from database import get_db
from model import AdminUser
from schema import AdminUserRead
from security import get_current_admin, require_trusted_origin
from services.admin_users import (
    AdminAccountNotFoundError,
    InvalidApprovalTransitionError,
    approve_admin_account,
    list_admin_accounts,
    reject_admin_account,
)

router = APIRouter(prefix="/accounts", tags=["account permissions"])


def account_not_found_error() -> HTTPException:
    return HTTPException(
        status_code=status.HTTP_404_NOT_FOUND,
        detail="Account not found",
    )


def invalid_transition_error(message: str) -> HTTPException:
    return HTTPException(
        status_code=status.HTTP_409_CONFLICT,
        detail=message,
    )


@router.get("", response_model=list[AdminUserRead], summary="List accounts")
def get_accounts(
    _: AdminUser = Depends(get_current_admin),
    db: Session = Depends(get_db),
) -> list[AdminUser]:
    return list_admin_accounts(db)


@router.patch(
    "/{account_id}/approve",
    response_model=AdminUserRead,
    dependencies=[Depends(require_trusted_origin)],
    summary="Approve a pending account",
)
def approve_account(
    account_id: int,
    admin: AdminUser = Depends(get_current_admin),
    db: Session = Depends(get_db),
) -> AdminUser:
    try:
        return approve_admin_account(db, account_id, admin)
    except AdminAccountNotFoundError:
        raise account_not_found_error() from None
    except InvalidApprovalTransitionError as error:
        raise invalid_transition_error(str(error)) from None


@router.patch(
    "/{account_id}/reject",
    response_model=AdminUserRead,
    dependencies=[Depends(require_trusted_origin)],
    summary="Permanently reject a pending account",
)
def reject_account(
    account_id: int,
    admin: AdminUser = Depends(get_current_admin),
    db: Session = Depends(get_db),
) -> AdminUser:
    try:
        return reject_admin_account(db, account_id, admin)
    except AdminAccountNotFoundError:
        raise account_not_found_error() from None
    except InvalidApprovalTransitionError as error:
        raise invalid_transition_error(str(error)) from None
