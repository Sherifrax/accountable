"""Database: engine, foreign keys pragma, and the four tables (SQLAlchemy Core)."""

from contextlib import contextmanager
from pathlib import Path

from sqlalchemy import (
    Boolean,
    Column,
    Engine,
    ForeignKey,
    Integer,
    MetaData,
    String,
    Table,
    Text,
    create_engine,
    event,
)

metadata = MetaData()

organizations = Table(
    "organizations",
    metadata,
    Column("id", Integer, primary_key=True),
    Column("name", Text, nullable=False),
    Column("website", Text),
    Column("industry", Text),
    Column("notes", Text),
    Column("created_at", String, nullable=False),
    Column("updated_at", String, nullable=False),
)

contacts = Table(
    "contacts",
    metadata,
    Column("id", Integer, primary_key=True),
    Column("name", Text, nullable=False),
    Column("email", Text),
    Column("phone", Text),
    Column("job_title", Text),
    Column("organization_id", Integer, ForeignKey("organizations.id", ondelete="SET NULL")),
    Column("status", String, nullable=False),
    Column("created_at", String, nullable=False),
    Column("updated_at", String, nullable=False),
)

deals = Table(
    "deals",
    metadata,
    Column("id", Integer, primary_key=True),
    Column("name", Text, nullable=False),
    Column("organization_id", Integer, ForeignKey("organizations.id", ondelete="SET NULL")),
    Column("contact_id", Integer, ForeignKey("contacts.id", ondelete="SET NULL")),
    Column("stage", String, nullable=False),
    Column("value", Integer, nullable=False),
    Column("probability", Integer, nullable=False),
    Column("close_date", String),
    Column("position", Integer, nullable=False),
    Column("created_at", String, nullable=False),
    Column("updated_at", String, nullable=False),
)

activities = Table(
    "activities",
    metadata,
    Column("id", Integer, primary_key=True),
    Column("type", String, nullable=False),
    Column("contact_id", Integer, ForeignKey("contacts.id", ondelete="SET NULL")),
    Column("deal_id", Integer, ForeignKey("deals.id", ondelete="SET NULL")),
    Column("description", Text, nullable=False),
    Column("occurred_at", String, nullable=False),
    Column("follow_up_date", String),
    Column("done", Boolean, nullable=False, default=False),
    Column("from_stage", String),
    Column("to_stage", String),
    Column("created_at", String, nullable=False),
    Column("updated_at", String, nullable=False),
)


def make_engine(path: Path | str) -> Engine:
    engine = create_engine(f"sqlite:///{path}")

    @event.listens_for(engine, "connect")
    def _foreign_keys_on(dbapi_connection, _record):  # noqa: ANN001
        cursor = dbapi_connection.cursor()
        cursor.execute("PRAGMA foreign_keys = ON")
        cursor.close()

    return engine


def create_tables(engine: Engine) -> None:
    metadata.create_all(engine)


@contextmanager
def transaction(engine: Engine):
    """One transaction: commits on success, rolls back on any error."""
    with engine.begin() as conn:
        yield conn
