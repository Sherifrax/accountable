"""R-DASH-1 to R-DASH-6, against fixed data. Today is 2026-06-15."""




def dash(client):
    r = client.get("/api/dashboard")
    assert r.status_code == 200
    return r.json()


def move(client, deal_id, stage):
    client.post(f"/api/deals/{deal_id}/move", json={"stage": stage, "index": 0})


def test_empty_database(client):
    d = dash(client)
    assert d["tiles"]["open_pipeline"] == {"value": 0, "count": 0}
    assert d["tiles"]["win_rate"]["percent"] is None
    assert d["tiles"]["won_this_month"]["change_percent"] is None
    assert len(d["months"]) == 12
    assert d["follow_ups"] == [] and d["recent_activity"] == []


def test_tiles(client, make):  # R-DASH-1
    make.deal("a", value=10000, stage="Proposal")  # 50%
    make.deal("b", value=20000, stage="Negotiation", probability=50)
    make.deal("won now", value=3000, stage="Won", close_date="2026-06-02")
    make.deal("won before", value=2000, stage="Won", close_date="2026-05-20")
    make.deal("lost", value=900, stage="Lost", close_date="2026-04-01")
    make.deal("lost", value=900, stage="Lost", close_date="2026-04-01")
    make.deal("too old", value=5000, stage="Won", close_date="2025-01-01")
    t = dash(client)["tiles"]
    assert t["open_pipeline"] == {"value": 30000, "count": 2}
    assert t["expected_revenue"]["value"] == 5000 + 10000
    assert t["won_this_month"] == {"value": 3000, "last_month": 2000, "change_percent": 50}
    assert t["win_rate"] == {"percent": 50, "won": 2, "lost": 2}  # the 2025 deal is outside 12 months


def test_change_percent_falls_and_handles_no_last_month(client, make):
    make.deal("now", value=1000, stage="Won", close_date="2026-06-01")
    assert dash(client)["tiles"]["won_this_month"]["change_percent"] is None
    make.deal("prev", value=4000, stage="Won", close_date="2026-05-30")
    assert dash(client)["tiles"]["won_this_month"]["change_percent"] == -75


def test_months_by_close_date(client, make):  # R-DASH-2, R-DASH-3
    make.deal("a", value=1000, stage="Won", close_date="2026-06-01")
    make.deal("b", value=2500, stage="Won", close_date="2026-06-30")  # same month, counted there
    make.deal("c", value=700, stage="Won", close_date="2025-07-31")
    make.deal("d", value=100, stage="Lost", close_date="2026-01-10")
    make.deal("open", value=9999, close_date="2026-06-10")
    months = dash(client)["months"]
    assert [m["month"] for m in months][0] == "2025-07" and months[-1]["month"] == "2026-06"
    by = {m["month"]: m for m in months}
    assert by["2026-06"] == {"month": "2026-06", "revenue": 3500, "won": 2, "lost": 0}
    assert by["2025-07"]["revenue"] == 700
    assert by["2026-01"]["lost"] == 1 and by["2026-01"]["revenue"] == 0
    assert sum(m["revenue"] for m in months) == 4200


def funnel(client):
    return {s["stage"]: s for s in dash(client)["funnel"]}


def test_funnel_deal_created_at_proposal_counts_earlier_stages(client, make):  # R-DASH-4
    make.deal("a", value=1000, stage="Proposal")
    f = funnel(client)
    assert [f[s]["value"] for s in ("New", "Qualified", "Proposal", "Negotiation", "Won")] == [1000, 1000, 1000, 0, 0]


def test_funnel_lost_deal_counts_up_to_where_it_was(client, make):  # R-DASH-4
    d = make.deal("a", value=500, stage="New")["id"]
    move(client, d, "Qualified")
    move(client, d, "Lost")
    f = funnel(client)
    assert (f["New"]["value"], f["Qualified"]["value"], f["Proposal"]["value"], f["Won"]["value"]) == (500, 500, 0, 0)


def test_funnel_moved_forward_and_back(client, make):  # R-DASH-4
    d = make.deal("a", value=800)["id"]
    move(client, d, "Negotiation")
    move(client, d, "Qualified")  # back again, but it did reach Negotiation
    f = funnel(client)
    assert f["Negotiation"]["value"] == 800 and f["Won"]["value"] == 0


def test_funnel_won_and_kept_share(client, make):  # R-DASH-4
    d = make.deal("won", value=1000)["id"]
    move(client, d, "Won")
    make.deal("open", value=3000, stage="Qualified")
    f = funnel(client)
    assert f["New"]["value"] == 4000 and f["New"]["kept_percent"] is None
    assert f["Qualified"]["value"] == 4000 and f["Qualified"]["kept_percent"] == 100
    assert f["Proposal"]["value"] == 1000 and f["Proposal"]["kept_percent"] == 25
    assert f["Won"]["value"] == 1000 and f["Won"]["kept_percent"] == 100
    assert f["Won"]["count"] == 1


def test_open_pipeline_by_stage(client, make):  # R-DASH-4
    make.deal("a", value=100, stage="New")
    make.deal("b", value=200, stage="New")
    make.deal("c", value=400, stage="Proposal")
    make.deal("closed", value=999, stage="Won")
    stack = {s["stage"]: s for s in dash(client)["open_by_stage"]}
    assert list(stack) == ["New", "Qualified", "Proposal", "Negotiation"]
    assert (stack["New"]["value"], stack["New"]["count"], stack["Qualified"]["value"]) == (300, 2, 0)


def test_follow_ups(client, make):  # R-DASH-5
    c = make.contact("Ann")
    deal = make.deal("Big", contact_id=c["id"])
    for desc, when in [("later", "2026-06-23"), ("edge", "2026-06-22"), ("today", "2026-06-15"),
                       ("old", "2026-06-01"), ("recent", "2026-06-14"), ("soon", "2026-06-18")]:
        make.activity(contact_id=c["id"], description=desc, follow_up_date=when)
    done = make.activity(deal_id=deal["id"], description="done", follow_up_date="2026-06-10")
    client.patch(f"/api/activities/{done['id']}", json={"done": True})
    make.activity(contact_id=c["id"], description="no follow-up")
    items = dash(client)["follow_ups"]
    assert [i["description"] for i in items] == ["old", "recent", "today", "soon", "edge"]
    assert [i["overdue"] for i in items] == [True, True, False, False, False]
    assert items[0]["contact_name"] == "Ann"


def test_follow_up_disappears_when_done(client, make):  # R-ACT-3, R-DASH-7
    c = make.contact()
    act = make.activity(contact_id=c["id"], follow_up_date="2026-06-16")
    assert len(dash(client)["follow_ups"]) == 1
    client.patch(f"/api/activities/{act['id']}", json={"done": True})
    assert dash(client)["follow_ups"] == []


def test_recent_activity_is_ten_newest_including_stage_changes(client, make, engine):  # R-DASH-6
    c = make.contact()
    for n in range(11):
        make.activity(contact_id=c["id"], description=f"n{n}", occurred_at=f"2026-06-{n + 1:02d}T09:00:00")
    deal = make.deal("D", contact_id=c["id"])["id"]
    move(client, deal, "Qualified")  # stamped at "now" on the fixed day, so newest
    recent = dash(client)["recent_activity"]
    assert len(recent) == 10
    assert recent[0]["type"] == "stage_change"
    assert [r["description"] for r in recent[1:4]] == ["n10", "n9", "n8"]
    assert "n0" not in [r["description"] for r in recent] and "n1" not in [r["description"] for r in recent]


def test_marking_a_deal_won_shows_up(client, make):  # R-DASH-7
    d = make.deal("x", value=8000, stage="Negotiation")["id"]
    before = dash(client)["tiles"]
    client.patch(f"/api/deals/{d}", json={"stage": "Won"})
    after = dash(client)["tiles"]
    assert after["open_pipeline"]["value"] == before["open_pipeline"]["value"] - 8000
    assert after["won_this_month"]["value"] == 8000
    assert after["win_rate"]["percent"] == 100
