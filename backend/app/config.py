import os
from datetime import date, datetime
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]


def db_path() -> Path:
    """Database file. Tests set ACCOUNTABLE_DB so they never touch real data."""
    return Path(os.environ.get("ACCOUNTABLE_DB") or ROOT / "data" / "accountable.db")


# Tests replace this to fix "today".
_today_override: date | None = None


def set_today(value: date | None) -> None:
    global _today_override
    _today_override = value


def today() -> date:
    """The one source of today's local date (R-DATA-8)."""
    return _today_override or date.today()


def now() -> datetime:
    """Current local time, on the fixed day if tests set one."""
    real = datetime.now().replace(microsecond=0)
    if _today_override:
        return datetime.combine(_today_override, real.time())
    return real
