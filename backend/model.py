from datetime import datetime

from typing import Any

from sqlalchemy import JSON, Boolean, DateTime, ForeignKey, Integer, String, func
from sqlalchemy.orm import Mapped, mapped_column

from database import Base


class AdminSitemap(Base):
    __tablename__ = "page_list"

    id: Mapped[int] = mapped_column(primary_key=True, autoincrement=True)
    alpha: Mapped[str] = mapped_column(String, nullable=False)
    screen_number: Mapped[str] = mapped_column(String, nullable=False)
    screen_type: Mapped[str] = mapped_column(String, nullable=False)
    screen_description: Mapped[str] = mapped_column(String, nullable=False)
    file_label: Mapped[str] = mapped_column(String, nullable=False)
    screen_label: Mapped[str] = mapped_column(String, nullable=False)
    notes: Mapped[str] = mapped_column(String, nullable=False)
    page_location: Mapped[str] = mapped_column(String, nullable=False)

    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        nullable=False,
        server_default=func.current_timestamp(),
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        nullable=False,
        server_default=func.current_timestamp(),
        onupdate=func.current_timestamp(),
    )


class AdminUser(Base):
    __tablename__ = "admin_users"

    id: Mapped[int] = mapped_column(primary_key=True, autoincrement=True)
    email: Mapped[str] = mapped_column(
        String(320),
        nullable=False,
        unique=True,
        index=True,
    )
    full_name: Mapped[str] = mapped_column(String(120), nullable=False)
    password_hash: Mapped[str] = mapped_column(String(512), nullable=False)
    is_active: Mapped[bool] = mapped_column(
        Boolean,
        nullable=False,
        default=True,
        server_default="1",
    )
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        nullable=False,
        server_default=func.current_timestamp(),
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        nullable=False,
        server_default=func.current_timestamp(),
        onupdate=func.current_timestamp(),
    )


class ActivityLog(Base):
    __tablename__ = "activity_logs"

    id: Mapped[int] = mapped_column(primary_key=True, autoincrement=True)
    actor_user_id: Mapped[int] = mapped_column(
        ForeignKey("admin_users.id"), nullable=False, index=True
    )
    actor_full_name: Mapped[str | None] = mapped_column(String(120), nullable=True)
    actor_email: Mapped[str | None] = mapped_column(String(320), nullable=True)
    action: Mapped[str] = mapped_column(String(16), nullable=False, index=True)
    module: Mapped[str] = mapped_column(String(80), nullable=False, index=True)
    record_id: Mapped[int | None] = mapped_column(Integer, nullable=True)
    record_label: Mapped[str] = mapped_column(String(512), nullable=False)
    changes: Mapped[list[dict[str, Any]]] = mapped_column(JSON, nullable=False)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        nullable=False,
        server_default=func.current_timestamp(),
        index=True,
    )
