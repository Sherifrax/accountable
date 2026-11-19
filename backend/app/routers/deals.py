from fastapi import APIRouter, Request

from ..schemas import DealCreate, DealUpdate, MoveDeal
from ..services import deals as service
from ..services import deleting
from .deps import tx

router = APIRouter(prefix="/api/deals", tags=["deals"])


@router.get("")
def list_deals(request: Request):
    with tx(request) as conn:
        return service.list_deals(conn)


@router.post("", status_code=201)
def create_deal(body: DealCreate, request: Request):
    with tx(request) as conn:
        return service.create_deal(conn, body.model_dump())


@router.get("/{deal_id}")
def get_deal(deal_id: int, request: Request):
    with tx(request) as conn:
        return service.deal_detail(conn, deal_id)


@router.patch("/{deal_id}")
def update_deal(deal_id: int, body: DealUpdate, request: Request):
    with tx(request) as conn:
        service.update_deal(conn, deal_id, body.model_dump(exclude_unset=True))
        return service.deal_detail(conn, deal_id)


@router.post("/{deal_id}/move")
def move_deal(deal_id: int, body: MoveDeal, request: Request):
    with tx(request) as conn:
        return service.move_deal(conn, deal_id, body.stage, body.index)


@router.get("/{deal_id}/delete-impact")
def delete_impact(deal_id: int, request: Request):
    with tx(request) as conn:
        return deleting.deal_impact(conn, deal_id)


@router.delete("/{deal_id}", status_code=204)
def delete_deal(deal_id: int, request: Request):
    with tx(request) as conn:
        deleting.delete_deal(conn, deal_id)
