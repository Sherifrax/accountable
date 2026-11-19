from backend.app.stages import CLOSED_STAGES, OPEN_STAGES, STAGE_NAMES, USUAL_PROBABILITY


def test_stage_order_and_probabilities():
    assert STAGE_NAMES == ["New", "Qualified", "Proposal", "Negotiation", "Won", "Lost"]
    assert [USUAL_PROBABILITY[s] for s in STAGE_NAMES] == [10, 25, 50, 75, 100, 0]


def test_open_and_closed():
    assert OPEN_STAGES == ["New", "Qualified", "Proposal", "Negotiation"]
    assert CLOSED_STAGES == ["Won", "Lost"]


def test_api_returns_stages(client):
    r = client.get("/api/stages")
    assert r.status_code == 200
    assert [s["name"] for s in r.json()] == STAGE_NAMES
    assert r.json()[2] == {"name": "Proposal", "probability": 50, "open": True}
