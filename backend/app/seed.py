"""Sample data (R-SEED-1 to R-SEED-5).

Fixed lists plus a fixed random seed, so the data is the same every time. All dates are worked out
from the day the seed runs. Run it with `python -m backend.app.seed`; it empties the tables and
refills them in one transaction, so it works while the app is running.
"""

import calendar
import random
from datetime import date, datetime, time, timedelta

from sqlalchemy import delete, insert

from . import config
from .db import activities, contacts, create_tables, deals, make_engine, organizations, transaction
from .stages import USUAL_PROBABILITY

ORGANIZATIONS = [
    ("Northwind Logistics", "Logistics", "northwindlogistics.com"),
    ("Brightwave Energy", "Energy", "brightwaveenergy.com"),
    ("Harbor & Pine Foods", "Food & Beverage", "harborpinefoods.com"),
    ("Lumen Health Partners", "Healthcare", "lumenhealthpartners.com"),
    ("Copperline Software", "Software", "copperlinesoftware.com"),
    ("Fernhill Architects", "Construction", "fernhillarchitects.com"),
    ("Atlas Freight Systems", "Logistics", "atlasfreightsystems.com"),
    ("Meridian Clinics", "Healthcare", "meridianclinics.com"),
    ("Oakridge Brewing Co.", "Food & Beverage", "oakridgebrewing.com"),
    ("Solstice Solar", "Energy", "solsticesolar.com"),
    ("Kestrel Analytics", "Software", "kestrelanalytics.com"),
    ("Granite Peak Builders", "Construction", "granitepeakbuilders.com"),
    ("Bluefin Marine Supply", "Retail", "bluefinmarinesupply.com"),
    ("Juniper Home Goods", "Retail", "juniperhomegoods.com"),
    ("Tidewater Education Group", "Education", "tidewatereducation.com"),
]

PEOPLE = [
    "Maya Okafor", "Daniel Reyes", "Priya Natarajan", "Tom Whitfield", "Lena Fischer", "Marcus Bell",
    "Sofia Marchetti", "Ethan Cho", "Amara Diallo", "Jonas Lindqvist", "Hannah Brooks", "Rafael Duarte",
    "Nora Haddad", "Callum Reid", "Yuki Tanaka", "Isabel Moreno", "Victor Alves", "Grace Nwosu",
    "Oliver Grant", "Mei Lin Zhao", "Samuel Adler", "Chloe Bennett", "Arjun Mehta", "Freya Olsen",
    "Leo Castillo", "Zainab Rahman", "Patrick Doyle", "Elena Petrova", "Noah Kessler", "Ines Carvalho",
    "Dylan Hughes", "Aisha Khan", "Felix Wagner", "Rosa Delgado", "Ben Osei", "Clara Jensen",
    "Mateo Vargas", "Tessa Morgan", "Hugo Laurent", "Naomi Feldman",
]
TITLES = [
    "Operations Director", "Head of Procurement", "CEO", "Finance Manager", "IT Lead", "Office Manager",
    "VP of Sales", "Facilities Manager", "Chief of Staff", "Purchasing Manager",
]
STATUS_PATTERN = ["lead"] * 4 + ["qualified"] * 3 + ["customer"] * 3

# (name, organization index, stage, value, when). `when` is days from today for open deals
# and months ago for won and lost deals.
OPEN_DEALS = [
    ("Fleet tracking rollout", 0, "New", 48000, 45),
    ("Rooftop panel survey", 9, "New", 22500, 60),
    ("Seasonal menu supply", 2, "New", 9800, 75),
    ("Patient scheduling pilot", 3, "New", 36000, 90),
    ("Warehouse analytics", 6, "New", 27000, 30),
    ("Platform migration", 4, "Qualified", 64000, 21),
    ("Clinic network upgrade", 7, "Qualified", 41500, 35),
    ("Taproom point of sale", 8, "Qualified", 12400, 50),
    ("Site safety training", 11, "Qualified", 18200, -4),
    ("Dashboard licences", 10, "Qualified", 30000, 70),
    ("Studio design software", 5, "Proposal", 25500, 14),
    ("Harbour inventory system", 12, "Proposal", 52000, 28),
    ("Showroom refit", 13, "Proposal", 16800, -10),
    ("Campus devices", 14, "Proposal", 88000, 42),
    ("Distribution contract", 1, "Negotiation", 120000, 7),
    ("Annual support plan", 4, "Negotiation", 38000, 12),
    ("Cold storage monitoring", 2, "Negotiation", 44500, -2),
    ("Route planning licences", 0, "Negotiation", 71000, -16),
]
WON_DEALS = [
    ("Depot management suite", 6, 21000, 0),
    ("Solar monitoring", 9, 9800, 0),
    ("Staff scheduling", 7, 19800, 1),
    ("Brewery ERP", 8, 42000, 2),
    ("Build tracking app", 11, 27500, 3),
    ("Customer analytics", 10, 61000, 5),
    ("Shop floor displays", 13, 14200, 7),
    ("Learning portal", 14, 46800, 9),
]
LOST_DEALS = [
    ("Energy audit", 1, 35000, 1),
    ("Print supply", 5, 8900, 4),
    ("Marine radios", 12, 23400, 6),
    ("Telehealth trial", 3, 57000, 10),
]
LOST_FROM = ["Proposal", "Qualified", "Negotiation", "Qualified"]

NOTES = [
    "Talked through their current setup and what isn't working.",
    "Sent over the overview deck and pricing sheet.",
    "Met on site to walk through the requirements.",
    "They asked for a reference customer in their industry.",
    "Budget is approved for this quarter, waiting on the final sign-off.",
    "Introduced me to their finance lead.",
    "Reviewed the draft proposal together and noted two changes.",
    "Confirmed the timeline and the people involved.",
]
CALLS = [
    "Quick call to check on the decision timeline.",
    "Discovery call about their goals for next year.",
    "Called to go over questions on the proposal.",
    "Left a voicemail and followed up by text.",
    "Call with their team about rollout and training.",
]
EMAILS = [
    "Emailed the revised quote.",
    "Sent a follow-up with the agreed next steps.",
    "Shared the case study they asked for.",
    "Replied to their questions about contract terms.",
    "Sent a meeting invite for next week.",
]
FOLLOW_UPS = [
    "Send the revised quote",
    "Check in on the decision",
    "Book a demo for their team",
    "Chase the signed contract",
    "Share the reference customer's details",
    "Confirm the start date",
    "Ask who else needs to approve",
]


def _at(day: date, hour: int, minute: int = 0) -> datetime:
    return datetime.combine(day, time(hour, minute))


def _months_ago(today: date, months: int, day: int) -> date:
    """A date `months` calendar months back. In the current month it never lands after today."""
    index = today.year * 12 + today.month - 1 - months
    year, month = index // 12, index % 12 + 1
    last = calendar.monthrange(year, month)[1]
    chosen = min(day, last)
    if months == 0:
        chosen = min(chosen, today.day)
    return date(year, month, chosen)


def _iso(value: datetime | date) -> str:
    return value.replace(microsecond=0).isoformat() if isinstance(value, datetime) else value.isoformat()


def clear(conn) -> None:
    for table in (activities, deals, contacts, organizations):
        conn.execute(delete(table))


def seed(conn, today: date | None = None) -> None:
    """Replace everything in the database with the sample data."""
    today = today or config.today()
    now = datetime.combine(today, config.now().time())
    rng = random.Random(42)
    clear(conn)
    stamp = _iso(now)

    org_ids = []
    for name, industry, domain in ORGANIZATIONS:
        result = conn.execute(
            insert(organizations).values(
                name=name,
                industry=industry,
                website=f"https://www.{domain}",
                notes=None,
                created_at=stamp,
                updated_at=stamp,
            )
        )
        org_ids.append(result.inserted_primary_key[0])

    contact_ids, contact_org = [], []
    for i, person in enumerate(PEOPLE):
        org_index = i % len(ORGANIZATIONS) if i < 38 else None
        first, last = person.lower().split()[0], person.lower().split()[-1]
        domain = ORGANIZATIONS[org_index][2] if org_index is not None else "example-consulting.com"
        result = conn.execute(
            insert(contacts).values(
                name=person,
                email=f"{first}.{last}@{domain}",
                phone=f"(555) 010-{1000 + i * 7:04d}",
                job_title=TITLES[i % len(TITLES)],
                organization_id=org_ids[org_index] if org_index is not None else None,
                status=STATUS_PATTERN[i % len(STATUS_PATTERN)],
                created_at=stamp,
                updated_at=stamp,
            )
        )
        contact_ids.append(result.inserted_primary_key[0])
        contact_org.append(org_index)

    def contact_for(org_index: int, n: int) -> int:
        """The n-th contact at an organization (contacts are dealt round the organizations)."""
        return contact_ids[org_index + len(ORGANIZATIONS) * (n % 2)]

    # Deals: (name, org, stage, value, close date, path of stages it went through, history end).
    specs = []
    for n, (name, org, stage, value, offset) in enumerate(OPEN_DEALS):
        specs.append((name, org, stage, value, today + timedelta(days=offset), n))
    for n, (name, org, value, months) in enumerate(WON_DEALS):
        specs.append((name, org, "Won", value, _months_ago(today, months, 6 + (n * 5) % 20), n + 1))
    for n, (name, org, value, months) in enumerate(LOST_DEALS):
        specs.append((name, org, "Lost", value, _months_ago(today, months, 9 + (n * 7) % 15), n))

    order = ["New", "Qualified", "Proposal", "Negotiation", "Won"]
    position = {s: 0 for s in USUAL_PROBABILITY}
    deal_rows = []
    lost_index = 0
    for name, org, stage, value, close, n in specs:
        if stage == "Lost":
            last_open = LOST_FROM[lost_index]
            lost_index += 1
            path = order[: order.index(last_open) + 1] + ["Lost"]
        else:
            path = order[: order.index(stage) + 1]
        contact_id = contact_for(org, n)
        probability = USUAL_PROBABILITY[stage]
        if stage not in ("Won", "Lost"):
            probability = max(5, min(95, probability + rng.choice([-10, -5, 0, 0, 5, 10])))
        # History runs backwards from the end: closed deals end on their close date,
        # open ones a few days ago.
        end = _at(close, 10) if stage in ("Won", "Lost") else now - timedelta(days=rng.randint(1, 6))
        end = min(end, now - timedelta(hours=1))
        steps = len(path) - 1
        times = [end - timedelta(days=rng.randint(6, 20) * (steps - k)) for k in range(steps)]
        created = (times[0] - timedelta(days=rng.randint(2, 9))) if times else end - timedelta(days=rng.randint(5, 25))
        result = conn.execute(
            insert(deals).values(
                name=name,
                organization_id=org_ids[org],
                contact_id=contact_id,
                stage=stage,
                value=value,
                probability=probability,
                close_date=_iso(close),
                position=position[stage],
                created_at=_iso(created),
                updated_at=_iso(end),
            )
        )
        position[stage] += 1
        deal_id = result.inserted_primary_key[0]
        deal_rows.append((deal_id, contact_id))
        for k in range(steps):
            conn.execute(
                insert(activities).values(
                    type="stage_change",
                    contact_id=contact_id,
                    deal_id=deal_id,
                    description=f"Moved from {path[k]} to {path[k + 1]}",
                    occurred_at=_iso(times[k]),
                    follow_up_date=None,
                    done=False,
                    from_stage=path[k],
                    to_stage=path[k + 1],
                    created_at=_iso(times[k]),
                    updated_at=_iso(times[k]),
                )
            )

    # 80 activities over the past 12 months, with fixed follow-up slots.
    overdue = [-2, -5, -9, -14]
    due_soon = [0, 1, 3, 6]
    later = [10, 21]
    done_past = [-3, -8, -20, -30, -45, -60]
    follow_ups = {}
    slot = 3
    for offsets, done in ((overdue, False), (due_soon, False), (later, False), (done_past, True)):
        for offset in offsets:
            follow_ups[slot] = (offset, done)
            slot += 7
    texts = {"note": NOTES, "call": CALLS, "email": EMAILS}
    types = ["note", "call", "email", "call", "note", "email", "note"]
    for i in range(80):
        kind = types[i % len(types)]
        if i % 2 == 0:
            deal_id, contact_id = deal_rows[rng.randrange(len(deal_rows))]
        else:
            deal_id, contact_id = None, contact_ids[rng.randrange(len(contact_ids))]
        follow = follow_ups.get(i)
        if follow:
            offset, done = follow
            days_back = rng.randint(max(1, -offset + 1) if offset < 0 else 1, 25)
            description = FOLLOW_UPS[i % len(FOLLOW_UPS)]
            follow_date = _iso(today + timedelta(days=offset))
            kind = "call" if i % 3 else "email"
        else:
            days_back = rng.randint(1, 360)
            description = texts[kind][rng.randrange(len(texts[kind]))]
            follow_date, done = None, False
        occurred = _at(today - timedelta(days=days_back), rng.randint(9, 17), rng.choice([0, 15, 30, 45]))
        conn.execute(
            insert(activities).values(
                type=kind,
                contact_id=contact_id,
                deal_id=deal_id,
                description=description,
                occurred_at=_iso(occurred),
                follow_up_date=follow_date,
                done=done,
                created_at=_iso(occurred),
                updated_at=_iso(occurred),
            )
        )


def main() -> None:
    path = config.db_path()
    path.parent.mkdir(parents=True, exist_ok=True)
    engine = make_engine(path)
    create_tables(engine)
    with transaction(engine) as conn:
        seed(conn)
    engine.dispose()
    print(f"Sample data loaded into {path}")


if __name__ == "__main__":
    main()
