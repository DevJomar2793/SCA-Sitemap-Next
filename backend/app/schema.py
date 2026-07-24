from datetime import datetime
from typing import Annotated

from pydantic import BaseModel, ConfigDict, StringConstraints, model_validator

NonEmptyString = Annotated[str, StringConstraints(strip_whitespace=True, min_length=1)]


class AdminSitemapFields(BaseModel):
    alpha: NonEmptyString
    screen_number: NonEmptyString
    screen_type: NonEmptyString
    screen_description: NonEmptyString
    file_label: NonEmptyString
    screen_label: NonEmptyString
    notes: NonEmptyString
    page_location: NonEmptyString


class AdminSitemapCreate(AdminSitemapFields):
    pass


class AdminSitemapUpdate(BaseModel):
    alpha: NonEmptyString | None = None
    screen_number: NonEmptyString | None = None
    screen_type: NonEmptyString | None = None
    screen_description: NonEmptyString | None = None
    file_label: NonEmptyString | None = None
    screen_label: NonEmptyString | None = None
    notes: NonEmptyString | None = None
    page_location: NonEmptyString | None = None

    @model_validator(mode="after")
    def validate_changes(self) -> "AdminSitemapUpdate":
        if not self.model_fields_set:
            raise ValueError("At least one field must be provided")
        if any(getattr(self, field) is None for field in self.model_fields_set):
            raise ValueError("Updated fields cannot be null")
        return self


class AdminSitemapRead(AdminSitemapFields):
    model_config = ConfigDict(from_attributes=True)

    id: int
    created_at: datetime
    updated_at: datetime
