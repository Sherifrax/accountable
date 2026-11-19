"""Deals: create, update, stage changes, and moving cards. All stage rules live here."""

from sqlalchemy import insert, select, update

from ..config import today
from ..db import activities, contacts, deals, organizations
from ..stages import USUAL_PROBABILITY, is_open
from .common import Invalid, NotFound, check_link, iso, require, stamp
from .timelines import deal_timeline


def deal_out(row) -> dict:  # noqa: ANN001
    close = row["close_date"]
    open_ = is_open(row["stage"])
    return {
        "id": row["id"],
        "name": row["name"],
        "organization_id": row["organization_id"],
        "organization_name": row["organization_name"],
        "contact_id": row["contact_id"],
        "contact_name": row["contact_name"],
        "stage": row["stage"],
        "value": row["value"],
        "probability": row["probability"],
        "expected_revenue": row["value"] * row["probability"] / 100,
        "close_date": close,
        "late": bool(open_ and close and close < today().isoformat()),
        "position": row["position"],
        "created_at": row["created_at"],
        "updated_at": row["updated_at"],
    }


def _query():
    return (
        select(
            deals,
            organizations.c.name.label("organization_name"),
            contacts.c.name.label("contact_name"),
        )
        .select_from(
            deals.outerjoin(organizations, deals.c.organization_id == organizations.c.id).outerjoin(
                contacts, deals.c.contact_id == contacts.c.id
            )
        )
    )


def list_deals(conn, **filters) -> list[dict]:
    q = _query().order_by(deals.c.stage, deals.c.position, deals.c.id)
    for key, value in filters.items():
        q = q.where(deals.c[key] == value)
    return [deal_out(r) for r in conn.execute(q).mappings()]


def get_deal(conn, deal_id: int) -> dict:
    row = conn.execute(_query().where(deals.c.id == deal_id)).mappings().first()
    if row is None:
        raise NotFound("Deal not found")
    return deal_out(row)


def deal_detail(conn, deal_id: int) -> dict:
    deal = get_deal(conn, deal_id)
    deal["timeline"] = deal_timeline(conn, deal_id)
    return deal


def _column_ids(conn, stage: str, exclude: int | None = None) -> list[int]:
    q = select(deals.c.id).where(deals.c.stage == stage).order_by(deals.c.position, deals.c.id)
    ids = [r[0] for r in conn.execute(q)]
    return [i for i in ids if i != exclude]


def _renumber(conn, ids: list[int]) -> None:
    for position, deal_id in enumerate(ids):
        conn.execute(update(deals).where(deals.c.id == deal_id).values(position=position))


def _log_stage_change(conn, deal, old: str, new: str) -> None:
    stamp_now = stamp()
    conn.execute(
        insert(activities).values(
            type="stage_change",
            contact_id=deal["contact_id"],
            deal_id=deal["id"],
            description=f"Moved from {old} to {new}",
            occurred_at=stamp_now,
            follow_up_date=None,
            done=False,
            from_stage=old,
            to_stage=new,
            created_at=stamp_now,
            updated_at=stamp_now,
        )
    )


def _place(conn, deal_id: int, stage: str, index: int, extra: dict | None = None) -> None:
    """Put the deal at `index` in `stage`, renumbering the column it left and the one it joins."""
    row = require(conn, deals, deal_id, "Deal")
    old_stage = row["stage"]
    values = dict(extra or {})
    changed = old_stage != stage
    if changed:
        # R-DATA-2 (unless the caller gave a probability) and R-DATA-3.
        values.setdefault("probability", USUAL_PROBABILITY[stage])
        if not is_open(stage):
            values.setdefault("close_date", today().isoformat())
    target = _column_ids(conn, stage, exclude=deal_id)
    target.insert(min(index, len(target)), deal_id)
    values.update(stage=stage, updated_at=stamp())
    conn.execute(update(deals).where(deals.c.id == deal_id).values(**values))
    _renumber(conn, target)
    if changed:
        _renumber(conn, _column_ids(conn, old_stage))
        _log_stage_change(conn, row, old_stage, stage)


def create_deal(conn, data: dict) -> dict:
    check_link(conn, organizations, data.get("organization_id"), "Organization")
    check_link(conn, contacts, data.get("contact_id"), "Contact")
    stage = data["stage"]
    stamp_now = stamp()
    close = iso(data.get("close_date"))
    if close is None and not is_open(stage):
        close = today().isoformat()
    probability = data.get("probability")
    result = conn.execute(
        insert(deals).values(
            name=data["name"],
            organization_id=data.get("organization_id"),
            contact_id=data.get("contact_id"),
            stage=stage,
            value=data["value"],
            probability=USUAL_PROBABILITY[stage] if probability is None else probability,
            close_date=close,
            position=0,
            created_at=stamp_now,
            updated_at=stamp_now,
        )
    )
    deal_id = result.inserted_primary_key[0]
    # New deals go to the top of their column (R-PIPE-6).
    ids = [deal_id] + _column_ids(conn, stage, exclude=deal_id)
    _renumber(conn, ids)
    return get_deal(conn, deal_id)


def update_deal(conn, deal_id: int, patch: dict) -> dict:
    row = require(conn, deals, deal_id, "Deal")
    if "organization_id" in patch:
        check_link(conn, organizations, patch["organization_id"], "Organization")
    if "contact_id" in patch:
        check_link(conn, contacts, patch["contact_id"], "Contact")
    patch = dict(patch)
    if "close_date" in patch:
        patch["close_date"] = iso(patch["close_date"])
    new_stage = patch.pop("stage", row["stage"])
    if new_stage != row["stage"]:
        # A stage change from the edit form: same rules as a drag, landing at the top.
        _place(conn, deal_id, new_stage, 0, patch)
    else:
        patch["updated_at"] = stamp()
        conn.execute(update(deals).where(deals.c.id == deal_id).values(**patch))
    return get_deal(conn, deal_id)


def move_deal(conn, deal_id: int, stage: str, index: int) -> dict:
    if stage not in USUAL_PROBABILITY:
        raise Invalid("Unknown stage")
    _place(conn, deal_id, stage, index)
    return get_deal(conn, deal_id)
