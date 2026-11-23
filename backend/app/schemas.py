"""Pydantic request models. Responses are plain dicts built by the services."""

import re
from datetime import date, datetime
from typing import Literal

from pydantic import BaseModel, field_validator, model_validator

from .stages import STAGE_NAMES

EMAIL_RE = re.compile(r"^[^@\s]+@[^@\s]+\.[^@\s]+$")
ContactStatus = Literal["lead", "qualified", "customer"]
ActivityType = Literal["note", "call", "email"]


def _clean(value: str | None) -> str | None:
    if value is None:
        return None
    value = value.strip()
    return value or None


class _Base(BaseModel):
    # Field names that may not be null or blank in a PATCH.
    _required: tuple[str, ...] = ()

    @field_validator("*", mode="before")
    @classmethod
    def _strip(cls, v):
        return v.strip() if isinstance(v, str) else v

    @model_validator(mode="after")
    def _check_required(self):
        for field in self._required:
            if field in self.model_fields_set and not getattr(self, field):
                raise ValueError(f"{field.replace('_', ' ').capitalize()} is required")
        return self


class _EmailMixin(BaseModel):
    @field_validator("email", check_fields=False)
    @classmethod
    def _email(cls, v):
        if v and not EMAIL_RE.match(v):
            raise ValueError("Email doesn't look right")
        return v or None


class OrganizationCreate(_Base):
    name: str
    website: str | None = None
    industry: str | None = None
    notes: str | None = None
    _required = ("name",)

    @model_validator(mode="after")
    def _name(self):
        if not self.name:
            raise ValueError("Name is required")
        return self


class OrganizationUpdate(_Base):
    name: str | None = None
    website: str | None = None
    industry: str | None = None
    notes: str | None = None
    _required = ("name",)


class ContactCreate(_EmailMixin, _Base):
    name: str
    email: str | None = None
    phone: str | None = None
    job_title: str | None = None
    organization_id: int | None = None
    status: ContactStatus = "lead"

    @model_validator(mode="after")
    def _name(self):
        if not self.name:
            raise ValueError("Name is required")
        return self


class ContactUpdate(_EmailMixin, _Base):
    name: str | None = None
    email: str | None = None
    phone: str | None = None
    job_title: str | None = None
    organization_id: int | None = None
    status: ContactStatus | None = None
    _required = ("name", "status")


class _StageMixin(BaseModel):
    @field_validator("stage", check_fields=False)
    @classmethod
    def _stage(cls, v):
        if v is not None and v not in STAGE_NAMES:
            raise ValueError(f"Stage must be one of: {', '.join(STAGE_NAMES)}")
        return v


class DealCreate(_StageMixin, _Base):
    name: str
    organization_id: int | None = None
    contact_id: int | None = None
    stage: str = "New"
    value: int
    probability: int | None = None
    close_date: date | None = None

    @field_validator("value")
    @classmethod
    def _value(cls, v: int) -> int:
        if v < 0:
            raise ValueError("Value must be 0 or more")
        return v

    @field_validator("probability")
    @classmethod
    def _probability(cls, v: int | None) -> int | None:
        if v is not None and not 0 <= v <= 100:
            raise ValueError("Probability must be between 0 and 100")
        return v

    @model_validator(mode="after")
    def _name(self):
        if not self.name:
            raise ValueError("Name is required")
        return self


class DealUpdate(_StageMixin, _Base):
    name: str | None = None
    organization_id: int | None = None
    contact_id: int | None = None
    stage: str | None = None
    value: int | None = None
    probability: int | None = None
    close_date: date | None = None
    _required = ("name", "stage", "value", "probability")

    @field_validator("value")
    @classmethod
    def _value(cls, v: int | None) -> int | None:
        if v is not None and v < 0:
            raise ValueError("Value must be 0 or more")
        return v

    @field_validator("probability")
    @classmethod
    def _probability(cls, v: int | None) -> int | None:
        if v is not None and not 0 <= v <= 100:
            raise ValueError("Probability must be between 0 and 100")
        return v


class MoveDeal(_StageMixin, BaseModel):
    stage: str
    index: int

    @field_validator("index")
    @classmethod
    def _index(cls, v: int) -> int:
        return max(v, 0)


class ActivityCreate(_Base):
    type: ActivityType
    description: str
    contact_id: int | None = None
    deal_id: int | None = None
    occurred_at: datetime | None = None
    follow_up_date: date | None = None

    @model_validator(mode="after")
    def _check(self):
        if not self.description:
            raise ValueError("Description is required")
        if self.contact_id is None and self.deal_id is None:
            raise ValueError("An activity needs a contact or a deal")
        return self


class ActivityUpdate(_Base):
    type: ActivityType | None = None
    description: str | None = None
    occurred_at: datetime | None = None
    follow_up_date: date | None = None
    done: bool | None = None
    _required = ("type", "description", "occurred_at", "done")
