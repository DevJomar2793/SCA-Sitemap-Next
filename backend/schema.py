from datetime import datetime
from typing import Any, Literal

from pydantic import BaseModel, ConfigDict, EmailStr, Field, model_validator

GENERATED_LABEL_FIELDS = frozenset({"file_label", "screen_label"})


def reject_generated_label_fields(value: Any) -> Any:
    if isinstance(value, dict):
        submitted_fields = GENERATED_LABEL_FIELDS.intersection(value)
        if submitted_fields:
            field_names = ", ".join(sorted(submitted_fields))
            raise ValueError(
                f"System-generated fields must not be provided: {field_names}"
            )
    return value


class AdminSitemapWritableFields(BaseModel):
    model_config = ConfigDict(str_strip_whitespace=True)

    alpha: str = Field(min_length=1)
    screen_number: str = Field(min_length=1)
    screen_type: str = Field(min_length=1)
    screen_description: str = Field(min_length=1)
    notes: str = Field(min_length=1)
    page_location: str = Field(min_length=1)


class AdminSitemapFields(AdminSitemapWritableFields):
    file_label: str = Field(min_length=1)
    screen_label: str = Field(min_length=1)


class AdminSitemapCreate(AdminSitemapWritableFields):
    @model_validator(mode="before")
    @classmethod
    def reject_generated_labels(cls, value: Any) -> Any:
        return reject_generated_label_fields(value)


class AdminSitemapUpdate(BaseModel):
    model_config = ConfigDict(str_strip_whitespace=True)

    alpha: str | None = Field(default=None, min_length=1)
    screen_number: str | None = Field(default=None, min_length=1)
    screen_type: str | None = Field(default=None, min_length=1)
    screen_description: str | None = Field(default=None, min_length=1)
    notes: str | None = Field(default=None, min_length=1)
    page_location: str | None = Field(default=None, min_length=1)

    @model_validator(mode="before")
    @classmethod
    def reject_generated_labels(cls, value: Any) -> Any:
        return reject_generated_label_fields(value)

    @model_validator(mode="after")
    def validate_changes(self) -> "AdminSitemapUpdate":
        """Require at least one non-null field in a PATCH request."""
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


class SitemapImportRead(BaseModel):
    imported_count: int
    skipped_count: int
    worksheet_count: int
    ignored_worksheets: list[str]


class AdminLogin(BaseModel):
    model_config = ConfigDict(str_strip_whitespace=True)

    email: EmailStr
    password: str = Field(min_length=1, max_length=128)


class AdminRegister(BaseModel):
    model_config = ConfigDict(str_strip_whitespace=True)

    email: EmailStr
    full_name: str = Field(min_length=1, max_length=120)
    password: str = Field(min_length=5, max_length=128)


class AdminUserRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    email: EmailStr
    full_name: str
    is_active: bool
    created_at: datetime


class AdminSessionRead(AdminUserRead):
    expires_at: datetime


class ActivityActorRead(BaseModel):
    id: int
    full_name: str
    email: EmailStr


class ActivityChangeRead(BaseModel):
    field: str
    previous_value: str | None
    new_value: str | None


class ActivityLogRead(BaseModel):
    id: int
    performed_by: ActivityActorRead | None
    action: Literal["ADD", "UPDATE", "DELETE"]
    module: str
    record_id: int
    record_label: str
    changes: list[ActivityChangeRead]
    created_at: datetime


class ActivityFilterOptions(BaseModel):
    users: list[ActivityActorRead]
    modules: list[str]


class ActivityLogPageRead(BaseModel):
    items: list[ActivityLogRead]
    total: int
    page: int
    page_size: int
    page_count: int
    filter_options: ActivityFilterOptions
