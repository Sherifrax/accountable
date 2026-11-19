from fastapi import APIRouter, Request

from ..schemas import OrganizationCreate, OrganizationUpdate
from ..services import deleting, records
from .deps import tx

router = APIRouter(prefix="/api/organizations", tags=["organizations"])


@router.get("")
def list_organizations(request: Request):
    with tx(request) as conn:
        return records.list_organizations(conn)


@router.post("", status_code=201)
def create_organization(body: OrganizationCreate, request: Request):
    with tx(request) as conn:
        return records.create_organization(conn, body.model_dump())


@router.get("/{org_id}")
def get_organization(org_id: int, request: Request):
    with tx(request) as conn:
        return records.organization_detail(conn, org_id)


@router.patch("/{org_id}")
def update_organization(org_id: int, body: OrganizationUpdate, request: Request):
    with tx(request) as conn:
        return records.update_organization(conn, org_id, body.model_dump(exclude_unset=True))


@router.get("/{org_id}/delete-impact")
def delete_impact(org_id: int, request: Request):
    with tx(request) as conn:
        return deleting.organization_impact(conn, org_id)


@router.delete("/{org_id}", status_code=204)
def delete_organization(org_id: int, request: Request):
    with tx(request) as conn:
        deleting.delete_organization(conn, org_id)
