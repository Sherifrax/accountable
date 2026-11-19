"""FastAPI app. On first start it creates the database and loads the sample data (R-RUN-3)."""

from contextlib import asynccontextmanager
from pathlib import Path

from fastapi import FastAPI, Request
from fastapi.exceptions import RequestValidationError
from fastapi.responses import JSONResponse

from . import config
from .db import create_tables, make_engine, transaction
from .routers import activities, contacts, dashboard, deals, organizations, stages
from .services.common import Invalid, NotFound


def create_app(db_file: Path | str | None = None) -> FastAPI:
    @asynccontextmanager
    async def lifespan(app: FastAPI):
        path = Path(db_file) if db_file else config.db_path()
        is_new = not path.exists()
        path.parent.mkdir(parents=True, exist_ok=True)
        engine = make_engine(path)
        create_tables(engine)
        if is_new:
            from .seed import seed

            with transaction(engine) as conn:
                seed(conn)
        app.state.engine = engine
        yield
        engine.dispose()

    app = FastAPI(title="Accountable", lifespan=lifespan)

    for module in (stages, organizations, contacts, deals, activities, dashboard):
        app.include_router(module.router)

    @app.exception_handler(NotFound)
    async def not_found(_: Request, exc: NotFound):
        return JSONResponse({"detail": str(exc)}, status_code=404)

    @app.exception_handler(Invalid)
    async def invalid(_: Request, exc: Invalid):
        return JSONResponse({"detail": str(exc)}, status_code=422)

    @app.exception_handler(RequestValidationError)
    async def validation(_: Request, exc: RequestValidationError):
        messages = []
        for err in exc.errors():
            field = ".".join(str(p) for p in err["loc"] if p not in ("body", "query", "path"))
            msg = str(err["msg"]).removeprefix("Value error, ")
            messages.append(f"{field}: {msg}" if field and "required" not in msg.lower() else msg)
        return JSONResponse({"detail": "; ".join(messages) or "Invalid request"}, status_code=422)

    return app


app = create_app()
