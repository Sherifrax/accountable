from fastapi import Request

from ..db import transaction


def tx(request: Request):
    """`with tx(request) as conn:` runs a request in one transaction."""
    return transaction(request.app.state.engine)
