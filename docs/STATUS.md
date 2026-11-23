# Status

Work follows `docs/plan.md`. Done so far: all eight phases of `docs/plan.md`, except that the by-hand check (success criterion 8) still needs a person; see below.

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
| `npm run check:quick` | The code checks (Prettier, ESLint, Ruff, the secrets scan, `ty`), then the type checks and the unit tests with coverage. It leaves out the end-to-end tests. |
| `npm run check` | Everything `check:quick` runs, plus the end-to-end tests. This is the full check to run on your own computer before you push. |
| `npm run format` | Rewrites files to the house style (Prettier and Ruff). |

`npm run check` and `check:quick` need [gitleaks](https://github.com/gitleaks/gitleaks#installing) for the secrets scan (`brew install gitleaks` on a Mac). CI pins gitleaks 8.30.1.

### Continuous integration

`.github/workflows/ci.yml` runs on every push to any branch. It scans every commit for secrets with gitleaks, then runs `npm run check:quick`. It doesn't run the end-to-end tests; run `npm run check` on your own computer for those. CI needs no secrets of its own.

Running `npm install` also sets up git hooks through lefthook (`lefthook.yml`): before each commit, it formats the staged files, then runs ESLint, Ruff, the type checks and the secrets scan on them.

## What exists

- **Backend** (`backend/`): the whole API from spec 3.3 and every data rule. 81 pytest tests cover them, including stage and probability rules, moving and renumbering, delete rules and impact counts, timelines, dashboard figures with a fixed "today", and the sample data.
- **Frontend** (`frontend/`): app shell, brand tokens and bundled fonts, typed API layer, shared components, the Organizations, Contacts and Deals tables, record pages, forms with validation, delete confirmations with counts, and activity logging with follow-ups. The Pipeline board has drag and drop (mouse and keyboard) with optimistic moves. The Dashboard has four tiles, a revenue line chart, a won and lost bar chart, the funnel with the open-pipeline stack, follow-ups with done checkboxes, and recent activity.
- **End to end** (`e2e/`): Playwright config, a fixture that reseeds before each test and fails on any console error or warning, and a smoke test, `02-records.spec.ts` (add, search, sort, edit, restart, delete, reset) and `03-links.spec.ts` (status filter, linked records, timelines) `05-activities.spec.ts`, `06-dashboard.spec.ts`, `07-look.spec.ts` (charts, fonts, colors, no sideways overflow at 1280 and 1440px, screenshots in `e2e/results/screenshots/`, git-ignored), `01-start.spec.ts` (dashboard first, every section, nothing leaves localhost) and `04-pipeline.spec.ts` (drag, totals, Won, order after refresh, keyboard, "+", late tags, server failure).
- `docs/mockups/prototype.html` stays as the visual reference.
- **Project subagents** (`.claude/agents/`, both on Sonnet): `reviewer` reviews a branch against `docs/REVIEW.md` and reports by severity, and only reads (no edits, no state-changing git). `ui-check` opens each page of the running app through the Playwright MCP server, screenshots it to `.playwright-mcp/` (git-ignored), and checks it against the brand skill and the spec (`docs/spec.md` and the area files in `docs/specs/`). It changes no code and submits no forms. `docs/REVIEW.md` holds the review standard; so far it has only the spec checks.

## What was checked, and what still needs a person

- `npm test`: 57 Vitest tests, 81 pytest tests and 30 Playwright tests pass. Every Playwright test fails on any browser console error or warning.
- `npm run check` passes every layer: Prettier, ESLint, Ruff, `ty`, the secrets scan, the type checks, 57 Vitest, 81 pytest (coverage above the 80% floor), and 30 end-to-end tests. Two suppressions remain, both with the reason written beside them: the pipeline card's click handler (`Board.tsx`, the keyboard path is the link inside the card) and TanStack Table's `useReactTable` (`DataTable.tsx`, React Compiler can't memoize it, and there's no compatible version of the library).
- Contrast: every `*-ink` shade is at least 4.5:1 on white, on the page and on the panel-sunken grey, and the tag text is at least 4.5:1 on its tint. Text that used `--ink-faint` (2.6:1) was moved to `--ink-muted`; `--ink-faint` is now only for placeholders. White text on Cerulean (3.96:1) is used only at 14px semibold (the funnel bar).
- Keyboard (R-Q-5): `08-keyboard.spec.ts` checks the Tab order, a visible outline on each stop, focus trapped in dialogs, Escape closing them, and focus going back to the button that opened them.
- Screenshots of every screen at 1280px and 1440px (`e2e/results/screenshots/`) were looked at by eye while building. That caught an edit form starting on "None" for its organization, now fixed and tested.
- **Not done:** a person using the whole app by hand in Chrome with the console open (success criterion 8). Run `npm run dev`, open http://localhost:5173, and go through every section and action. Until then, MVP sign-off is open.
- Known limit: the pipeline's six columns need about 1760px, so at 1440px the board scrolls sideways to reach Won and Lost.

## Later ideas (not in the spec)

None yet.

## Where the build differs from the spec

- Selects are native `<select>` elements, styled to match, rather than Radix Select. They are fully keyboard and screen-reader friendly and easy to test. Radix is used for Dialog, Checkbox and Tooltip.
- Styles are plain CSS in `frontend/src/styles/` (tokens, then one global stylesheet) rather than a CSS Module per component.
- TanStack Table is pinned to v8 (the v9 API is different).
- Every change refreshes the four query families (organizations, contacts, deals, dashboard) instead of a hand-written map of which query each change touches. The lists are small and only the screens on view are fetched again.

## Spec layout

`docs/spec.md` is now a short summary with an index. The requirements, architecture and design moved, unchanged, into one file per product area in `docs/specs/`. References like "spec 3.3" or "spec 4.2" point at `docs/specs/architecture.md` and `docs/specs/design.md`, where the section numbers are kept.
