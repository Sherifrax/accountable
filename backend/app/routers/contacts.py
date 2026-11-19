from typing import Literal

from fastapi import APIRouter, Request

from ..schemas import ContactCreate, ContactUpdate
from ..services import deleting, records
from .deps import tx

router = APIRouter(prefix="/api/contacts", tags=["contacts"])


@router.get("")
def list_contacts(request: Request, status: Literal["lead", "qualified", "customer"] | None = None):
    with tx(request) as conn:
        return records.list_contacts(conn, status=status)


@router.post("", status_code=201)
def create_contact(body: ContactCreate, request: Request):
    with tx(request) as conn:
        return records.create_contact(conn, body.model_dump())


@router.get("/{contact_id}")
def get_contact(contact_id: int, request: Request):
    with tx(request) as conn:
        return records.contact_detail(conn, contact_id)


@router.patch("/{contact_id}")
def update_contact(contact_id: int, body: ContactUpdate, request: Request):
    with tx(request) as conn:
        return records.update_contact(conn, contact_id, body.model_dump(exclude_unset=True))


@router.get("/{contact_id}/delete-impact")
def delete_impact(contact_id: int, request: Request):
    with tx(request) as conn:
        return deleting.contact_impact(conn, contact_id)


@router.delete("/{contact_id}", status_code=204)
def delete_contact(contact_id: int, request: Request):
    with tx(request) as conn:
        deleting.delete_contact(conn, contact_id)
