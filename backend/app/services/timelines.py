"""Activity rows with names, and the three timelines."""

from sqlalchemy import or_, select

from ..config import today
from ..db import activities, contacts, deals

ORDER = (activities.c.occurred_at.desc(), activities.c.id.desc())


def _query():
    return (
        select(
            activities,
            contacts.c.name.label("contact_name"),
            deals.c.name.label("deal_name"),
        )
        .select_from(
            activities.outerjoin(contacts, activities.c.contact_id == contacts.c.id).outerjoin(
                deals, activities.c.deal_id == deals.c.id
            )
        )
        .order_by(*ORDER)
    )


def activity_out(row) -> dict:
    follow_up = row["follow_up_date"]
    done = bool(row["done"])
    return {
        "id": row["id"],
        "type": row["type"],
        "description": row["description"],
        "occurred_at": row["occurred_at"],
        "follow_up_date": follow_up,
        "done": done,
        "overdue": bool(follow_up and not done and follow_up < today().isoformat()),
        "from_stage": row["from_stage"],
        "to_stage": row["to_stage"],
        "contact_id": row["contact_id"],
        "contact_name": row["contact_name"],
        "deal_id": row["deal_id"],
        "deal_name": row["deal_name"],
        "editable": row["type"] != "stage_change",
    }


def get_activity(conn, activity_id: int) -> dict | None:
    row = conn.execute(_query().where(activities.c.id == activity_id)).mappings().first()
    return activity_out(row) if row else None


def deal_timeline(conn, deal_id: int) -> list[dict]:
    rows = conn.execute(_query().where(activities.c.deal_id == deal_id)).mappings()
    return [activity_out(r) for r in rows]


def contact_timeline(conn, contact_id: int) -> list[dict]:
    rows = conn.execute(_query().where(activities.c.contact_id == contact_id)).mappings()
    return [activity_out(r) for r in rows]


def organization_timeline(conn, org_id: int) -> list[dict]:
    """Everything linked to the organization's contacts or deals, each entry once."""
    contact_ids = select(contacts.c.id).where(contacts.c.organization_id == org_id)
    deal_ids = select(deals.c.id).where(deals.c.organization_id == org_id)
    rows = conn.execute(
        _query().where(or_(activities.c.contact_id.in_(contact_ids), activities.c.deal_id.in_(deal_ids)))
    ).mappings()
    return [activity_out(r) for r in rows]


def recent(conn, limit: int = 10) -> list[dict]:
    return [activity_out(r) for r in conn.execute(_query().limit(limit)).mappings()]
