# Plan: building the Accountable MVP

This plan turns `docs/spec.md` into the order of work. It names the files that change, the phases to build them in, the risks, and the tests that prove each phase. Requirement IDs (R-…) refer to the spec. Where the plan and the spec disagree, the spec wins, and this plan should be fixed.

Open concerns 5 to 10 in the spec are built with the default the spec gives. Changing one later is a small change if it's decided before phase 2 ends.

## 1. Files that change

### New files

```
accountable/
├── package.json              # scripts: dev, seed, test (+ test:front, test:back, test:e2e); workspaces: ["frontend"]
├── package-lock.json
├── pyproject.toml, uv.lock   # Python 3.12, FastAPI, Uvicorn, SQLAlchemy, Pydantic; dev: pytest, httpx
├── .python-version           # 3.12, so uv picks the right Python
├── backend/
│   ├── __init__.py
│   ├── app/
│   │   ├── __init__.py
│   │   ├── main.py           # FastAPI app, routers, startup: create tables + seed if the file is new
│   │   ├── config.py         # database path (ACCOUNTABLE_DB, default data/accountable.db) and today()
│   │   ├── db.py             # engine, foreign keys pragma, metadata, the four tables
│   │   ├── stages.py         # stage list, usual probabilities, open/closed, order
│   │   ├── schemas.py        # Pydantic request and response models
│   │   ├── seed.py           # sample data; run with `python -m backend.app.seed`
│   │   ├── routers/
│   │   │   ├── stages.py, organizations.py, contacts.py, deals.py, activities.py, dashboard.py
│   │   └── services/
│   │       ├── deals.py      # create, update, stage changes, move and renumber
│   │       ├── deleting.py   # delete rules and delete-impact counts
│   │       ├── timelines.py  # deal, contact and combined organization timelines
│   │       └── dashboard.py  # tiles, months, funnel, follow-ups, recent activity
│   └── tests/
│       ├── conftest.py       # temporary database per test, test client, fixed "today"
│       ├── test_stages.py, test_deals.py, test_move.py, test_deleting.py,
│       ├── test_activities.py, test_timelines.py, test_dashboard.py,
│       ├── test_seed.py, test_api.py
├── frontend/
│   ├── package.json          # React, Vite, TS, and the libraries in spec 3.1; dev: Vitest, Testing Library, jsdom
│   ├── index.html, vite.config.ts (proxy /api → backend), tsconfig.json, vitest.config.ts
│   └── src/
│       ├── main.tsx, App.tsx # routes, Query client, Toaster
│       ├── styles/           # tokens.css (spec 4.2), global.css, fonts.ts (Fontsource imports)
│       ├── api/              # client.ts (typed fetch), types.ts, hooks per record, query keys
│       ├── lib/              # format.ts (money, dates, relative), stages.ts, search.ts
│       ├── components/       # AppShell, Sidebar, PageHeader, Panel, Button, Tag, StageDot,
│       │                     # Dialog, ConfirmDelete, FormField, Select, DataTable, SearchBox,
│       │                     # Timeline, FollowUpItem, EmptyState, FigureTile
│       └── features/
│           ├── organizations/ # table page, record page, form
│           ├── contacts/      # table page with status filter, record page, form
│           ├── deals/         # table page, record page with stage selector, form
│           ├── activities/    # log/edit activity form
│           ├── pipeline/      # Board, Column, Card, useMoveDeal (optimistic)
│           └── dashboard/     # tiles, RevenueLine, WonLostBars, Funnel, OpenStack, FollowUps, RecentActivity
│       (unit tests sit next to the files they test, as *.test.ts(x))
├── e2e/
│   ├── playwright.config.ts  # installed Chrome; starts backend :8001 + frontend :5174 with a test database
│   ├── fixtures.ts           # reseed before each test; fail on any console error or warning
│   └── *.spec.ts             # see Proof
└── data/                     # created on first start; accountable.db is git-ignored
```

### Changed files

- `docs/STATUS.md`: prerequisites (Node 24+, uv, Google Chrome for tests), the one-time `npm install`, then how to run, reset and test. Updated at the end of every phase.
- `docs/spec.md`: only if building finds a mistake in it, with the concern list updated to match.
- `.gitignore`: already ignores `*.db`, `node_modules/`, `.venv/` and Playwright output. No change is expected.

### Not touched

`README.md` (the course's guide), `course/`, `docs/intent.md`, `docs/TECH_STACK.md`. The files in `docs/mockups/` stay as the visual reference.

## 2. Order of work

Each phase ends with its tests passing and `docs/STATUS.md` updated. The backend comes first so the rules are proven before any screen depends on them.

### Phase 0: Prerequisites and skeleton

1. Install Node 24 or later. It isn't installed on this machine yet (see Risks). uv is installed and fetches Python 3.12 on first use.
2. Root `package.json` with the workspace and the `dev`, `seed` and `test` scripts, using `concurrently` for `dev`. No shell-specific syntax (R-RUN-6).
3. `pyproject.toml` and `uv.lock`. A FastAPI app with only `GET /api/stages`.
4. A Vite + React + TS app in `frontend/` that fetches `/api/stages` through the proxy and shows the stage names.
5. Playwright config that starts both servers on test ports with `ACCOUNTABLE_DB` pointing to a test file, and one smoke test.
6. `npm test` runs Vitest, pytest and Playwright one after another, and stops on the first failure.

Done when `npm run dev` shows the stage list in the browser and `npm test` passes with one test of each kind.

### Phase 1: Data model and rules (backend)

1. `config.py`, `db.py` (tables from spec 3.2, foreign keys on for every connection), `stages.py`, `schemas.py`.
2. Organizations, contacts, deals and activities: list, detail, create, update (R-DATA-1 to R-DATA-11).
3. Stage changes in one place (`services/deals.py`): probability rule, close date on Won or Lost, stage-change entry. Used by the edit, the stage selector and the move.
4. `POST /api/deals/{id}/move` with renumbering of both columns in one transaction (R-PIPE-4). New deals go to the top of their column (R-PIPE-6).
5. Delete rules and delete-impact counts in `services/deleting.py`, each in one transaction (R-DEL-1 to R-DEL-5).
6. Timelines: deal, contact, and the combined organization timeline (R-REC-1 to R-REC-4).
7. Late flag and expected revenue worked out on the server (R-DATA-5, R-DATA-6).

### Phase 2: Sample data and dashboard figures (backend)

1. `seed.py`: fixed lists, a fixed random seed, dates relative to the day it runs, stage history for won and lost deals (R-SEED-1 to R-SEED-5). It empties the tables and refills them in one transaction, rather than deleting the file, so it works while the app is running.
2. First start creates the database and seeds it (R-RUN-3). `npm run seed` resets it (R-RUN-2).
3. `GET /api/dashboard`: the four tiles, 12 months of revenue won and deals won and lost, the funnel from stage history, the open pipeline by stage, follow-ups (overdue, then the next 7 days) and the 10 newest activities (R-DASH-1 to R-DASH-6).

At the end of this phase the whole API is done and proven by pytest.

### Phase 3: Frontend foundation

1. `tokens.css` and `global.css` from spec 4.2, Fontsource fonts with system fallbacks, Lucide icons.
2. App shell: sidebar with the five sections, active pill, page header, routes for every page (empty for now).
3. API client, query keys and the invalidation map (spec 3.4), so later phases only add hooks.
4. Shared components: Button, Tag, StageDot, Panel, Dialog (focus trap, Escape), FormField, Select, ConfirmDelete, DataTable (TanStack Table with search and sort), Timeline, EmptyState, toasts.
5. `lib/format.ts`: money, short money, dates, date and time, relative follow-up wording.

### Phase 4: Tables, record pages, forms and activities

1. Organizations, Contacts and Deals tables with search, sort, default sort, empty states and row actions (R-TBL-1 to R-TBL-6). Contacts get the status filter with counts.
2. Forms with React Hook Form and Zod, errors next to fields (R-Q-3). The deal form follows R-DATA-2 (stage change resets probability unless it's set in the same save) and filters contacts by organization.
3. Delete confirmations with the exact wording and counts from delete-impact (R-DEL-4).
4. Record pages for organization, contact and deal, with linked records and timelines. "None" for missing links (R-REC-5). Stage selector on the deal page.
5. Log activity and edit activity forms, follow-up date and done checkbox, delete with confirmation. Stage-change entries have no actions (R-ACT-1 to R-ACT-3).

### Phase 5: Pipeline

1. Six columns with stage tint, header counts and totals, board totals in the page header (R-PIPE-1, R-PIPE-2).
2. Cards with the late tag and tint (R-PIPE-3). Click opens the deal (R-PIPE-8).
3. dnd-kit with pointer and keyboard sensors, drop slot outline, lifted card (R-PIPE-4, R-PIPE-9).
4. Optimistic move: update the cache and totals on drop, call `/move`, undo with a toast if it fails, then invalidate the affected queries (R-PIPE-5).
5. "+" on each column opens the deal form with the stage set (R-PIPE-6). Won and Lost scroll on their own (R-PIPE-7).

### Phase 6: Dashboard

1. Figure tiles with context lines and full amounts in tooltips (R-DASH-1).
2. Recharts line chart with area fill and tooltip, and the won and lost bar chart (R-DASH-2, R-DASH-3).
3. Funnel bars and the stacked open-pipeline bar (R-DASH-4).
4. Follow-ups panel with done checkboxes, and recent activity (R-DASH-5, R-DASH-6).
5. Layout on the 12-column grid from spec 4.5, matched against `docs/mockups/prototype.html`.

### Phase 7: End-to-end proof and hand-over

1. Write the end-to-end tests listed in Proof, one file per success criterion.
2. Keyboard and focus pass (R-Q-5), widths of 1280px and up (R-Q-4), contrast check of the `*-ink` shades.
3. Use the whole app by hand in Chrome with the console open: every section and every action (success criterion 8). Fix what's found.
4. Final `docs/STATUS.md`: install, run, reset, test, and what was checked by hand.

## 3. Risks

| Risk | Effect | What we do |
|---|---|---|
| Node isn't installed on this machine, and Python 3.12 isn't either. | Nothing on the frontend can be built or tested. | Install Node 24+ first (phase 0). uv downloads Python 3.12 itself, once, with internet. `STATUS.md` lists both. |
| Playwright needs the installed Google Chrome (spec concern 10). | `npm test` fails on a machine without Chrome. | Chrome is installed here. Use `channel: "chrome"` and say so in `STATUS.md`. |
| The first `npm install` and `uv sync` need internet (R-RUN-5 only covers use after that). | A fresh clone can't start offline. | Documented in `STATUS.md`. Fonts and icons are bundled, so nothing is fetched at run time. A test checks that the page makes no requests outside localhost. |
| Tests touching the user's own data. | Running tests wipes real changes. | Tests only ever use `ACCOUNTABLE_DB` set to a temporary or test file. pytest uses a fresh temporary file per test. The test servers run on separate ports. |
| Drag and drop across columns with dnd-kit is fiddly: the drop index, the rollback, and Won and Lost columns that scroll. | Cards land in the wrong place or jump back. | The server owns the order (`/move` with an index). One hook does the optimistic update and rollback. End-to-end tests drag with the mouse in steps and with the keyboard, then refresh and check the order. |
| Mouse drags in Playwright don't trigger dnd-kit's pointer sensor if the move is a single jump. | Flaky end-to-end tests. | Move the mouse in several steps past the activation distance. Use the keyboard path as a second check. |
| "Today" and month boundaries. | Tests that pass today fail at the end of a month, or in another time zone. | `config.today()` is the one source of today, and tests set it to a fixed date. Seed dates are relative to it. Dashboard tests use fixed data for a fixed month. |
| SQLite foreign keys are off by default for each connection. | ON DELETE SET NULL silently does nothing. | Turn them on in a connection event in `db.py`. A delete-rules test fails if they're off. |
| Running `npm run seed` while the app is running, especially on Windows where open files can't be deleted. | Reset fails or the app breaks. | Seed empties and refills the tables in one transaction and never deletes the file. A test seeds while the test server is running. |
| Console warnings from libraries, such as Recharts sizing warnings or React key warnings. | Breaks R-Q-1, and every end-to-end test fails on console output. | Give charts fixed heights inside sized containers. The fixture fails on any warning, so these are caught early. |
| The probability rule has an edge case: an edit that changes the stage and sets a probability in the same save. | The hand-set probability is lost, or a stale one is kept. | One service function handles it. Tests cover all three cases: stage only, probability only, both. |
| The funnel from stage history (spec concern 9) is easy to get wrong. | Funnel figures don't match the data (success criterion 6). | Tests with small hand-made histories: a deal created at Proposal, a deal lost at Qualified, a deal moved back and forward. |
| "Sharp and visually stunning" (success criterion 7) can't be proven by tests. | Looks fine in tests but not to the user. | Match the prototype and spec 4.5, compare screenshots by eye at 1280px and 1440px, and do the hand-check in phase 7. |
| Scope creep from the prototype, which has extras that aren't in the spec. | Time spent on things that weren't asked for. | The spec is the checklist. Anything else goes in `STATUS.md` as a later idea. |

## 4. Proof

`npm test` runs all three kinds of test and fails if any test fails. Each test names the requirement it proves.

### 4.1 Backend unit tests (pytest)

| File | Proves |
|---|---|
| `test_stages.py` | Stage order, usual probabilities, open and closed stages. `GET /api/stages` returns them. |
| `test_deals.py` | A new deal takes its stage's probability unless one is given (R-DATA-1). A stage change resets the probability, a hand-set probability survives an edit that doesn't change the stage, and both together keep the given probability (R-DATA-2). Won and Lost set the close date to today, and moving back keeps it (R-DATA-3). Late only when open and the close date is before today (R-DATA-5). Expected revenue (R-DATA-6). Value and probability limits rejected with 422 (R-DATA-7). Required fields and email format (R-DATA-9). |
| `test_move.py` | Moving to another column puts the deal at the index and renumbers both columns with no gaps or repeats. Moving within a column, to the top, the bottom and the middle. An index past the end goes last. A move to the same stage creates no stage-change entry. A move to another stage creates one (R-DATA-4, R-PIPE-4). A new deal goes to the top (R-PIPE-6). |
| `test_activities.py` | An activity needs a contact or a deal (R-DATA-10). Logging on a deal adds its contact. Changing the deal's contact later doesn't move old activities. Follow-ups start not done and can be marked done (R-DATA-11, R-ACT-2). Stage-change entries can't be edited or deleted (R-DEL-5). |
| `test_deleting.py` | Each delete case: organization keeps contacts and deals with no organization (R-DEL-1). Contact keeps deals with no contact (R-DEL-2). Activities linked only to the deleted record go, and ones linked to both stay with the other link. An activity linked to both goes when the second one is deleted. Stage-change entries go with their deal (R-DEL-3). Delete-impact counts match what then happens (R-DEL-4). |
| `test_timelines.py` | Newest first. The organization timeline combines its contacts' and deals' activities with no repeats (R-REC-1, R-REC-4). |
| `test_dashboard.py` | Against fixed data and a fixed today: the four tiles, including won this month and the change from last month, and win rate over 12 months (R-DASH-1). Revenue and counts by month, with a deal counted in its close-date month (R-DASH-2, R-DASH-3). Funnel cases from stage history (R-DASH-4). Follow-ups: overdue first, then the next 7 days, done ones hidden, later ones hidden (R-DASH-5). The 10 newest activities, including stage changes (R-DASH-6). |
| `test_seed.py` | Counts and ranges from R-SEED-1. Every stage has deals, at least 3 late, at least 3 overdue follow-ups and 3 due this week. Every won and lost deal has stage history. Two runs give the same data. Dates move with today (R-SEED-2 to R-SEED-5). Seeding a database that already has data replaces it (R-RUN-2). |
| `test_api.py` | A new database file is created and seeded on first start (R-RUN-3). 404 for missing records, and `{"detail": ...}` errors with 400, 404 and 422. |

### 4.2 Frontend unit tests (Vitest and Testing Library)

| Test | Proves |
|---|---|
| `lib/format.test.ts` | `$12,500`, short money (`$1.2M`), `Mar 4, 2026`, `Mar 4, 2026, 2:15 PM`, "in 3 days", "Today", "5 days overdue". |
| `lib/search.test.ts` | Search matches any visible column and ignores case (R-TBL-1). |
| `components/DataTable.test.tsx` | Clicking a heading sorts, clicking again reverses, and the arrow shows. Default sort. The empty message names the search (R-TBL-2, R-TBL-5, R-TBL-6). |
| `components/ConfirmDelete.test.tsx` | The exact wording with counts and plurals for organizations, contacts and deals (R-DEL-4). Escape closes it, and focus stays inside (R-Q-5). |
| `features/deals/DealForm.test.tsx` | Required field errors in plain words (R-Q-3). Changing the stage fills in its usual probability. Setting both keeps the given probability. Choosing an organization filters the contacts. |
| `features/contacts/ContactsPage.test.tsx` | The status filter shows counts and filters the table. |
| `features/activities/ActivityForm.test.tsx` | Defaults to now. The follow-up date is optional. From a contact, the deal picker lists only that contact's deals (R-ACT-1). |
| `features/pipeline/useMoveDeal.test.ts` | The optimistic update moves the card and changes the column and board totals at once. A failed request puts it back and shows the message (R-PIPE-5). |
| `components/Tag.test.tsx`, `features/deals/LateTag.test.tsx` | Late and overdue tags appear only when they should (R-PIPE-3, R-REC-4). |

### 4.3 End-to-end tests (Playwright, installed Chrome)

Each test starts from freshly seeded test data and fails if the browser console shows any error or warning (R-Q-1). One file per success criterion in the intent:

| File | Success criterion | What it does |
|---|---|---|
| `01-start.spec.ts` | 1 | Opens the app root and lands on the dashboard with figures. Visits every section and finds sample data on each. Checks that no request goes outside localhost (R-RUN-5). |
| `02-records.spec.ts` | 2 | For organizations, contacts (lead, qualified, customer) and deals: adds one, finds it by search, sorts by a column, edits it, then reloads and checks the edit. Restarts the backend and checks again. Deletes each one, checks the confirmation wording, and checks that linked records are kept or deleted as the intent says. Runs the seed command and checks the sample data is back. |
| `03-links.spec.ts` | 3 | Filters contacts by each status. Opens an organization and checks its contacts, deals and combined timeline. Opens a contact and a deal and checks their links. |
| `04-pipeline.spec.ts` | 4 | Drags a card to another column with the mouse: the stage and probability change, the column and board totals change before the server replies, and the deals table shows the new stage and probability. Drops one on Won and checks the close date is today. Moves a card up and down within its column, reloads, and checks the order. Moves a card with the keyboard. Adds a deal with a column's "+", and checks it's at the top at that stage. Checks late cards show the tag. Makes the server fail a move and checks the card goes back with a message. |
| `05-activities.spec.ts` | 5 | Logs a note on a contact and a call with a follow-up on a deal. Both show newest first, and the deal's appears on its contact's timeline too. Moves the deal and checks the "Moved from … to …" entry. Checks the follow-up on the dashboard, marks it done there, and checks it's gone and ticked in the timeline. Edits and deletes an activity. |
| `06-dashboard.spec.ts` | 6 | Reads the tiles, then marks an open deal Won and checks that the open pipeline, won this month and win rate changed by the right amounts. Adds a follow-up due tomorrow and checks it appears without a manual refresh. |
| `07-look.spec.ts` | 7 | Checks the line chart, bar chart, funnel and pipeline stack render. Checks the brand fonts loaded and the sidebar and stage colors match the tokens. Saves screenshots of every screen at 1280px and 1440px for the review by eye. Checks nothing overflows at 1280px (R-Q-4). |

Success criterion 8 can't be automated. Before the MVP is called done, someone uses every section and action by hand in Chrome with the console open, checks each screen by eye against the screenshots from `07-look.spec.ts`, and records the result in `docs/STATUS.md`.
