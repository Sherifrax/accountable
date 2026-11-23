"""Every dashboard figure, worked out from the current data (R-DASH-1 to R-DASH-6)."""

from datetime import date, timedelta
from typing import Any

from sqlalchemy import select

from ..config import today
from ..db import activities, deals
from ..stages import FUNNEL_STAGES, OPEN_STAGES, is_open
from .timelines import _query, activity_out, recent


def _month_key(d: date) -> str:
    return f"{d.year:04d}-{d.month:02d}"


def _shift_month(d: date, delta: int) -> date:
    index = d.year * 12 + d.month - 1 + delta
    return date(index // 12, index % 12 + 1, 1)


def _months(today_: date) -> list[str]:
    first = today_.replace(day=1)
    return [_month_key(_shift_month(first, i)) for i in range(-11, 1)]


def dashboard(conn) -> dict:
    today_ = today()
    # Plain dicts, so each figure can mix the strings and numbers in a row without the type checker objecting.
    all_deals: list[dict[str, Any]] = [dict(row) for row in conn.execute(select(deals)).mappings()]

    # Tiles
    open_deals = [d for d in all_deals if is_open(d["stage"])]
    open_value = sum(d["value"] for d in open_deals)
    expected = sum(d["value"] * d["probability"] / 100 for d in open_deals)

    month_names = _months(today_)
    months: dict[str, dict[str, Any]] = {m: {"month": m, "revenue": 0, "won": 0, "lost": 0} for m in month_names}
    for d in all_deals:
        if d["stage"] not in ("Won", "Lost") or not d["close_date"]:
            continue
        key = d["close_date"][:7]
        if key not in months:
            continue
        if d["stage"] == "Won":
            months[key]["revenue"] += d["value"]
            months[key]["won"] += 1
        else:
            months[key]["lost"] += 1
    series = [months[m] for m in month_names]

    this_month = series[-1]["revenue"]
    last_month = series[-2]["revenue"]
    change = None if last_month == 0 else round((this_month - last_month) / last_month * 100)
    won = sum(m["won"] for m in series)
    lost = sum(m["lost"] for m in series)
    win_rate = None if won + lost == 0 else round(won / (won + lost) * 100)

    # Funnel: the furthest funnel stage each deal ever reached (R-DASH-4).
    history: dict[int, set[str]] = {}
    for a in conn.execute(select(activities).where(activities.c.type == "stage_change")).mappings():
        history.setdefault(a["deal_id"], set()).update({a["from_stage"], a["to_stage"]})
    funnel: list[dict[str, Any]] = [{"stage": s, "value": 0, "count": 0} for s in FUNNEL_STAGES]
    for d in all_deals:
        seen = history.get(d["id"], set()) | {d["stage"]}
        ranks = [FUNNEL_STAGES.index(s) for s in seen if s in FUNNEL_STAGES]
        if not ranks:
            continue
        for i in range(max(ranks) + 1):
            funnel[i]["value"] += d["value"]
            funnel[i]["count"] += 1
    for i, step in enumerate(funnel):
        prev = funnel[i - 1]["value"] if i else None
        step["kept_percent"] = None if not prev else round(step["value"] / prev * 100)

    open_by_stage = [
        {
            "stage": s,
            "value": sum(d["value"] for d in open_deals if d["stage"] == s),
            "count": sum(1 for d in open_deals if d["stage"] == s),
        }
        for s in OPEN_STAGES
    ]

    # Follow-ups: overdue first, then the next 7 days; done ones are hidden.
    limit = (today_ + timedelta(days=7)).isoformat()
    rows = conn.execute(
        _query()
        .where(
            activities.c.follow_up_date.is_not(None),
            activities.c.done.is_(False),
            activities.c.follow_up_date <= limit,
        )
        .order_by(None)
        .order_by(activities.c.follow_up_date, activities.c.id)
    ).mappings()
    follow_ups = [activity_out(r) for r in rows]

    return {
        "tiles": {
            "open_pipeline": {"value": open_value, "count": len(open_deals)},
            "expected_revenue": {"value": expected},
            "won_this_month": {"value": this_month, "last_month": last_month, "change_percent": change},
            "win_rate": {"percent": win_rate, "won": won, "lost": lost},
        },
        "months": series,
        "funnel": funnel,
        "open_by_stage": open_by_stage,
        "follow_ups": follow_ups,
        "recent_activity": recent(conn, 10),
    }
