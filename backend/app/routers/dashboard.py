from fastapi import APIRouter, Request

from ..services.dashboard import dashboard
from .deps import tx

router = APIRouter(prefix="/api/dashboard", tags=["dashboard"])


@router.get("")
def get_dashboard(request: Request):
    with tx(request) as conn:
        return dashboard(conn)
