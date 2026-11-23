"""Organizations, contacts and activities: list, detail, create, update."""

from sqlalchemy import case, delete, func, insert, select, update

from ..db import activities, contacts, deals, organizations
from ..stages import OPEN_STAGES
from .common import Invalid, NotFound, check_link, iso, require, stamp
from .deals import list_deals
from .timelines import (
    contact_timeline,
    get_activity,
    organization_timeline,
)


def _plain(row, *keys) -> dict:
    return {k: row[k] for k in keys}


# ---- organizations ----

ORG_FIELDS = ("id", "name", "website", "industry", "notes", "created_at", "updated_at")


def list_organizations(conn) -> list[dict]:
    open_deal = deals.c.stage.in_(OPEN_STAGES)
    contact_counts = (
        select(contacts.c.organization_id.label("oid"), func.count().label("n"))
        .group_by(contacts.c.organization_id)
        .subquery()
    )
    deal_counts = (
        select(
            deals.c.organization_id.label("oid"),
            func.coalesce(func.sum(case((open_deal, 1), else_=0)), 0).label("open_n"),
            func.coalesce(func.sum(case((open_deal, deals.c.value), else_=0)), 0).label("open_value"),
        )
        .group_by(deals.c.organization_id)
        .subquery()
    )
    q = (
        select(
            organizations,
            func.coalesce(contact_counts.c.n, 0).label("contact_count"),
            func.coalesce(deal_counts.c.open_n, 0).label("open_deal_count"),
            func.coalesce(deal_counts.c.open_value, 0).label("open_pipeline_value"),
        )
        .select_from(
            organizations.outerjoin(contact_counts, contact_counts.c.oid == organizations.c.id).outerjoin(
                deal_counts, deal_counts.c.oid == organizations.c.id
            )
        )
        .order_by(func.lower(organizations.c.name))
    )
    return [
        _plain(r, *ORG_FIELDS, "contact_count", "open_deal_count", "open_pipeline_value")
        for r in conn.execute(q).mappings()
    ]


def organization_detail(conn, org_id: int) -> dict:
    row = require(conn, organizations, org_id, "Organization")
    out = _plain(row, *ORG_FIELDS)
    out["contacts"] = list_contacts(conn, organization_id=org_id)
    out["deals"] = list_deals(conn, organization_id=org_id)
    out["timeline"] = organization_timeline(conn, org_id)
    return out


def create_organization(conn, data: dict) -> dict:
    now = stamp()
    result = conn.execute(insert(organizations).values(**data, created_at=now, updated_at=now))
    return organization_detail(conn, result.inserted_primary_key[0])


def update_organization(conn, org_id: int, patch: dict) -> dict:
    require(conn, organizations, org_id, "Organization")
    if patch:
        conn.execute(update(organizations).where(organizations.c.id == org_id).values(**patch, updated_at=stamp()))
    return organization_detail(conn, org_id)


# ---- contacts ----

CONTACT_FIELDS = (
    "id",
    "name",
    "email",
    "phone",
    "job_title",
    "organization_id",
    "status",
    "created_at",
    "updated_at",
)


def _contact_query():
    return select(contacts, organizations.c.name.label("organization_name")).select_from(
        contacts.outerjoin(organizations, contacts.c.organization_id == organizations.c.id)
    )


def _contact_out(row) -> dict:
    return _plain(row, *CONTACT_FIELDS, "organization_name")


def list_contacts(conn, status: str | None = None, **filters) -> list[dict]:
    q = _contact_query().order_by(func.lower(contacts.c.name))
    if status:
        q = q.where(contacts.c.status == status)
    for key, value in filters.items():
        q = q.where(contacts.c[key] == value)
    return [_contact_out(r) for r in conn.execute(q).mappings()]


def get_contact(conn, contact_id: int) -> dict:
    row = conn.execute(_contact_query().where(contacts.c.id == contact_id)).mappings().first()
    if row is None:
        raise NotFound("Contact not found")
    return _contact_out(row)


def contact_detail(conn, contact_id: int) -> dict:
    out = get_contact(conn, contact_id)
    out["deals"] = list_deals(conn, contact_id=contact_id)
    out["timeline"] = contact_timeline(conn, contact_id)
    return out


def create_contact(conn, data: dict) -> dict:
    check_link(conn, organizations, data.get("organization_id"), "Organization")
    now = stamp()
    result = conn.execute(insert(contacts).values(**data, created_at=now, updated_at=now))
    return contact_detail(conn, result.inserted_primary_key[0])


def update_contact(conn, contact_id: int, patch: dict) -> dict:
    require(conn, contacts, contact_id, "Contact")
    if "organization_id" in patch:
        check_link(conn, organizations, patch["organization_id"], "Organization")
    if patch:
        conn.execute(update(contacts).where(contacts.c.id == contact_id).values(**patch, updated_at=stamp()))
    return contact_detail(conn, contact_id)


# ---- activities ----


def create_activity(conn, data: dict) -> dict:
    contact_id, deal_id = data.get("contact_id"), data.get("deal_id")
    check_link(conn, contacts, contact_id, "Contact")
    check_link(conn, deals, deal_id, "Deal")
    if deal_id is not None and contact_id is None:
        # Logging on a deal also links its main contact (R-DATA-10).
        contact_id = conn.execute(select(deals.c.contact_id).where(deals.c.id == deal_id)).scalar_one()
    now = stamp()
    result = conn.execute(
        insert(activities).values(
            type=data["type"],
            contact_id=contact_id,
            deal_id=deal_id,
            description=data["description"],
            occurred_at=iso(data.get("occurred_at")) or now,
            follow_up_date=iso(data.get("follow_up_date")),
            done=False,
            created_at=now,
            updated_at=now,
        )
    )
    return _saved_activity(conn, result.inserted_primary_key[0])


def _saved_activity(conn, activity_id: int) -> dict:
    """The activity just written. It's always there, so a missing one means something went badly wrong."""
    activity = get_activity(conn, activity_id)
    if activity is None:
        raise RuntimeError(f"Activity {activity_id} disappeared straight after it was saved")
    return activity


def _editable_activity(conn, activity_id: int):
    row = require(conn, activities, activity_id, "Activity")
    if row["type"] == "stage_change":
        raise Invalid("Stage changes can't be edited or deleted")
    return row


def update_activity(conn, activity_id: int, patch: dict) -> dict:
    _editable_activity(conn, activity_id)
    patch = dict(patch)
    for key in ("occurred_at", "follow_up_date"):
        if key in patch:
            patch[key] = iso(patch[key])
    if patch:
        conn.execute(update(activities).where(activities.c.id == activity_id).values(**patch, updated_at=stamp()))
    return _saved_activity(conn, activity_id)


def delete_activity(conn, activity_id: int) -> None:
    _editable_activity(conn, activity_id)
    conn.execute(delete(activities).where(activities.c.id == activity_id))
