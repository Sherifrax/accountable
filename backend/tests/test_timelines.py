"""R-REC-1, R-REC-4."""


def test_newest_first(client, make):
    c = make.contact()
    old = make.activity(contact_id=c["id"], description="old", occurred_at="2026-06-01T09:00:00")
    new = make.activity(contact_id=c["id"], description="new", occurred_at="2026-06-10T09:00:00")
    mid = make.activity(contact_id=c["id"], description="mid", occurred_at="2026-06-05T09:00:00")
    ids = [e["id"] for e in client.get(f"/api/contacts/{c['id']}").json()["timeline"]]
    assert ids == [new["id"], mid["id"], old["id"]]


def test_organization_timeline_combines_without_repeats(client, make):
    org = make.org()
    ann = make.contact("Ann", organization_id=org["id"])
    bob = make.contact("Bob", organization_id=org["id"])
    stranger = make.contact("Eve")
    deal = make.deal(organization_id=org["id"], contact_id=ann["id"])
    a1 = make.activity(contact_id=bob["id"], occurred_at="2026-06-01T09:00:00")
    a2 = make.activity(deal_id=deal["id"], occurred_at="2026-06-02T09:00:00")  # deal + Ann
    a3 = make.activity(contact_id=ann["id"], deal_id=deal["id"], occurred_at="2026-06-03T09:00:00")
    make.activity(contact_id=stranger["id"])
    client.patch(f"/api/deals/{deal['id']}", json={"stage": "Qualified"})
    timeline = client.get(f"/api/organizations/{org['id']}").json()["timeline"]
    ids = [e["id"] for e in timeline]
    assert len(ids) == len(set(ids)) == 4
    assert {a1["id"], a2["id"], a3["id"]} <= set(ids)
    assert timeline[0]["type"] == "stage_change"  # stamped now, so newest
    assert ids[1:] == [a3["id"], a2["id"], a1["id"]]


def test_entries_link_to_other_record(client, make):  # R-REC-4
    ann = make.contact("Ann")
    deal = make.deal("Big deal", contact_id=ann["id"])
    make.activity(deal_id=deal["id"])
    entry = client.get(f"/api/contacts/{ann['id']}").json()["timeline"][0]
    assert (entry["deal_id"], entry["deal_name"]) == (deal["id"], "Big deal")
    entry = client.get(f"/api/deals/{deal['id']}").json()["timeline"][0]
    assert entry["contact_name"] == "Ann"


def test_same_time_orders_by_id(client, make, engine):
    c = make.contact()
    a = make.activity(contact_id=c["id"], occurred_at="2026-06-01T09:00:00")
    b = make.activity(contact_id=c["id"], occurred_at="2026-06-01T09:00:00")
    ids = [e["id"] for e in client.get(f"/api/contacts/{c['id']}").json()["timeline"]]
    assert ids == [b["id"], a["id"]]
