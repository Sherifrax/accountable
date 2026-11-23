"""The six pipeline stages: order, usual probability, and whether they are open."""

from typing import TypedDict


class Stage(TypedDict):
    name: str
    probability: int
    open: bool


STAGES: list[Stage] = [
    {"name": "New", "probability": 10, "open": True},
    {"name": "Qualified", "probability": 25, "open": True},
    {"name": "Proposal", "probability": 50, "open": True},
    {"name": "Negotiation", "probability": 75, "open": True},
    {"name": "Won", "probability": 100, "open": False},
    {"name": "Lost", "probability": 0, "open": False},
]

STAGE_NAMES = [s["name"] for s in STAGES]
USUAL_PROBABILITY = {s["name"]: s["probability"] for s in STAGES}
OPEN_STAGES = [s["name"] for s in STAGES if s["open"]]
CLOSED_STAGES = [s["name"] for s in STAGES if not s["open"]]
# Funnel order: Lost is not later than anything.
FUNNEL_STAGES = ["New", "Qualified", "Proposal", "Negotiation", "Won"]


def is_open(stage: str) -> bool:
    return stage in OPEN_STAGES
