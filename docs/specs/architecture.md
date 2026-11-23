# 3. Architecture

```
accountable/
├── package.json            # npm scripts; workspaces: ["frontend"]
├── pyproject.toml, uv.lock # Python project (backend)
├── backend/
│   ├── app/
│   │   ├── main.py         # FastAPI app, routers, startup (create + seed if new)
│   │   ├── db.py           # engine, metadata, tables (SQLAlchemy Core)
│   │   ├── schemas.py      # Pydantic models for requests and responses
│   │   ├── stages.py       # stage list, probabilities, helpers
│   │   ├── routers/        # organizations, contacts, deals, activities, dashboard
│   │   ├── services/       # business rules: deleting, stage changes, ordering
│   │   └── seed.py         # sample data; `python -m backend.app.seed`
│   └── tests/              # pytest
├── frontend/
│   ├── src/
│   │   ├── api/            # typed fetch client + TanStack Query hooks
│   │   ├── components/     # shared UI: Button, Dialog, DataTable, Tag, Timeline…
│   │   ├── features/       # dashboard, organizations, contacts, deals, pipeline
│   │   ├── styles/         # tokens.css, global.css
│   │   └── main.tsx, App.tsx (routes)
│   └── vite.config.ts      # proxies /api to :8000
├── e2e/                    # Playwright tests + playwright.config.ts
└── data/accountable.db     # SQLite file (git-ignored)
```

## 3.1 Libraries

| Need | Library |
|---|---|
| Routing | React Router |
| Server data, caching, optimistic updates | TanStack Query |
| Tables (sort, filter) | TanStack Table |
| Charts | Recharts |
| Drag and drop | dnd-kit (`@dnd-kit/core`, `@dnd-kit/sortable`) |
| Forms and validation | React Hook Form + Zod |
| Dialogs, dropdowns, selects, checkbox | Radix UI primitives |
| Toast messages | Sonner |
| Icons | Lucide |
| Dates | date-fns |
| Fonts (offline) | Fontsource packages |
| Running both servers | concurrently |
| Backend | FastAPI, Uvicorn, SQLAlchemy Core, Pydantic |

Styling is plain CSS with CSS variables (`tokens.css`) and CSS Modules per component. No UI kit theme to override.

## 3.2 Data model (SQLite, SQLAlchemy Core)

Foreign keys are turned on (`PRAGMA foreign_keys = ON`). Timestamps are ISO 8601 strings in local time. Dates are `YYYY-MM-DD`.

**organizations**: `id` PK, `name` text not null, `website` text, `industry` text, `notes` text, `created_at`, `updated_at`.

**contacts**: `id` PK, `name` text not null, `email`, `phone`, `job_title`, `organization_id` FK → organizations ON DELETE SET NULL, `status` text not null (`lead` | `qualified` | `customer`), `created_at`, `updated_at`.

**deals**: `id` PK, `name` text not null, `organization_id` FK ON DELETE SET NULL, `contact_id` FK → contacts ON DELETE SET NULL, `stage` text not null, `value` integer not null ≥ 0, `probability` integer not null 0–100, `close_date` date, `position` integer not null (order within its stage column, 0 = top), `created_at`, `updated_at`.

**activities**: `id` PK, `type` text not null (`note` | `call` | `email` | `stage_change`), `contact_id` FK ON DELETE SET NULL, `deal_id` FK ON DELETE SET NULL, `description` text not null, `occurred_at` timestamp not null, `follow_up_date` date, `done` boolean not null default false, `from_stage`, `to_stage` (stage changes only), `created_at`, `updated_at`.

The rule in R-DEL-3 runs in the service layer inside one transaction. It deletes the activities that would be left with neither link, and stage changes for a deleted deal, before the record itself. The SET NULL foreign keys handle the rest.

## 3.3 API

JSON over `/api`. Errors return `{"detail": "..."}` with 400, 404 or 422.

| Method and path | Purpose |
|---|---|
| `GET /api/stages` | Stage list with usual probabilities |
| `GET/POST /api/organizations` | List (with counts and open value) / create |
| `GET/PATCH/DELETE /api/organizations/{id}` | Detail (with contacts, deals, timeline) / update / delete |
| `GET /api/organizations/{id}/delete-impact` | Counts for the confirmation dialog |
| `GET/POST /api/contacts?status=` | List / create |
| `GET/PATCH/DELETE /api/contacts/{id}` | Detail (organization, deals, timeline) / update / delete |
| `GET /api/contacts/{id}/delete-impact` | Counts |
| `GET/POST /api/deals` | List (with expected revenue and late flag) / create |
| `GET/PATCH/DELETE /api/deals/{id}` | Detail (with timeline) / update / delete |
| `GET /api/deals/{id}/delete-impact` | Counts |
| `POST /api/deals/{id}/move` | Body `{stage, index}`: put the deal at `index` in the `stage` column. The server renumbers that column (and the old one) in one transaction. Returns the updated deal. |
| `POST /api/activities` | Create (the deal's contact is added on the server) |
| `PATCH/DELETE /api/activities/{id}` | Update / delete (refused for stage changes) |
| `GET /api/dashboard` | Every dashboard figure in one response |

Lists are small (tens to hundreds of rows), so the frontend fetches whole lists and searches and sorts them in the browser. Late flags and expected revenue are worked out on the server, so the rules live in one place.

## 3.4 Frontend data flow

- TanStack Query caches each list, record and the dashboard. Any change invalidates the queries it affects (for example, moving a deal invalidates deals, the pipeline, that deal, its organization, its contact and the dashboard). That's how R-DASH-7 holds.
- Pipeline moves update the cache straight away and undo themselves if the server fails (R-PIPE-5).
- The usual probabilities are fetched from `/api/stages`, so the backend is the single source of truth.

## 3.5 Tests

- **Backend (pytest)**: stage and probability rules, close date on Won or Lost, stage-change entries, the delete rules (each case in R-DEL-1 to R-DEL-3), moving and renumbering, dashboard figures against known data, and seed counts and ranges. Uses a temporary database.
- **Frontend (Vitest + Testing Library)**: money and date formatting, late and expected-revenue display, table search and sort, form validation, the delete-confirmation wording.
- **End to end (Playwright, installed Chrome)**: one test per success criterion in the intent, against a fresh seeded test database on separate ports. Each test fails if the browser console shows an error.
