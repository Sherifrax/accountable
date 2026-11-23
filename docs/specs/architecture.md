# 3. Architecture

```
accountable/
├── package.json            # npm scripts; workspaces: ["frontend"]
├── pyproject.toml, uv.lock # Python project (backend)
├── render.yaml             # the one Render web service (no secret values)
├── .env                    # DATABASE_URL, SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY (git-ignored)
├── backend/
│   ├── app/
│   │   ├── main.py         # FastAPI app, routers, startup (migrate, seed if empty), serves frontend/dist
│   │   ├── config.py       # settings from the environment, test mode
│   │   ├── auth.py         # token check, current user, test-mode tokens
│   │   ├── db.py           # engine (Postgres or SQLite), metadata, tables (SQLAlchemy Core)
│   │   ├── schemas.py      # Pydantic models for requests and responses
│   │   ├── stages.py       # stage list, probabilities, helpers
│   │   ├── routers/        # organizations, contacts, deals, activities, dashboard, search
│   │   ├── services/       # business rules: deleting, stage changes, ordering
│   │   └── seed.py         # sample data; `python -m backend.app.seed`
│   ├── migrations/         # versioned schema changes, applied on start
│   └── tests/              # pytest
├── frontend/
│   ├── src/
│   │   ├── auth/           # Supabase client, session, sign-in screen, test-mode sign-in
│   │   ├── api/            # typed fetch client (adds the token) + TanStack Query hooks
│   │   ├── components/     # shared UI: Button, Dialog, DataTable, Tag, Timeline…
│   │   ├── features/       # dashboard, organizations, contacts, deals, pipeline, search, user menu
│   │   ├── styles/         # tokens.css (light and dark), global.css
│   │   └── main.tsx, App.tsx (routes)
│   └── vite.config.ts      # proxies /api to :8000; reads .env from the repo root
├── e2e/                    # Playwright tests + playwright.config.ts
└── data/                   # old local SQLite file (git-ignored, no longer used by the app)
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
| Dialogs, dropdown menu, selects, checkbox | Radix UI primitives |
| Sign-in and session in the browser | Supabase JS client (`@supabase/supabase-js`) |
| Toast messages | Sonner |
| Icons | Lucide |
| Dates | date-fns |
| Fonts (offline) | Fontsource packages |
| Running both servers | concurrently |
| Backend | FastAPI, Uvicorn, SQLAlchemy Core, Pydantic |
| Postgres driver, token check, migrations | One library each, named and justified in the plan (see Concern 16) |

Styling is plain CSS with CSS variables (`tokens.css`) and CSS Modules per component. No UI kit theme to override.

## 3.2 Data model (Postgres on Supabase, SQLite in tests, SQLAlchemy Core)

The tables are the same on both, written once with SQLAlchemy Core and only database-neutral types, with no raw SQL. On SQLite, foreign keys are turned on (`PRAGMA foreign_keys = ON`). Timestamps are UTC with no zone stored (SQLAlchemy `DateTime`), and the API sends them as ISO 8601 with a `Z`. Dates are `YYYY-MM-DD`.

Every table also has `created_by` and `updated_by`: text, the user's email, null for sample data (R-AUTH-13 to R-AUTH-15). They are set only by the backend from the verified token.

**organizations**: `id` PK, `name` text not null, `website` text, `industry` text, `notes` text, `created_at`, `updated_at`.

**contacts**: `id` PK, `name` text not null, `email`, `phone`, `job_title`, `organization_id` FK → organizations ON DELETE SET NULL, `status` text not null (`lead` | `qualified` | `customer`), `created_at`, `updated_at`.

**deals**: `id` PK, `name` text not null, `organization_id` FK ON DELETE SET NULL, `contact_id` FK → contacts ON DELETE SET NULL, `stage` text not null, `value` integer not null ≥ 0, `probability` integer not null 0–100, `close_date` date, `position` integer not null (order within its stage column, 0 = top), `created_at`, `updated_at`.

**activities**: `id` PK, `type` text not null (`note` | `call` | `email` | `stage_change`), `contact_id` FK ON DELETE SET NULL, `deal_id` FK ON DELETE SET NULL, `description` text not null, `occurred_at` timestamp not null, `follow_up_date` date, `done` boolean not null default false, `from_stage`, `to_stage` (stage changes only), `created_at`, `updated_at`.

**Migrations.** The schema is created and changed by versioned migrations in `backend/migrations/`, applied when the app starts (R-DEP-3) and safe to run twice. The first migration builds the whole schema above. Unit tests build their SQLite schema straight from the table definitions for speed, and one test checks that running the migrations on an empty SQLite database gives the same tables and columns, so the two can't drift apart.

The rule in R-DEL-3 runs in the service layer inside one transaction. It deletes the activities that would be left with neither link, and stage changes for a deleted deal, before the record itself. The SET NULL foreign keys handle the rest.

## 3.3 API

JSON over `/api`. Errors return `{"detail": "..."}` with 400, 401, 404 or 422. Every route needs a valid token (R-AUTH-5), except `GET /healthz`, which sits outside `/api`. Records in responses include `created_by`, `updated_by`, `created_at` and `updated_at`, and requests can't set them.

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
| `GET /api/search?q=` | Up to 5 organizations, 5 contacts and 5 deals whose name contains `q`, ignoring case (R-SRCH-3), each with its second line |
| `POST /api/test/session` | Test mode only: body `{email, password}` with the fixed test password; returns a test-key token (R-AUTH-11). Answers 404 outside test mode. |
| `GET /healthz` | No token, no data: 200 for Render's health check |

Lists are small (tens to hundreds of rows), so the frontend fetches whole lists and searches and sorts them in the browser. The top bar's search is the exception: it asks the backend (R-SRCH-9). Late flags and expected revenue are worked out on the server, so the rules live in one place.

## 3.4 Frontend data flow

- The Supabase client keeps the session in the browser and renews it. The API client adds the access token to every request. A 401 answer clears the cache and shows the sign-in screen (R-AUTH-8).
- `SUPABASE_URL` and `SUPABASE_PUBLISHABLE_KEY` reach the browser when the frontend is built or started, read from the `.env` at the repo root. Only those two names are exposed to the browser, so `DATABASE_URL` can't leak into the bundle.
- The theme is a `data-theme` value on the page's root (`light` or `dark`), set from the remembered choice and the device's setting before first paint (R-MENU-7). `tokens.css` defines both sets of values.

- TanStack Query caches each list, record and the dashboard. Any change invalidates the queries it affects (for example, moving a deal invalidates deals, the pipeline, that deal, its organization, its contact and the dashboard). That's how R-DASH-7 holds.
- Pipeline moves update the cache straight away and undo themselves if the server fails (R-PIPE-5).
- The usual probabilities are fetched from `/api/stages`, so the backend is the single source of truth.

## 3.5 Tests

- **Backend (pytest)**: stage and probability rules, close date on Won or Lost, stage-change entries, the delete rules (each case in R-DEL-1 to R-DEL-3), moving and renumbering, dashboard figures against known data, and seed counts and ranges. Uses a temporary database. New: every `/api` route refuses with 401 when signed out, with a bad token and with an expired one; token checks for signature, issuer, audience and expiry, using a locally made test key and no network; the user is taken from the token and ignored in the body; added by and last changed by on every kind of record, including stage changes and moves; sample data shows no user; search by part of a name in any case, with accents, with `%` and `_` typed in the text, and the limit of 5; migrations match the table definitions; test mode refuses to start against a non-SQLite database; the seed refuses a Postgres database that has records unless forced.
- **Frontend (Vitest + Testing Library)**: money and date formatting, late and expected-revenue display, table search and sort, form validation, the delete-confirmation wording. New: initials from an email, the sign-in screen's messages, the "Sample data" label, theme choice and System following the device (with a fake device setting), and the search panel's keyboard use.
- **End to end (Playwright, installed Chrome)**: one test per success criterion in each intent (`docs/intent.md` and `docs/changes/multi-user/intent.md`), against a fresh seeded test database on separate ports, signed in through the test sign-in (R-AUTH-11). Each test fails if the browser console shows an error, and if the browser makes any request to Supabase.
- **Speed**: every unit test runs in under a second (R-Q-6). The end-to-end tests are outside that rule.
- **Not tested**: signing in against the real Supabase and the real Render service. Success criterion 6 of the multi-user intent is checked by hand and recorded in `docs/STATUS.md`.
