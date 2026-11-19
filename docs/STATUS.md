# Status

Work follows `docs/plan.md`. Done so far: phases 0, 1 and 2 (skeleton, backend rules, sample data and dashboard figures).

## Prerequisites (one time)

- Node 24 or later (Node 26 is installed here with `brew install node`)
- [uv](https://docs.astral.sh/uv/) (it fetches Python 3.12 itself on first use)
- Google Chrome, for the end-to-end tests
- An internet connection for the first install only. After that the app works offline.

Then, once, from the repo root:

```
npm install
```

## Run, reset, test

| Command | What it does |
|---|---|
| `npm run dev` | Starts the backend (http://localhost:8000) and the frontend. Open http://localhost:5173. The first start creates `data/accountable.db` and fills it with sample data. |
| `npm run seed` | Resets the data to the sample data. Safe while the app is running. |
| `npm test` | Vitest, then pytest, then Playwright; stops at the first failure. Tests use their own database (temporary files for pytest, `e2e/.data/e2e.db` on ports 8001 and 5174 for Playwright), never `data/accountable.db`. |
| `npm run test:front`, `test:back`, `test:e2e` | One kind of test at a time. |

## What exists

- **Backend** (`backend/`): the whole API from spec 3.3 and every data rule. 81 pytest tests cover them, including stage and probability rules, moving and renumbering, delete rules and impact counts, timelines, dashboard figures with a fixed "today", and the sample data.
- **Frontend** (`frontend/`): Vite, React and TypeScript skeleton that shows the stage names from `/api/stages`. The real screens are phases 3 to 6.
- **End to end** (`e2e/`): Playwright config, a fixture that reseeds before each test and fails on any console error or warning, and one smoke test.
- `docs/mockups/prototype.html` stays as the visual reference.

## Later ideas (not in the spec)

None yet.
