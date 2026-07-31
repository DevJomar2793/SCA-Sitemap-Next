from datetime import datetime

from sqlalchemy import Boolean, DateTime, String, func
from sqlalchemy.orm import Mapped, mapped_column

from app.database import Base


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

    # SQLite sets both dates on create and refreshes updated_at on changes.
    created_at: Mapped[datetime] = mapped_column(
        DateTime,
        nullable=False,
        server_default=func.current_timestamp(),
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime,
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
        DateTime,
        nullable=False,
        server_default=func.current_timestamp(),
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime,
        nullable=False,
        server_default=func.current_timestamp(),
        onupdate=func.current_timestamp(),
    )
