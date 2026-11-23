"""Delete rules (R-DEL-1 to R-DEL-5) and the counts shown before deleting."""

from sqlalchemy import and_, delete, func, or_, select

from ..db import activities, contacts, deals, organizations
from .common import require

STAGE_CHANGE = "stage_change"


def _count(conn, *conditions) -> int:
    return conn.execute(select(func.count()).select_from(activities).where(*conditions)).scalar_one()


def _count_rows(conn, table, *conditions) -> int:
    return conn.execute(select(func.count()).select_from(table).where(*conditions)).scalar_one()


def organization_impact(conn, org_id: int) -> dict:
    row = require(conn, organizations, org_id, "Organization")
    return {
        "name": row["name"],
        "contacts": _count_rows(conn, contacts, contacts.c.organization_id == org_id),
        "deals": _count_rows(conn, deals, deals.c.organization_id == org_id),
    }


def contact_impact(conn, contact_id: int) -> dict:
    row = require(conn, contacts, contact_id, "Contact")
    return {
        "name": row["name"],
        "deals": _count_rows(conn, deals, deals.c.contact_id == contact_id),
        # Linked only to this contact: deleted.
        "activities_deleted": _count(conn, activities.c.contact_id == contact_id, activities.c.deal_id.is_(None)),
        # Also linked to a deal: kept, with no contact.
        "activities_kept": _count(conn, activities.c.contact_id == contact_id, activities.c.deal_id.is_not(None)),
    }


def deal_impact(conn, deal_id: int) -> dict:
    row = require(conn, deals, deal_id, "Deal")
    mine = activities.c.deal_id == deal_id
    return {
        "name": row["name"],
        "stage_changes": _count(conn, mine, activities.c.type == STAGE_CHANGE),
        "activities_deleted": _count(conn, mine, activities.c.type != STAGE_CHANGE, activities.c.contact_id.is_(None)),
        "activities_kept": _count(conn, mine, activities.c.type != STAGE_CHANGE, activities.c.contact_id.is_not(None)),
    }


def delete_organization(conn, org_id: int) -> None:
    require(conn, organizations, org_id, "Organization")
    # Contacts and deals stay; the foreign keys set their organization to null.
    conn.execute(delete(organizations).where(organizations.c.id == org_id))


def delete_contact(conn, contact_id: int) -> None:
    require(conn, contacts, contact_id, "Contact")
    conn.execute(delete(activities).where(activities.c.contact_id == contact_id, activities.c.deal_id.is_(None)))
    conn.execute(delete(contacts).where(contacts.c.id == contact_id))


def delete_deal(conn, deal_id: int) -> None:
    row = require(conn, deals, deal_id, "Deal")
    gone = and_(
        activities.c.deal_id == deal_id,
        or_(activities.c.type == STAGE_CHANGE, activities.c.contact_id.is_(None)),
    )
    conn.execute(delete(activities).where(gone))
    conn.execute(delete(deals).where(deals.c.id == deal_id))
    # Close the gap the deal leaves in its column.
    remaining = [
        r[0]
        for r in conn.execute(
            select(deals.c.id).where(deals.c.stage == row["stage"]).order_by(deals.c.position, deals.c.id)
        )
    ]
    for position, other in enumerate(remaining):
        conn.execute(deals.update().where(deals.c.id == other).values(position=position))
