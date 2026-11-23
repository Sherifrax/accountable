# Plan: sign-in, search and a user menu

This plan builds `docs/changes/multi-user/intent.md` as `docs/spec.md` and the area files in `docs/specs/` now describe it. Requirement IDs (R-…) refer to those files. Where the plan and the spec disagree, the spec wins, and this plan should be fixed. No code is written in this step.

The work is in four phases: sign-in and the database, then search, then the user menu, then Render. The intent has no phase for Render, but it asks for it, and it fits last because it needs the other three. After every phase `npm run check` passes with no Supabase settings in `.env`.

The spec's open concerns 11 to 22 are built with the defaults the spec gives, except where Risks below says the plan checks one first.

## 1. Files that change

The files are grouped into parts. **Every file belongs to exactly one part**, so each part can be built by a different agent without two of them editing the same file. A part can be built in any order against the contracts in "How the parts meet" below, and the phase column says when it's worked on. Existing files that are not listed here don't change.

### How the parts meet

These are the only agreements between parts. Each part builds to them without reading the other part's files.

- **API contract.** Every `/api` request carries `Authorization: Bearer <token>`. A missing, bad or expired token gets 401 with `{"detail": "Sign in to continue."}`. Records and activities in responses gain `created_by`, `updated_by` (a string, or null for sample data), and timestamps in UTC with a `Z`. Test mode has `POST /api/test/session`. Search is `GET /api/search?q=`, answering `{organizations: [...], contacts: [...], deals: [...]}`, each item `{id, name, detail}`, with `detail` the muted second line.
- **Routers find themselves.** `main.py` includes every module in `backend/app/routers/` that has a `router`, behind the token check. A new router needs no edit to `main.py`, and a router can't be left unprotected. A test walks the app's routes to prove it.
- **Top bar items find themselves.** `TopBar.tsx` renders every `frontend/src/features/*/topbar.tsx`, found with `import.meta.glob`. Each exports a component and `slot` (`"start"` or `"end"`). Search and the user menu each add one file and edit no shared file.
- **Settings.** `ACCOUNTABLE_DB` (a SQLite path) is how the tests choose their database. `ACCOUNTABLE_TEST_AUTH=1` is test mode. `DATABASE_URL`, `SUPABASE_URL` and `SUPABASE_PUBLISHABLE_KEY` are the real settings.

### Part A: Setup and checks (phase 1, a little in phase 4)

Owns every manifest and script, so no other part edits a dependency list.

| File | Change |
|---|---|
| `package.json` | New scripts `build` (builds the frontend) and `start` (runs `backend.app.serve` with `.env`); `dev` and `seed` read `.env` through `uv run --env-file`. The test scripts don't. |
| `package-lock.json`, `frontend/package.json` | Add `@supabase/supabase-js` and `@radix-ui/react-dropdown-menu` |
| `pyproject.toml`, `uv.lock` | Add `psycopg[binary]`, `PyJWT[crypto]` and `alembic` |
| `.env.example` | New: the three settings, with no values |
| `scripts/checks.mjs` | New speed step: run the unit tests with timings and fail if any takes a second or more. It's in `npm run check` and not in `check:quick`, so the slow CI machine never runs it (R-Q-6). |
| `scripts/test-speed.mjs` | New: reads the timings from pytest and Vitest and reports the slowest |
| `lefthook.yml`, `.github/workflows/ci.yml` | Not changed. CI keeps running `check:quick`, with no secrets (R-DEP-9). |

Why each new dependency is worth it (Concern 16):

- `@supabase/supabase-js`: sign-in, keeping and renewing the session, and signing out in every open tab (R-AUTH-8, R-AUTH-9). Doing it by hand means writing against Supabase's token endpoints and getting renewal and cross-tab sign-out right.
- `PyJWT[crypto]`: checking the signature of Supabase's tokens against its public keys (R-AUTH-6). Writing signature checks by hand is the one place to avoid it. It also signs the test-mode tokens.
- `psycopg[binary]`: the driver SQLAlchemy needs for Postgres. There is no choice here. SQLAlchemy has no driver of its own.
- `alembic`: versioned migrations that run on start (R-DEP-3). A small runner of our own would work for one migration, but it would have to be written, tested and kept right through every later change, and Alembic is the standard tool for SQLAlchemy.
- `@radix-ui/react-dropdown-menu`: a menu with arrow keys, Escape, focus return and radio rows (R-MENU-1, R-Q-5). Radix is already the project's choice for dialogs and tooltips.

Nothing else is added. The dev dependencies stay as they are.

### Part B: Database (phase 1)

| File | Change |
|---|---|
| `backend/app/config.py` | Read `DATABASE_URL`, `SUPABASE_URL`, `SUPABASE_PUBLISHABLE_KEY`, `ACCOUNTABLE_DB` and `ACCOUNTABLE_TEST_AUTH`; say which setting is missing (R-AUTH-12); `now()` returns UTC (R-DATA-12); `today()` still follows the fixed test date |
| `backend/app/db.py` | `make_engine` takes a SQLite path as before or a Postgres URL; `created_by` and `updated_by` text columns on the four tables; timestamps as `DateTime`; foreign-key pragma only on SQLite |
| `backend/migrations/` (new: `env.py`, `versions/0001_initial.py`), `alembic.ini` | The first migration builds the whole schema, safe to run twice (R-DEP-3) |
| `backend/app/seed.py` | Sample rows get no user (R-SEED-6); empty-database check for first start (R-RUN-3); `--force` and the host warning on Postgres (R-RUN-2, Concern 11); dates still worked out from today |
| `backend/app/serve.py` | New: runs the migrations, loads the sample data if the database is empty, then starts Uvicorn on `PORT`. It's what `npm start` and Render run (R-RUN-7, R-DEP-3). |
| `backend/tests/test_migrations.py` | New |
| `backend/tests/test_config.py` | New |
| `backend/tests/test_seed.py` | Changed for the new columns, the empty-database check and `--force` |

### Part C: Auth and attribution, backend (phase 1)

Built after Part B's `db.py` and `config.py` exist.

| File | Change |
|---|---|
| `backend/app/auth.py` | New: checks the token (signature from Supabase's public keys kept in memory, expiry, issuer, audience, email present), the current-user dependency, test-mode tokens and `POST /api/test/session`, and the start-up guards for test mode (R-AUTH-5 to R-AUTH-7, R-AUTH-11) |
| `backend/app/frontend.py` | New: `GET /healthz`, and serving `frontend/dist` with `index.html` for any other non-`/api` path, and 404 JSON for an unknown `/api` path (R-DEP-4, R-DEP-5). Does nothing if `dist` doesn't exist. |
| `backend/app/main.py` | Finds the routers and puts the token check on each; includes the test-session router only in test mode; calls `frontend.py`; start-up runs the migrations and the first-start seed through Part B's functions |
| `backend/app/schemas.py` | `created_by`, `updated_by`, `created_at`, `updated_at` on the response models; request models take no user fields |
| `backend/app/routers/organizations.py`, `contacts.py`, `deals.py`, `activities.py` | Pass the current user to the services |
| `backend/app/routers/deps.py`, `dashboard.py`, `stages.py` | Only if the user dependency needs a change; no behavior change |
| `backend/app/services/common.py` | `stamp()` and the date helpers in UTC; a small helper that sets `created_by` / `updated_by` |
| `backend/app/services/records.py`, `deals.py`, `deleting.py`, `timelines.py`, `dashboard.py` | Record who added and changed (R-AUTH-13, R-AUTH-14), including stage-change entries and moves; timelines carry the user; renumbering other deals doesn't change them |
| `backend/tests/conftest.py` | The `client` fixture runs in test mode and signs every request with a test token, so the existing tests keep passing without edits. A second `anonymous_client` fixture sends no token. |
| `backend/tests/test_auth.py`, `test_attribution.py`, `test_frontend_serving.py` | New |
| `backend/tests/test_api.py`, `test_activities.py`, `test_deals.py`, `test_move.py`, `test_deleting.py`, `test_timelines.py`, `test_dashboard.py`, `test_stages.py` | Changed only where one asserts a whole response and the new fields break it |

### Part D: Sign-in and shell, frontend (phase 1)

| File | Change |
|---|---|
| `frontend/vite.config.ts` | Read `.env` from the repo root; expose only `SUPABASE_URL` and `SUPABASE_PUBLISHABLE_KEY` to the browser (Concern 14); define the test-mode flag; `npm run build` fails if test mode is on |
| `frontend/src/auth/` (new: `AuthProvider.tsx`, `SignInPage.tsx`, `supabase.ts`, `testSession.ts`, `auth.css`, `AuthProvider.test.tsx`, `SignInPage.test.tsx`) | The session, the sign-in screen and its messages, the spinner while a saved session is checked, sign-out everywhere, the 401 handling, and the test-mode sign-in against `/api/test/session` (R-AUTH-1 to R-AUTH-3, R-AUTH-8 to R-AUTH-11) |
| `frontend/src/api/client.ts` | Adds the token; a 401 clears the cache and signs out |
| `frontend/src/api/types.ts` | `created_by`, `updated_by` on the record types |
| `frontend/src/main.tsx`, `frontend/src/App.tsx` | Wrap in the auth provider; signed out shows only the sign-in screen; return to the page that was asked for |
| `frontend/src/components/AppShell.tsx` | Adds the top bar above the page |
| `frontend/src/components/TopBar.tsx`, `topbar.css` | New: finds the `features/*/topbar.tsx` files and lays them out (R-SRCH-1, R-MENU-1) |
| `frontend/src/components/AddedBy.tsx`, `AddedBy.test.tsx` | New: "Added by … on …" and "Last changed by … on …", with "Sample data" (R-AUTH-15, R-AUTH-17) |
| `frontend/src/components/Timeline.tsx` | "by name@example.com" on each entry's muted line |
| `frontend/src/features/organizations/OrganizationPage.tsx`, `contacts/ContactPage.tsx`, `deals/DealPage.tsx` | Add `AddedBy` to the details panel |
| `frontend/src/lib/format.ts`, `format.test.ts` | Timestamps arrive in UTC and are shown in the viewer's time zone (R-DATA-12); dates without a time are untouched |
| `e2e/playwright.config.ts` | Test mode and an empty `DATABASE_URL`, `SUPABASE_URL` and key on both servers, so `.env` can't leak in; `colorScheme: "light"` so every old test stays in the light theme |
| `e2e/fixtures.ts` | A signed-in fixture that signs in through the test session before each test; a failure if the browser makes any request to a Supabase address |
| `e2e/01-start.spec.ts` … `08-keyboard.spec.ts` | Changed only where one breaks on the top bar or the new "by …" text |
| `e2e/09-signin.spec.ts` | New |

### Part E: Search (phase 2)

| File | Change |
|---|---|
| `backend/app/routers/search.py` | New: `GET /api/search`, found by `main.py` on its own |
| `backend/app/services/search.py` | New: matching by part of a name, ignoring case and accents the same on both databases (R-SRCH-3, R-SRCH-8, Concern 17), `%` and `_` typed as plain text, starts-with first, 5 per group |
| `backend/tests/test_search.py` | New |
| `frontend/src/features/search/topbar.tsx` | New: puts the search box in the top bar's start slot |
| `frontend/src/features/search/TopBarSearch.tsx`, `useSearch.ts`, `search.css` | New: the box, the results panel (listbox, arrow keys, Enter, Escape), the wait while typing, ignoring answers that are out of date, the "Nothing matches" line (R-SRCH-1 to R-SRCH-10) |
| `frontend/src/features/search/TopBarSearch.test.tsx`, `useSearch.test.ts` | New |
| `e2e/10-search.spec.ts` | New |

### Part F: User menu and theme (phase 3)

| File | Change |
|---|---|
| `frontend/src/features/menu/topbar.tsx` | New: puts the menu button in the top bar's end slot |
| `frontend/src/features/menu/UserMenu.tsx`, `initials.ts`, `theme.ts`, `ThemeProvider.tsx`, `menu.css` | New: the button and menu, initials from the email, the remembered choice, System following the device live, `data-theme` on the root (R-MENU-1 to R-MENU-9) |
| `frontend/src/features/menu/UserMenu.test.tsx`, `initials.test.ts`, `theme.test.ts` | New |
| `frontend/index.html` | A small inline script that sets `data-theme` before first paint (R-MENU-7) |
| `frontend/src/styles/tokens.css` | The dark token block from `docs/specs/design.md` |
| `frontend/src/styles/global.css`, `frontend/src/features/dashboard/dashboard.css`, `frontend/src/features/pipeline/pipeline.css` | Replace any fixed colors with tokens, so the dark theme needs no styles of its own |
| `frontend/src/features/dashboard/Charts.tsx`, `Funnel.tsx` | Same: tokens in place of fixed colors where they don't need to be the brand color |
| `e2e/11-menu.spec.ts` | New |

### Part G: Render and docs (phase 4, and the end of each phase)

| File | Change |
|---|---|
| `render.yaml` | New: one free web service; build and start commands; the three settings listed with `sync: false` (R-DEP-1, R-DEP-2) |
| `docs/STATUS.md` | After each phase: what's done, and in phase 4 how to set up `.env` and Supabase, add users, run `npm run build` then `npm start`, and deploy |
| `docs/TECH_STACK.md` | Supabase and Render are now, not later; the new libraries |
| `.claude/agents/ui-check.md` | How to run the app in test mode so it can sign in without a password or Supabase (R-AUTH-11) |
| `docs/specs/*` | Only if a phase finds the spec wrong. A fix goes in the same change and is recorded in `docs/STATUS.md`. |

## 2. Order of work

Each phase ends with `npm run check` passing and `docs/STATUS.md` updated, then a commit ("Build: phase 1, sign-in and the database"). A phase doesn't start until the one before it passes.

### Phase 1: Sign-in and the database

Parts A, B, C and D. A comes first, B second. C and D can then run side by side, because they only share the API contract above.

1. **Check the two open facts first** (see Risks 1 and 2): the Supabase project's token keys, and the pooler address. Nothing is built on a guess.
2. **Part A**: install the dependencies, add the scripts and `.env.example`.
3. **Part B**: settings, the engine for both databases, the new columns, UTC timestamps, the first migration, the seed and `serve.py`. The old tests still pass on SQLite.
4. **Part C**: the token check, test mode, attribution through the services and routers, `healthz` and serving the built frontend. The `client` fixture signs in, so the old backend tests pass.
5. **Part D**: the session, the sign-in screen, the API client, the empty top bar, "Added by" on the record pages, and the e2e fixtures.
6. **Add the speed step** to `npm run check` (Part A) and time the old tests. Fix any slow one before going on (Concern 21).
7. **By hand, once**: sign in against the real Supabase with `npm run dev` to see that the real path works, since the tests never do.

Done when success criteria 1, 2 and 3 pass and every `/api` route refuses signed out.

### Phase 2: Search

Part E, with the backend and frontend halves in parallel against the API contract.

1. The service and router, with tests, on SQLite.
2. A search of the real Postgres by hand with names that have accents, because the tests can't (Risk 4).
3. The box, the panel, the keyboard use, and the e2e test.

Done when success criterion 4 passes.

### Phase 3: The user menu

Part F.

1. Theme logic and initials first, with tests, since they need no screens.
2. The menu and its top-bar file.
3. The dark tokens, then the clean-up of fixed colors, one screen at a time, with the contrast tool the spec asks for (Concern 2).
4. A look at every page in both themes through the `ui-check` agent (Risk 6).

Done when success criterion 5 passes.

### Phase 4: Render

Part G.

1. `render.yaml`, then `npm run build` and `npm start` on this computer, signed in against Supabase. This is success criterion 6.
2. Deploy to Render with the three settings entered there, and sign in at the `onrender.com` address. Wait for the sleeping service to wake once (R-DEP-8).
3. Update `docs/STATUS.md`, `docs/TECH_STACK.md` and the `ui-check` agent.

Done when success criteria 1 to 6 pass and the app is live.

## 3. Risks

1. **The token keys.** Concern 15: the check works only if the Supabase project signs tokens with its published keys. Before phase 1, read the project's JWT settings (the Supabase tools are connected) and fetch `/auth/v1/.well-known/jwks.json`. If the project is still on the old shared secret, the plan changes: the project is switched to signing keys in its dashboard, which needs no new setting.
2. **The database address.** Concern 22: Render's free plan has no IPv6, so only the pooler address works there. Before phase 1, try a SQLAlchemy connection to the pooler with `psycopg`, and note the pooler mode and any driver setting it needs (for example turning off prepared statements). Phase 4 fails late if this is wrong.
3. **A back door in test mode.** Concern 13. The guards are tested (`test_auth.py`), `npm run build` refuses to run in test mode, and the e2e fixture fails if the browser calls Supabase. A third guard: `render.yaml` never sets the flag, and the unit test reads the file to check.
4. **Search differs between the databases.** Concern 17. SQLite's own lower-casing handles only English letters. The plan matches in the application on a candidate set cut down in SQL, using one Unicode case rule for both. The SQLite tests can't see a Postgres difference, so phase 2 has a by-hand check on Postgres with accented names.
5. **Changing the timestamp type touches everything that reads one.** Moving from local-time strings to UTC `DateTime` changes the seed, the timelines, the dashboard's month groups and the frontend's display. Part B and Part C do it together in phase 1, and the old tests (with their fixed date) are the net. Dates without a time stay as they are, so late flags and follow-ups don't move.
6. **Dark mode finds fixed colors.** Some colors are written straight into CSS and chart code. Phase 3 hunts for them with a search for hex values, and the ui-check pass looks at every page in both themes. The hard cases are the chart gradients and the stage colors on black.
7. **Two ways of finding parts.** The router and top-bar discovery keeps parts from sharing files, but it's less obvious than an import list. Both are described in the "How the parts meet" list and covered by a test (the route walk, and an e2e test that checks the search box and menu both appear).
8. **Old tests and the new top bar.** Existing e2e specs may match text or positions the top bar and the "by …" lines now change. Part D owns those specs and fixes them in phase 1.
9. **`uv run --env-file` with no `.env`.** `npm run dev` should tell a new developer which settings are missing, not crash. Part A checks how the installed `uv` treats a missing file, and Part B's message in `config.py` carries the rest (R-AUTH-12).
10. **The free plans.** Concern 20. Render sleeps and Supabase can pause. Phase 4 checks that the spinner covers the wait, and `docs/STATUS.md` says how to unpause Supabase.
11. **Seed on a shared database.** Concern 11. The seed refuses a Postgres database with records unless forced. A unit test covers it, and phase 1 never runs the seed against the real database without `--force` chosen on purpose.

## 4. Proof

Unit tests run in under a second each (R-Q-6) and use SQLite in memory or in a temporary file, a locally made test key and no network.

### Backend (pytest)

| File | What it proves |
|---|---|
| `test_auth.py` | Every route in the app's route list answers 401 with no token, a malformed token, a token signed with the wrong key, an expired token, a wrong issuer or audience, and a token with no email (R-AUTH-5, R-AUTH-6). `healthz` and the built files answer without a token and return no data. A user or `created_by` in a body, query or header is ignored (R-AUTH-7). Test mode refuses to start on a Postgres URL or when `RENDER` is set, and `POST /api/test/session` is a 404 outside test mode (R-AUTH-11). Missing settings are named (R-AUTH-12). |
| `test_attribution.py` | Each kind of record, and each activity and stage-change entry, gets `created_by` and `updated_by` from the token. An edit changes only `updated_by`. A move changes the moved deal and not the others in the column. Ticking a follow-up done counts as a change. Two users give two different emails. Sample data has no user (R-AUTH-13 to R-AUTH-15). |
| `test_search.py` | Part of a name finds an organization, a contact and a deal, in any case. Accents (`ÉCOLE` finds `École Nord`). `%` and `_` are plain text. Starts-with ordering, the limit of 5 per group, the second line, an empty query, and no match (R-SRCH-3 to R-SRCH-5, R-SRCH-8). |
| `test_migrations.py` | The migrations on an empty SQLite file give the same tables and columns as `db.py`, and running them twice changes nothing (R-DEP-3). |
| `test_config.py` | Settings are read from the environment; `now()` is UTC; test mode and the database choice (R-DATA-12, R-RUN-4). |
| `test_seed.py` | The sample counts and ranges as before; no user on any sample row (R-SEED-6); the seed loads only into an empty database on first start; it refuses a Postgres database that has records without `--force` (R-RUN-2, R-RUN-3). |
| The existing backend tests | Still pass through the signed-in `client` fixture, with timestamps now in UTC. |
| `test_frontend_serving.py` | An unknown `/api` path is a 404 with JSON and not `index.html`; any other path gives `index.html`; `render.yaml` has no value for the three settings and doesn't set the test-mode flag (R-DEP-1, R-DEP-4). |

### Frontend (Vitest)

| File | What it proves |
|---|---|
| `auth/SignInPage.test.tsx` | The fields, the wrong-password and network messages, no sign-up or reset link, the admin line (R-AUTH-2, R-AUTH-3) |
| `auth/AuthProvider.test.tsx` | Spinner and not the sign-in screen while a saved session loads; a 401 clears the cache and shows "Your session ended. Sign in again."; sign-out clears the cache (R-AUTH-8 to R-AUTH-10) |
| `components/AddedBy.test.tsx` | The wording, and "Sample data" for no user (R-AUTH-15, R-AUTH-17) |
| `lib/format.test.ts` | A UTC timestamp shows in the viewer's time zone and a plain date doesn't move (R-DATA-12) |
| `features/search/useSearch.test.ts`, `TopBarSearch.test.tsx` | The wait while typing, an old answer ignored, grouping, arrow keys and Enter, Escape keeps the text, "Nothing matches 'xyz'." (R-SRCH-2, R-SRCH-6, R-SRCH-7, R-SRCH-9, R-SRCH-10) |
| `features/menu/initials.test.ts` | `abdalrahman.elsaid@…` gives AE; `sam@…` gives SA; `-`, `_` and `+` split; capitals (R-MENU-2) |
| `features/menu/theme.test.ts` | The choice is remembered; nothing remembered means System; System follows a fake device setting and changes with it; a browser that blocks storage still works (R-MENU-5, R-MENU-6, R-MENU-8) |
| `features/menu/UserMenu.test.tsx` | The email, three theme rows with one chosen, Sign out; the menu stays open after a theme choice; Escape returns focus (R-MENU-1, R-MENU-3, R-MENU-4) |

### End to end (Playwright, installed Chrome)

All run in test mode on the e2e SQLite database, signed in through the test session, with no request to Supabase and no console error. Each maps to a success criterion in `docs/changes/multi-user/intent.md`.

| File | Test | Criterion |
|---|---|---|
| `09-signin.spec.ts` | Signed out, every page (`/`, `/pipeline`, `/deals`, a deal, an organization, a contact) shows the sign-in screen and no data; a request to every `/api` route with no token gets 401 | 2 |
| | A wrong password shows the message; a good sign-in lands on the page that was asked for; refreshing stays signed in; sign-out in one tab signs out a second tab | 2 |
| | Signed in, the five sections and every action from the MVP still work (the old specs 01–08 run through the signed-in fixture) | 2 |
| | An organization, a contact, a deal and an activity added by one user show that user's email, and after a second user edits one, "Last changed by" shows the second; a sample record shows "Sample data"; a stage change on the board shows the mover in the timeline | 3 |
| | `npm run check` runs with `SUPABASE_URL`, `SUPABASE_PUBLISHABLE_KEY` and `DATABASE_URL` set to real-looking values in the environment, and no request leaves for them | 1 |
| `10-search.spec.ts` | Typing part of an organization, a contact and a deal name, in upper and lower case, finds each; a result opens its page; keyboard choice works; "Nothing matches" shows | 4 |
| `11-menu.spec.ts` | The initials show; Dark applies at once and survives a reload; Light the same; System follows an emulated device setting and changes when it changes; no flash of the wrong theme on load; Sign out returns to the sign-in screen | 5 |
| `07-look.spec.ts` (existing, extended by Part F) | The pages in the dark theme have no sideways overflow and no console error; screenshots saved for the ui-check pass | 5 |

### By hand

These can't be proved by the tests, because the tests never touch Supabase or Render. Each is written up in `docs/STATUS.md` when done.

- **Criterion 6**: `npm run build`, then `npm start`, signed in against the real Supabase, on `http://localhost:8000`.
- **Real sign-in**: a user added in Supabase's dashboard signs in, adds a record, and a second user sees it with the first user's email.
- **Postgres search**: accented names found in any case.
- **Render**: the service answers at its `onrender.com` address after a deploy, the sleeping service wakes behind the spinner, and a link to a deal opens it after sign-in.
- **`npm run check` with and without `.env`**: passes both ways, and a network trace shows no call to Supabase (criterion 1).

### Traceability

Every R-AUTH, R-SRCH, R-MENU and R-DEP requirement is named in a test above, or in "By hand" for the parts the tests can't reach (R-DEP-1 to R-DEP-3, R-DEP-6 to R-DEP-8, R-RUN-7). The other requirement IDs that changed (R-RUN-1 to R-RUN-5, R-DATA-8, R-DATA-12, R-DATA-13, R-REC-6, R-ACT-4, R-SEED-6, R-SEED-7, R-PIPE-10, R-Q-6, R-Q-7) are covered by the tests for the parts that own them. A last step in phase 4 greps the area files for every new ID and fails if one has no mention in a test file or in `docs/STATUS.md`.
