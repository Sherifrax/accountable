"""R-SEED-1 to R-SEED-5, R-RUN-2."""

from datetime import date, timedelta

import pytest
from sqlalchemy import func, select

from backend.app.db import activities, contacts, deals, organizations
from backend.app.seed import seed
from backend.app.stages import STAGE_NAMES


@pytest.fixture
def seeded(engine):
    with engine.begin() as conn:
        seed(conn)
    return engine


def rows(engine, table):
    with engine.connect() as conn:
        return [dict(r) for r in conn.execute(select(table).order_by(table.c.id)).mappings()]


def test_counts_and_ranges(seeded):  # R-SEED-1
    orgs, people, all_deals = (rows(seeded, t) for t in (organizations, contacts, deals))
    acts = rows(seeded, activities)
    assert len(orgs) == 15
    assert len({o["industry"] for o in orgs}) >= 6
    assert len(people) == 40
    assert {c["status"] for c in people} == {"lead", "qualified", "customer"}
    assert len(all_deals) == 30
    assert {d["stage"] for d in all_deals} == set(STAGE_NAMES)
    assert len([a for a in acts if a["type"] != "stage_change"]) == 80


def test_late_deals_and_follow_ups(seeded, fixed_today):  # R-SEED-1
    today = fixed_today.isoformat()
    soon = (fixed_today + timedelta(days=7)).isoformat()
    open_deals = [d for d in rows(seeded, deals) if d["stage"] not in ("Won", "Lost")]
    assert len([d for d in open_deals if d["close_date"] < today]) >= 3
    follow = [a for a in rows(seeded, activities) if a["follow_up_date"] and not a["done"]]
    assert len([a for a in follow if a["follow_up_date"] < today]) >= 3
    assert len([a for a in follow if today <= a["follow_up_date"] <= soon]) >= 3


def test_won_and_lost_spread_over_a_year(seeded, fixed_today):  # R-SEED-1
    closed = [d for d in rows(seeded, deals) if d["stage"] in ("Won", "Lost")]
    months = {d["close_date"][:7] for d in closed}
    assert len(months) >= 8
    assert all(d["close_date"] <= fixed_today.isoformat() for d in closed)
    assert min(d["close_date"] for d in closed) >= (fixed_today - timedelta(days=366)).isoformat()


def test_closed_deals_have_stage_history(seeded):  # R-SEED-5
    entries = [a for a in rows(seeded, activities) if a["type"] == "stage_change"]
    for deal in rows(seeded, deals):
        if deal["stage"] in ("Won", "Lost"):
            mine = [e for e in entries if e["deal_id"] == deal["id"]]
            assert mine, deal["name"]
            assert any(e["to_stage"] == deal["stage"] for e in mine)


def test_positions_are_gapless(seeded):
    for stage in STAGE_NAMES:
        positions = sorted(d["position"] for d in rows(seeded, deals) if d["stage"] == stage)
        assert positions == list(range(len(positions)))


def test_same_data_every_time(engine):  # R-SEED-3
    def snapshot():
        with engine.begin() as conn:
            seed(conn)
        return [rows(engine, t) for t in (organizations, contacts, deals, activities)]

    first = snapshot()
    assert snapshot() == first


def test_no_dates_in_the_future_for_history(seeded, fixed_today):
    cutoff = fixed_today.isoformat() + "T23:59:59"
    assert all(a["occurred_at"] <= cutoff for a in rows(seeded, activities))


def test_dates_move_with_today(engine):  # R-SEED-2
    def close_dates(today):
        with engine.begin() as conn:
            seed(conn, today)
        return sorted(d["close_date"] for d in rows(engine, deals) if d["stage"] == "New")

    a = close_dates(date(2026, 6, 15))
    b = close_dates(date(2026, 9, 15))
    gap = date(2026, 9, 15) - date(2026, 6, 15)
    assert [date.fromisoformat(y) - date.fromisoformat(x) for x, y in zip(a, b)] == [gap] * len(a)


def test_names_are_made_up_with_matching_domains(seeded):  # R-SEED-4
    people = rows(seeded, contacts)
    orgs = {o["id"]: o for o in rows(seeded, organizations)}
    for c in people:
        if c["organization_id"]:
            domain = orgs[c["organization_id"]]["website"].removeprefix("https://www.")
            assert c["email"].endswith("@" + domain)


def test_seeding_replaces_existing_data(client, make, seeded):  # R-RUN-2
    make.org("Mine")
    with seeded.begin() as conn:
        seed(conn)
    names = [o["name"] for o in client.get("/api/organizations").json()]
    assert "Mine" not in names and len(names) == 15
    assert client.get("/api/dashboard").status_code == 200


def test_activity_links_are_valid(seeded):
    with seeded.connect() as conn:
        count = conn.execute(
            select(func.count()).select_from(activities).where(
                activities.c.contact_id.is_(None), activities.c.deal_id.is_(None)
            )
        ).scalar_one()
    assert count == 0
