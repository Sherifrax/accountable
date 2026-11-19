from fastapi import APIRouter

from ..stages import STAGES

router = APIRouter(prefix="/api/stages", tags=["stages"])


@router.get("")
def list_stages():
    return STAGES
