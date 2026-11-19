"""R-DATA-1 to R-DATA-9."""

from datetime import timedelta


def test_new_deal_takes_stage_probability(make):  # R-DATA-1
    assert make.deal(stage="Proposal")["probability"] == 50
    assert make.deal()["probability"] == 10  # default stage New


def test_new_deal_keeps_given_probability(make):  # R-DATA-1
    assert make.deal(stage="Proposal", probability=60)["probability"] == 60


def test_stage_change_resets_probability(client, make):  # R-DATA-2
    deal = make.deal(probability=33)
    r = client.patch(f"/api/deals/{deal['id']}", json={"stage": "Negotiation"})
    assert r.json()["probability"] == 75


def test_hand_set_probability_survives_edit_without_stage_change(client, make):  # R-DATA-2
    deal = make.deal(stage="Qualified")
    client.patch(f"/api/deals/{deal['id']}", json={"probability": 40})
    r = client.patch(f"/api/deals/{deal['id']}", json={"name": "Renamed", "value": 5000})
    assert r.json()["probability"] == 40


def test_stage_and_probability_together_keep_given(client, make):  # R-DATA-2
    deal = make.deal()
    r = client.patch(f"/api/deals/{deal['id']}", json={"stage": "Proposal", "probability": 65})
    assert r.json()["stage"] == "Proposal"
    assert r.json()["probability"] == 65


def test_won_and_lost_set_close_date_to_today(client, make, fixed_today):  # R-DATA-3
    for stage in ("Won", "Lost"):
        deal = make.deal(close_date="2026-01-01")
        r = client.patch(f"/api/deals/{deal['id']}", json={"stage": stage})
        assert r.json()["close_date"] == fixed_today.isoformat()


def test_moving_back_keeps_close_date(client, make, fixed_today):  # R-DATA-3
    deal = make.deal(stage="Won")
    assert deal["close_date"] == fixed_today.isoformat()
    r = client.patch(f"/api/deals/{deal['id']}", json={"stage": "Proposal"})
    assert r.json()["close_date"] == fixed_today.isoformat()


def test_close_date_given_in_same_save_wins(client, make):  # R-DATA-3
    deal = make.deal()
    r = client.patch(f"/api/deals/{deal['id']}", json={"stage": "Won", "close_date": "2026-05-01"})
    assert r.json()["close_date"] == "2026-05-01"


def test_stage_change_from_edit_logs_entry(client, make):  # R-DATA-4
    contact = make.contact()
    deal = make.deal(contact_id=contact["id"], stage="Proposal")
    client.patch(f"/api/deals/{deal['id']}", json={"stage": "Negotiation"})
    entry = client.get(f"/api/deals/{deal['id']}").json()["timeline"][0]
    assert entry["type"] == "stage_change"
    assert entry["description"] == "Moved from Proposal to Negotiation"
    assert (entry["from_stage"], entry["to_stage"]) == ("Proposal", "Negotiation")
    assert entry["contact_id"] == contact["id"]
    assert entry["editable"] is False


def test_late_only_when_open_and_past_close_date(make, fixed_today):  # R-DATA-5
    yesterday = (fixed_today - timedelta(days=1)).isoformat()
    assert make.deal(close_date=yesterday)["late"] is True
    assert make.deal(close_date=fixed_today.isoformat())["late"] is False
    assert make.deal()["late"] is False  # no close date
    assert make.deal(stage="Won", close_date=yesterday)["late"] is False
    assert make.deal(stage="Lost", close_date=yesterday)["late"] is False


def test_expected_revenue(make):  # R-DATA-6
    deal = make.deal(value=12500, probability=40)
    assert deal["expected_revenue"] == 5000


def test_value_and_probability_limits(client, make):  # R-DATA-7
    base = {"name": "X", "value": 100}
    for bad in ({"value": -1}, {"probability": 101}, {"probability": -1}, {"value": 1.5}):
        r = client.post("/api/deals", json={**base, **bad})
        assert r.status_code == 422, bad
        assert isinstance(r.json()["detail"], str)
    assert client.post("/api/deals", json={**base, "value": 0, "probability": 0}).status_code == 201
    deal = make.deal()
    assert client.patch(f"/api/deals/{deal['id']}", json={"value": -5}).status_code == 422
    assert client.patch(f"/api/deals/{deal['id']}", json={"probability": 120}).status_code == 422


def test_required_fields_and_email(client):  # R-DATA-9
    assert client.post("/api/organizations", json={"name": "  "}).status_code == 422
    assert client.post("/api/contacts", json={"name": ""}).status_code == 422
    assert client.post("/api/deals", json={"name": "", "value": 1}).status_code == 422
    assert client.post("/api/deals", json={"name": "A"}).status_code == 422
    bad = client.post("/api/contacts", json={"name": "A", "email": "nope"})
    assert bad.status_code == 422
    assert "Email" in bad.json()["detail"]
    ok = client.post("/api/contacts", json={"name": "A", "email": "a@b.co"})
    assert ok.status_code == 201
    assert ok.json()["status"] == "lead"  # default


def test_links_must_exist(client):
    r = client.post("/api/deals", json={"name": "A", "value": 1, "organization_id": 999})
    assert r.status_code == 422
    assert r.json()["detail"] == "Organization not found"


def test_lists_have_names_and_counts(client, make):
    org = make.org("Northwind")
    contact = make.contact("Ann", organization_id=org["id"])
    make.deal("Open", value=1000, organization_id=org["id"], contact_id=contact["id"])
    make.deal("Won", value=500, organization_id=org["id"], stage="Won")
    row = client.get("/api/organizations").json()[0]
    assert (row["contact_count"], row["open_deal_count"], row["open_pipeline_value"]) == (1, 1, 1000)
    deal = [d for d in client.get("/api/deals").json() if d["name"] == "Open"][0]
    assert deal["organization_name"] == "Northwind" and deal["contact_name"] == "Ann"
