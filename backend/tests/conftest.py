"""Every test gets its own temporary database and a fixed "today"."""

from datetime import date

import pytest
from fastapi.testclient import TestClient

from backend.app import config
from backend.app.db import create_tables, make_engine
from backend.app.main import create_app

TODAY = date(2026, 6, 15)


@pytest.fixture(autouse=True)
def fixed_today():
    config.set_today(TODAY)
    yield TODAY
    config.set_today(None)


@pytest.fixture
def db_file(tmp_path):
    return tmp_path / "test.db"


@pytest.fixture
def client(db_file):
    """A client on an empty database (tables exist, no sample data)."""
    engine = make_engine(db_file)
    create_tables(engine)
    engine.dispose()
    with TestClient(create_app(db_file)) as c:
        yield c


@pytest.fixture
def engine(client):
    return client.app.state.engine


class Make:
    """Small helpers that create records through the API."""

    def __init__(self, client):
        self.c = client

    def _post(self, path, **body):
        r = self.c.post(path, json=body)
        assert r.status_code == 201, r.text
        return r.json()

    def org(self, name="Acme", **kw):
        return self._post("/api/organizations", name=name, **kw)

    def contact(self, name="Ann", **kw):
        return self._post("/api/contacts", name=name, **kw)

    def deal(self, name="Deal", value=1000, **kw):
        return self._post("/api/deals", name=name, value=value, **kw)

    def activity(self, **kw):
        kw.setdefault("type", "note")
        kw.setdefault("description", "Talked")
        return self._post("/api/activities", **kw)

    def get_deal(self, deal_id):
        return self.c.get(f"/api/deals/{deal_id}").json()

    def column(self, stage):
        deals = [d for d in self.c.get("/api/deals").json() if d["stage"] == stage]
        return [d["id"] for d in sorted(deals, key=lambda d: d["position"])]


@pytest.fixture
def make(client):
    return Make(client)
