"""R-DEL-1 to R-DEL-4."""

from sqlalchemy import func, select

from backend.app.db import activities


def count_activities(engine):
    with engine.connect() as conn:
        return conn.execute(select(func.count()).select_from(activities)).scalar_one()


def test_foreign_keys_are_on(engine):
    with engine.connect() as conn:
        assert conn.exec_driver_sql("PRAGMA foreign_keys").scalar() == 1


def test_delete_organization_keeps_contacts_and_deals(client, make):  # R-DEL-1
    org = make.org()
    contact = make.contact(organization_id=org["id"])
    deal = make.deal(organization_id=org["id"])
    assert client.delete(f"/api/organizations/{org['id']}").status_code == 204
    assert client.get(f"/api/contacts/{contact['id']}").json()["organization_id"] is None
    assert make.get_deal(deal["id"])["organization_id"] is None
    assert make.get_deal(deal["id"])["organization_name"] is None


def test_delete_contact_keeps_deals(client, make):  # R-DEL-2
    contact = make.contact()
    deal = make.deal(contact_id=contact["id"])
    client.delete(f"/api/contacts/{contact['id']}")
    assert make.get_deal(deal["id"])["contact_id"] is None


def test_delete_contact_activities(client, make):  # R-DEL-3
    contact = make.contact()
    deal = make.deal(contact_id=contact["id"])
    only_contact = make.activity(contact_id=contact["id"])
    both = make.activity(contact_id=contact["id"], deal_id=deal["id"])
    client.delete(f"/api/contacts/{contact['id']}")
    ids = [e["id"] for e in make.get_deal(deal["id"])["timeline"]]
    assert both["id"] in ids and only_contact["id"] not in ids
    kept = [e for e in make.get_deal(deal["id"])["timeline"] if e["id"] == both["id"]][0]
    assert kept["contact_id"] is None


def test_delete_deal_activities(client, make, engine):  # R-DEL-3
    contact = make.contact()
    deal = make.deal(contact_id=contact["id"])
    only_deal = make.activity(deal_id=deal["id"], contact_id=None)  # contact filled in by the server
    client.patch(f"/api/deals/{deal['id']}", json={"stage": "Qualified"})
    # one activity linked to a deal with no contact
    lone = make.deal("Lone")
    lone_act = make.activity(deal_id=lone["id"])
    client.delete(f"/api/deals/{deal['id']}")
    timeline = client.get(f"/api/contacts/{contact['id']}").json()["timeline"]
    # The note was linked to the contact too, so it stays; the stage change is gone.
    assert [e["id"] for e in timeline] == [only_deal["id"]]
    assert timeline[0]["deal_id"] is None
    client.delete(f"/api/deals/{lone['id']}")
    assert count_activities(engine) == 1
    assert lone_act["id"] != only_deal["id"]


def test_activity_linked_to_both_goes_when_second_is_deleted(client, make, engine):  # R-DEL-3
    contact = make.contact()
    deal = make.deal(contact_id=contact["id"])
    make.activity(deal_id=deal["id"])
    client.delete(f"/api/contacts/{contact['id']}")
    assert count_activities(engine) == 1
    client.delete(f"/api/deals/{deal['id']}")
    assert count_activities(engine) == 0


def test_deleting_a_deal_closes_the_gap(client, make):
    a, b, c = (make.deal(n)["id"] for n in "abc")
    client.delete(f"/api/deals/{b}")
    deals = [d for d in client.get("/api/deals").json()]
    assert sorted(d["position"] for d in deals) == [0, 1]


def test_impact_counts_match_what_happens(client, make, engine):  # R-DEL-4
    org = make.org("Northwind")
    contact = make.contact(organization_id=org["id"])
    make.contact("Second", organization_id=org["id"])
    deal = make.deal(organization_id=org["id"], contact_id=contact["id"])
    make.deal("Other", organization_id=org["id"])
    assert client.get(f"/api/organizations/{org['id']}/delete-impact").json() == {
        "name": "Northwind", "contacts": 2, "deals": 2,
    }
    make.activity(contact_id=contact["id"])
    make.activity(contact_id=contact["id"])
    make.activity(deal_id=deal["id"])  # linked to deal + contact
    client.patch(f"/api/deals/{deal['id']}", json={"stage": "Proposal"})
    assert client.get(f"/api/contacts/{contact['id']}/delete-impact").json() == {
        "name": "Ann", "deals": 1, "activities_deleted": 2, "activities_kept": 2,
    }
    assert client.get(f"/api/deals/{deal['id']}/delete-impact").json() == {
        "name": "Deal", "stage_changes": 1, "activities_deleted": 0, "activities_kept": 1,
    }
    before = count_activities(engine)
    client.delete(f"/api/contacts/{contact['id']}")
    assert before - count_activities(engine) == 2


def test_delete_missing_is_404(client):
    for kind in ("organizations", "contacts", "deals"):
        assert client.delete(f"/api/{kind}/999").status_code == 404
        assert client.get(f"/api/{kind}/999/delete-impact").status_code == 404
