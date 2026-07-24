from datetime import datetime

from pydantic import BaseModel, ConfigDict, Field, model_validator


class AdminSitemapFields(BaseModel):
    model_config = ConfigDict(str_strip_whitespace=True)

    alpha: str = Field(min_length=1)
    screen_number: str = Field(min_length=1)
    screen_type: str = Field(min_length=1)
    screen_description: str = Field(min_length=1)
    file_label: str = Field(min_length=1)
    screen_label: str = Field(min_length=1)
    notes: str = Field(min_length=1)
    page_location: str = Field(min_length=1)


class AdminSitemapCreate(AdminSitemapFields):
    pass


class AdminSitemapUpdate(BaseModel):
    model_config = ConfigDict(str_strip_whitespace=True)

    alpha: str | None = Field(default=None, min_length=1)
    screen_number: str | None = Field(default=None, min_length=1)
    screen_type: str | None = Field(default=None, min_length=1)
    screen_description: str | None = Field(default=None, min_length=1)
    file_label: str | None = Field(default=None, min_length=1)
    screen_label: str | None = Field(default=None, min_length=1)
    notes: str | None = Field(default=None, min_length=1)
    page_location: str | None = Field(default=None, min_length=1)

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
