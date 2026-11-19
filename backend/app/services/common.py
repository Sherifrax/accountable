from datetime import datetime

from sqlalchemy import select

from ..config import now


class NotFound(Exception):
    pass


class Invalid(Exception):
    """A request that is well formed but can't be done (becomes a 422 or 400)."""


def stamp() -> str:
    return now().isoformat(timespec="seconds")


def iso(value) -> str | None:  # noqa: ANN001
    """Dates and datetimes to the strings we store."""
    if value is None:
        return None
    if isinstance(value, datetime):
        return value.replace(microsecond=0).isoformat()
    return value.isoformat()


def require(conn, table, row_id: int, label: str):
    row = conn.execute(select(table).where(table.c.id == row_id)).mappings().first()
    if row is None:
        raise NotFound(f"{label} not found")
    return row


def check_link(conn, table, row_id: int | None, label: str) -> None:
    """A foreign key given in a request body must point at something real."""
    if row_id is None:
        return
    if conn.execute(select(table.c.id).where(table.c.id == row_id)).first() is None:
        raise Invalid(f"{label} not found")
