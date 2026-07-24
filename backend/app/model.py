from datetime import datetime

from sqlalchemy import DateTime, String, func
from sqlalchemy.orm import Mapped, mapped_column

from app.database import Base


class AdminSitemap(Base):
    __tablename__ = "admin_sitemap"

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
