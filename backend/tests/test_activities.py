"""R-DATA-10, R-DATA-11, R-ACT-2, R-DEL-5."""


def test_needs_contact_or_deal(client):  # R-DATA-10
    r = client.post("/api/activities", json={"type": "note", "description": "x"})
    assert r.status_code == 422
    assert "contact or a deal" in r.json()["detail"]


def test_type_and_description_validated(client, make):
    c = make.contact()
    assert client.post("/api/activities", json={"type": "stage_change", "description": "x", "contact_id": c["id"]}).status_code == 422
    assert client.post("/api/activities", json={"type": "note", "description": " ", "contact_id": c["id"]}).status_code == 422


def test_logging_on_deal_adds_its_contact(make):  # R-DATA-10
    contact = make.contact("Ann")
    deal = make.deal(contact_id=contact["id"])
    act = make.activity(deal_id=deal["id"])
    assert act["contact_id"] == contact["id"] and act["contact_name"] == "Ann"
    assert act["deal_id"] == deal["id"]


def test_logging_on_deal_without_contact(make):
    deal = make.deal()
    assert make.activity(deal_id=deal["id"])["contact_id"] is None


def test_changing_deal_contact_does_not_move_old_activities(client, make):
    ann, bob = make.contact("Ann"), make.contact("Bob")
    deal = make.deal(contact_id=ann["id"])
    act = make.activity(deal_id=deal["id"])
    client.patch(f"/api/deals/{deal['id']}", json={"contact_id": bob["id"]})
    timeline = client.get(f"/api/deals/{deal['id']}").json()["timeline"]
    assert [e["contact_id"] for e in timeline if e["id"] == act["id"]] == [ann["id"]]
    assert client.get(f"/api/contacts/{bob['id']}").json()["timeline"] == []


def test_follow_up_starts_not_done_and_can_be_done(client, make):  # R-DATA-11, R-ACT-2
    c = make.contact()
    act = make.activity(contact_id=c["id"], follow_up_date="2026-06-20")
    assert act["done"] is False and act["follow_up_date"] == "2026-06-20"
    r = client.patch(f"/api/activities/{act['id']}", json={"done": True})
    assert r.json()["done"] is True


def test_edit_adds_and_removes_follow_up(client, make):  # R-ACT-2
    c = make.contact()
    act = make.activity(contact_id=c["id"])
    r = client.patch(f"/api/activities/{act['id']}", json={"follow_up_date": "2026-07-01", "description": "New text", "type": "call"})
    assert (r.json()["follow_up_date"], r.json()["description"], r.json()["type"]) == ("2026-07-01", "New text", "call")
    r = client.patch(f"/api/activities/{act['id']}", json={"follow_up_date": None})
    assert r.json()["follow_up_date"] is None


def test_overdue_flag(make):
    c = make.contact()
    assert make.activity(contact_id=c["id"], follow_up_date="2026-06-14")["overdue"] is True
    assert make.activity(contact_id=c["id"], follow_up_date="2026-06-15")["overdue"] is False


def test_delete_activity(client, make):
    c = make.contact()
    act = make.activity(contact_id=c["id"])
    assert client.delete(f"/api/activities/{act['id']}").status_code == 204
    assert client.delete(f"/api/activities/{act['id']}").status_code == 404


def test_stage_changes_cannot_be_edited_or_deleted(client, make):  # R-DEL-5
    deal = make.deal()
    client.patch(f"/api/deals/{deal['id']}", json={"stage": "Qualified"})
    entry = client.get(f"/api/deals/{deal['id']}").json()["timeline"][0]
    assert client.patch(f"/api/activities/{entry['id']}", json={"description": "x"}).status_code == 422
    assert client.delete(f"/api/activities/{entry['id']}").status_code == 422
