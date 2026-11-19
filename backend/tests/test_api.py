"""R-RUN-3, error shapes."""

from fastapi.testclient import TestClient

from backend.app.main import create_app


def test_new_database_is_created_and_seeded(tmp_path):  # R-RUN-3
    path = tmp_path / "nested" / "fresh.db"
    assert not path.exists()
    with TestClient(create_app(path)) as client:
        assert path.exists()
        assert len(client.get("/api/organizations").json()) == 15
        assert len(client.get("/api/deals").json()) == 30


def test_existing_database_is_not_reseeded(tmp_path):  # R-RUN-3
    path = tmp_path / "fresh.db"
    with TestClient(create_app(path)) as client:
        client.post("/api/organizations", json={"name": "Extra"})
    with TestClient(create_app(path)) as client:
        names = [o["name"] for o in client.get("/api/organizations").json()]
        assert len(names) == 16 and "Extra" in names  # changes survive a restart


def test_404s_have_detail(client):
    for path in ("organizations", "contacts", "deals"):
        r = client.get(f"/api/{path}/12345")
        assert r.status_code == 404
        assert r.json() == {"detail": f"{path[:-1].capitalize()} not found"}
    assert client.patch("/api/deals/12345", json={"name": "x"}).status_code == 404
    assert client.patch("/api/activities/12345", json={"done": True}).status_code == 404


def test_422_has_string_detail(client):
    r = client.post("/api/organizations", json={})
    assert r.status_code == 422
    assert isinstance(r.json()["detail"], str)
    r = client.post("/api/contacts", json={"name": "A", "status": "vip"})
    assert r.status_code == 422 and "detail" in r.json()
    assert client.get("/api/contacts?status=vip").status_code == 422
    assert client.get("/api/deals/abc").status_code == 422


def test_contact_status_filter(client, make):
    make.contact("a", status="lead")
    make.contact("b", status="customer")
    assert [c["name"] for c in client.get("/api/contacts?status=customer").json()] == ["b"]
    assert len(client.get("/api/contacts").json()) == 2


def test_organization_detail_has_everything(client, make):
    org = make.org("Northwind", industry="Logistics")
    contact = make.contact("Ann", organization_id=org["id"])
    make.deal("D", organization_id=org["id"], contact_id=contact["id"])
    d = client.get(f"/api/organizations/{org['id']}").json()
    assert d["industry"] == "Logistics"
    assert [c["name"] for c in d["contacts"]] == ["Ann"]
    assert [x["name"] for x in d["deals"]] == ["D"]
    assert d["timeline"] == []


def test_patch_organization_and_contact(client, make):
    org = make.org("Old")
    assert client.patch(f"/api/organizations/{org['id']}", json={"name": "New", "website": "x.com"}).json()["name"] == "New"
    assert client.patch(f"/api/organizations/{org['id']}", json={"name": ""}).status_code == 422
    contact = make.contact("A")
    r = client.patch(f"/api/contacts/{contact['id']}", json={"organization_id": org["id"], "status": "customer"})
    assert r.json()["organization_name"] == "New" and r.json()["status"] == "customer"
    assert client.patch(f"/api/contacts/{contact['id']}", json={"email": "bad"}).status_code == 422
    assert client.patch(f"/api/contacts/{contact['id']}", json={"organization_id": None}).json()["organization_id"] is None
