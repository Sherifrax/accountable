"""R-DATA-4, R-PIPE-4, R-PIPE-6."""


def move(client, deal_id, stage, index):
    r = client.post(f"/api/deals/{deal_id}/move", json={"stage": stage, "index": index})
    assert r.status_code == 200, r.text
    return r.json()


def three(make, stage="New"):
    # Created in order a, b, c, so the column reads c, b, a (new goes on top).
    a, b, c = (make.deal(n, stage=stage)["id"] for n in "abc")
    return a, b, c


def positions(make, stage):
    deals = [d for d in make.c.get("/api/deals").json() if d["stage"] == stage]
    return sorted(d["position"] for d in deals)


def test_new_deal_goes_to_top(make):  # R-PIPE-6
    a, b, c = three(make)
    assert make.column("New") == [c, b, a]
    assert positions(make, "New") == [0, 1, 2]


def test_move_to_other_column_at_index_renumbers_both(client, make):
    a, b, c = three(make)
    x, y = make.deal("x", stage="Proposal")["id"], make.deal("y", stage="Proposal")["id"]
    assert make.column("Proposal") == [y, x]
    deal = move(client, b, "Proposal", 1)
    assert make.column("Proposal") == [y, b, x]
    assert make.column("New") == [c, a]
    assert positions(make, "Proposal") == [0, 1, 2]
    assert positions(make, "New") == [0, 1]
    assert deal["stage"] == "Proposal" and deal["probability"] == 50


def test_move_within_column(client, make):
    a, b, c = three(make)  # column: c, b, a
    move(client, c, "New", 2)  # top to bottom
    assert make.column("New") == [b, a, c]
    move(client, c, "New", 0)  # bottom to top
    assert make.column("New") == [c, b, a]
    move(client, c, "New", 1)  # top to middle
    assert make.column("New") == [b, c, a]
    assert positions(make, "New") == [0, 1, 2]


def test_index_past_end_goes_last(client, make):
    a, b, c = three(make)
    move(client, c, "New", 99)
    assert make.column("New") == [b, a, c]
    other = make.deal("o", stage="Qualified")["id"]
    move(client, a, "Qualified", 50)
    assert make.column("Qualified") == [other, a]


def test_move_to_empty_column(client, make):
    a, b, c = three(make)
    move(client, a, "Lost", 0)
    assert make.column("Lost") == [a]


def test_same_stage_move_makes_no_entry(client, make):
    a, b, c = three(make)
    move(client, a, "New", 0)
    assert make.get_deal(a)["timeline"] == []


def test_other_stage_move_makes_one_entry(client, make):
    a, b, c = three(make)
    move(client, a, "Qualified", 0)
    timeline = make.get_deal(a)["timeline"]
    assert [e["description"] for e in timeline] == ["Moved from New to Qualified"]


def test_move_to_won_sets_close_date_and_probability(client, make, fixed_today):
    a, *_ = three(make)
    deal = move(client, a, "Won", 0)
    assert deal["close_date"] == fixed_today.isoformat()
    assert deal["probability"] == 100


def test_move_errors(client, make):
    a, *_ = three(make)
    assert client.post("/api/deals/999/move", json={"stage": "Won", "index": 0}).status_code == 404
    assert client.post(f"/api/deals/{a}/move", json={"stage": "Nope", "index": 0}).status_code == 422
