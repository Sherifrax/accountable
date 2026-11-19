from fastapi import APIRouter, Request

from ..schemas import ActivityCreate, ActivityUpdate
from ..services import records
from .deps import tx

router = APIRouter(prefix="/api/activities", tags=["activities"])


@router.post("", status_code=201)
def create_activity(body: ActivityCreate, request: Request):
    with tx(request) as conn:
        return records.create_activity(conn, body.model_dump())


@router.patch("/{activity_id}")
def update_activity(activity_id: int, body: ActivityUpdate, request: Request):
    with tx(request) as conn:
        return records.update_activity(conn, activity_id, body.model_dump(exclude_unset=True))


@router.delete("/{activity_id}", status_code=204)
def delete_activity(activity_id: int, request: Request):
    with tx(request) as conn:
        records.delete_activity(conn, activity_id)
