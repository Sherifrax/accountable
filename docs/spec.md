# Spec: the Accountable MVP

This spec turns `docs/intent.md` into requirements and a design. The stack is in `docs/TECH_STACK.md`. The look follows the brand skill (`.claude/skills/brand`). Where this spec and the intent disagree, the intent wins, and this spec should be fixed.

## Concerns

These need a decision or awareness before building. Each one says what this spec does about it for now.

1. **Six stages, five brand colors.** The brand gives five colors in a set order (Sea Green, Marigold, Coral, Cerulean, Raspberry). The pipeline has six stages, and Raspberry is also the alert color for late deals and overdue follow-ups. Using Raspberry for a stage would make late deals hard to see. **For now:** New is Cerulean, Qualified is Marigold, Proposal is Coral, Negotiation is a light Midnight, Won is Sea Green and Lost is a neutral grey. Raspberry is kept for alerts only. This departs from the brand's order on purpose, so Won reads as success. **Decided:** agreed.
2. **Some brand colors fail contrast for text.** Sea Green and Marigold are too light for text on white, as the brand says. Cerulean with white text (about 3.9:1) and Raspberry with white text (about 3.4:1) are also below the WCAG AA minimum of 4.5:1 for normal-size text. **For now:** a darker text shade is defined for each color (see Design tokens). White text on Cerulean or Raspberry is used only at 14px semibold or larger, such as buttons, and never for small labels. **Decided:** agreed.
3. **"One command" needs a one-time setup.** `npm run dev` only works after Node, uv and `npm install` are in place, which is a lot to ask of someone non-technical (success criterion 1). **For now:** `docs/STATUS.md` lists the prerequisites and the one-time `npm install`. After that, `npm run dev` is the only command, because `uv run` installs the Python packages itself. If one command from a fresh clone is needed, `npm run dev` could run `npm install` first. **Decided:** keep it as is for now. Revisit if a fresh-clone single command is needed.
4. **No internet means no Google Fonts at run time.** The brand fonts come from Google Fonts, but the app must work offline. **For now:** the fonts are installed as npm packages (`@fontsource-variable/instrument-sans`, `@fontsource/instrument-serif`, `@fontsource-variable/jetbrains-mono`) and bundled with the app. They are the same Google Fonts, served locally. **Decided:** agreed, and every font has a secondary (fallback) font from the system, so text still looks right if a bundled font fails to load or while it loads. See the font stacks in Design tokens.
5. **Moving a deal out of Won or Lost.** The intent says the close date becomes today on Won or Lost, but not what happens if the deal is moved back to an open stage. **For now:** the close date stays as it is. The deal may then show as late, which is a fair prompt to set a new date.
6. **What counts as "upcoming".** The intent says follow-ups show as upcoming or overdue, but doesn't say how far ahead "upcoming" looks. **For now:** overdue means the date is before today. Upcoming means today or the next 7 days. Later ones show on their record's timeline, but not on the dashboard.
7. **Stage-change entries.** The intent says they appear by themselves. It doesn't say whether they can be edited. **For now:** they can't be edited or deleted, so the history stays true. They are deleted along with their deal.
8. **The deal's contact changes later.** An activity logged on a deal is also linked to the deal's main contact at that moment. **For now:** changing the deal's contact later doesn't move old activities, because they happened with the person they happened with.
9. **The funnel's meaning.** "How much value reaches each stage" could mean the value sitting in each stage now, or the value that ever got that far. **For now:** it means the value of deals that ever got that far, worked out from stage history (see Dashboard). This is the classic funnel shape, and the open pipeline is shown separately.
10. **The Playwright tests need Google Chrome installed.** This is fine on a developer's machine, but it is a dependency to note in `docs/STATUS.md`.

## 1. Scope

In: the five sections, the four kinds of record, local storage that survives restarts, sample data, a reset command, and the tests described in `docs/TECH_STACK.md`.

Out, as the intent says: sign-in, several users, dark mode, phone layouts, AI, integrations, other currencies, extra reports, tags, custom fields, editable stages, import and export.

## 2. Requirements

Requirement IDs (R-…) are referenced by the tests.

### 2.1 Running the app

- **R-RUN-1** `npm run dev` starts the backend on `http://localhost:8000` and the frontend on `http://localhost:5173`. The terminal prints the address to open. Opening it shows the dashboard.
- **R-RUN-2** `npm run seed` deletes all data and loads the sample data. It works whether or not the app is running.
- **R-RUN-3** On first start, if the database file doesn't exist, the backend creates it and loads the sample data.
- **R-RUN-4** `npm test` runs the frontend, backend and end-to-end tests, and fails if any test fails. The tests use their own database file.
- **R-RUN-5** Nothing needs an internet connection after `npm install`.
- **R-RUN-6** The commands work on Mac, Linux and Windows. No shell-specific syntax goes in the npm scripts.

### 2.2 Data rules

**Stages and probabilities**

| Stage | Usual probability | Open? |
|---|---|---|
| New | 10% | yes |
| Qualified | 25% | yes |
| Proposal | 50% | yes |
| Negotiation | 75% | yes |
| Won | 100% | no |
| Lost | 0% | no |

- **R-DATA-1** A new deal takes its stage's usual probability unless one is given.
- **R-DATA-2** When a deal's stage changes, its probability becomes the new stage's usual probability. The only exception is an edit that changes the stage and sets a probability in the same save; then the probability given is kept. A probability set by hand stays until the next stage change.
- **R-DATA-3** When a deal moves to Won or Lost, its close date becomes today. It can be edited afterwards. Moving back to an open stage leaves the close date as it is.
- **R-DATA-4** Every stage change, from the board, the edit form or anywhere else, creates a stage-change entry on the deal ("Moved from Proposal to Negotiation"). It's dated at the time of the change and linked to the deal and its main contact.
- **R-DATA-5** A deal is **late** when it's open and its close date is before today.
- **R-DATA-6** **Expected revenue** of a deal = value × probability ÷ 100. Totals are rounded to whole dollars for display.
- **R-DATA-7** Deal values are whole US dollars, 0 or more. Probability is a whole number from 0 to 100.
- **R-DATA-8** "Today" is the local date of the computer running the app.

**Required fields.** Everything not listed here is optional.

| Record | Required |
|---|---|
| Organization | name |
| Contact | name, status (default: lead) |
| Deal | name, stage (default: New), value |
| Activity | type, description, date and time (default: now) |

- **R-DATA-9** Email must look like an email if given. Website is stored as typed, and shown as a link with `https://` added if it has no scheme.
- **R-DATA-10** An activity is linked to a contact, a deal or both. It must have at least one. Logging one from a deal also links the deal's main contact, if there is one.
- **R-DATA-11** A follow-up is an activity with a follow-up date. It has a done flag, which starts as false.

**Deleting**

- **R-DEL-1** Deleting an organization keeps its contacts and deals, with no organization.
- **R-DEL-2** Deleting a contact keeps their deals, with no main contact.
- **R-DEL-3** Deleting a contact deletes the activities linked only to that contact. Activities that are also linked to a deal stay, with no contact. The same goes for deleting a deal: activities linked only to it are deleted, and activities also linked to a contact stay, with no deal. Stage-change entries are always deleted with their deal.
- **R-DEL-4** Before deleting, a confirmation dialog names the record and says exactly what happens, with counts. For example: "Delete Northwind Logistics? Its 4 contacts and 3 deals will be kept, with no organization. This can't be undone."
- **R-DEL-5** Deleting an activity asks first. Stage-change entries can't be deleted on their own.

### 2.3 Tables (Organizations, Contacts, Deals)

- **R-TBL-1** Each table has a search box that matches any visible text column as you type, ignoring case.
- **R-TBL-2** Clicking a column heading sorts by it. Clicking again reverses the order. An arrow shows the current sort.
- **R-TBL-3** A "New …" button opens a form to add a record. Each row has Edit and Delete actions. Clicking anywhere else on a row opens the record's page.
- **R-TBL-4** The columns are:
  - Organizations: name, industry, website, number of contacts, number of open deals, open pipeline value.
  - Contacts: name, organization, job title, email, phone, status. Above the table, a status filter: All, Lead, Qualified, Customer, each with its count.
  - Deals: name, organization, contact, stage, value, probability, expected revenue, close date. Late deals show a Raspberry "Late" tag next to the close date.
- **R-TBL-5** When there's nothing to show, the table says so in plain words, such as "No contacts match 'acme'."
- **R-TBL-6** The default sort is name A–Z for organizations and contacts, and close date (soonest first) for deals.

### 2.4 Record pages

- **R-REC-1** **Organization page**: details (website, industry, notes), its contacts, its deals, and one combined timeline of every activity and stage change linked to its contacts or deals. It has Edit, Delete and New contact or New deal (with the organization filled in) actions.
- **R-REC-2** **Contact page**: details, status, a link to their organization, their deals, and their timeline. It has Log activity, Edit and Delete actions.
- **R-REC-3** **Deal page**: details (stage, value, probability, expected revenue, close date, links to the organization and contact), the late tag if late, and its timeline. It has Log activity, Edit and Delete actions, and a stage selector that changes the stage straight away.
- **R-REC-4** Timelines are newest first. Each entry shows an icon for its type, the description, the date and time, and links to the other record (a deal entry shows its contact, and a contact entry shows its deal). Follow-ups show their date, a done checkbox, and an Overdue tag in Raspberry if overdue and not done. Activities have Edit and Delete. Stage-change entries have neither.
- **R-REC-5** A link to a deleted organization or contact simply shows "None".

### 2.5 Pipeline

- **R-PIPE-1** Six columns in stage order. Each column header shows the stage name, the number of deals, the total value and the expected revenue.
- **R-PIPE-2** Above the board, two figures for open deals only: total value and expected revenue.
- **R-PIPE-3** Each card shows the deal name, the organization, the value, the close date and the contact. Late cards show the Raspberry "Late" tag and a Raspberry tint behind the date.
- **R-PIPE-4** Dragging a card to another column changes its stage (with R-DATA-2, R-DATA-3 and R-DATA-4). Dragging within a column changes its place. The card stays exactly where it was dropped, including after a refresh.
- **R-PIPE-5** All totals update as soon as the card is dropped, before the server replies. If the server rejects the move, the card goes back and a message says the move didn't save.
- **R-PIPE-6** Each column has a "+" button that opens the new-deal form with that stage chosen. The new card goes to the top of that column.
- **R-PIPE-7** Won and Lost show every deal ever won or lost. The columns scroll on their own if long.
- **R-PIPE-8** Clicking a card (without dragging) opens the deal's page.
- **R-PIPE-9** Cards can also be moved with the keyboard (the drag library's keyboard support).

### 2.6 Activities and follow-ups

- **R-ACT-1** The "Log activity" form has: type (note, call or email), description, date and time (default now), optional follow-up date. From a deal page, the contact is filled in from the deal. From a contact page, an optional deal picker lists that contact's deals.
- **R-ACT-2** An activity can be edited, including adding or removing its follow-up date and marking it done, and deleted after a confirmation.
- **R-ACT-3** A follow-up stays on the dashboard until it's marked done. Ticking it done on the dashboard or in a timeline updates both straight away.

### 2.7 Dashboard

- **R-DASH-1** A row of four figure tiles:
  - **Open pipeline**: total value of open deals, with the count.
  - **Expected revenue**: total expected revenue of open deals.
  - **Won this month**: revenue won this calendar month, with the change from last month as a percentage.
  - **Win rate**: deals won ÷ (won + lost) over the last 12 months, by close date.
- **R-DASH-2** **Line chart: revenue won by month**, for the last 12 months including this one, by close date. Hovering shows the month, the revenue and the number of deals.
- **R-DASH-3** **Bar chart: deals won and lost by month**, for the same 12 months, as two series side by side (Won in Sea Green, Lost in grey).
- **R-DASH-4** **Pipeline funnel**: one bar per stage from New to Won, each as wide as the value of deals that reached that stage. A deal reached a stage if its current stage or any stage in its history is that stage or later. Lost isn't later than anything, and a deal created at a later stage counts as having passed the earlier ones. Each bar shows its value and the share kept from the stage before it. Next to the funnel, a stacked bar shows today's open pipeline by stage.
- **R-DASH-5** **Follow-ups**: overdue ones first (oldest first, Raspberry tag), then those due in the next 7 days (soonest first). Each shows the description, the contact or deal, the date and a done checkbox. If there are none, it says "Nothing due this week."
- **R-DASH-6** **Recent activity**: the 10 newest activities and stage changes across everything, each linking to its record.
- **R-DASH-7** Every figure comes from the current data. Marking a deal won or logging a follow-up shows on the dashboard the next time it's opened, without a manual refresh.

### 2.8 Sample data

- **R-SEED-1** About 15 organizations across at least 6 industries, 40 contacts (all three statuses), 30 deals (every stage, won and lost deals spread over the past 12 months, open deals closing over the next few months, and at least 3 late) and 80 activities over the past 12 months, including at least 3 overdue follow-ups and at least 3 due in the next 7 days.
- **R-SEED-2** All dates are worked out from the day the seed runs, so the data always looks current.
- **R-SEED-3** The data is the same every time (fixed lists, plus a fixed random seed where randomness is used).
- **R-SEED-4** Company and people names are made up and believable. No real companies. Emails use made-up domains that match the company.
- **R-SEED-5** Won and lost deals have stage-change history, so the funnel and timelines look real.

### 2.9 Quality

- **R-Q-1** No errors or warnings in the browser console during normal use.
- **R-Q-2** Every action gives visible feedback: a short message after saving or deleting, and a clear message if something fails.
- **R-Q-3** Forms show errors next to the field, in plain words ("Name is required").
- **R-Q-4** It works well at laptop and desktop widths, from 1280px up. Below that, it can scroll sideways but must not break.
- **R-Q-5** Keyboard use: every action can be reached by Tab, dialogs trap focus and close with Escape, and focus is clearly visible.

## 3. Architecture

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

### 3.1 Libraries

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

### 3.2 Data model (SQLite, SQLAlchemy Core)

Foreign keys are turned on (`PRAGMA foreign_keys = ON`). Timestamps are ISO 8601 strings in local time. Dates are `YYYY-MM-DD`.

**organizations**: `id` PK, `name` text not null, `website` text, `industry` text, `notes` text, `created_at`, `updated_at`.

**contacts**: `id` PK, `name` text not null, `email`, `phone`, `job_title`, `organization_id` FK → organizations ON DELETE SET NULL, `status` text not null (`lead` | `qualified` | `customer`), `created_at`, `updated_at`.

**deals**: `id` PK, `name` text not null, `organization_id` FK ON DELETE SET NULL, `contact_id` FK → contacts ON DELETE SET NULL, `stage` text not null, `value` integer not null ≥ 0, `probability` integer not null 0–100, `close_date` date, `position` integer not null (order within its stage column, 0 = top), `created_at`, `updated_at`.

**activities**: `id` PK, `type` text not null (`note` | `call` | `email` | `stage_change`), `contact_id` FK ON DELETE SET NULL, `deal_id` FK ON DELETE SET NULL, `description` text not null, `occurred_at` timestamp not null, `follow_up_date` date, `done` boolean not null default false, `from_stage`, `to_stage` (stage changes only), `created_at`, `updated_at`.

The rule in R-DEL-3 runs in the service layer inside one transaction. It deletes the activities that would be left with neither link, and stage changes for a deleted deal, before the record itself. The SET NULL foreign keys handle the rest.

### 3.3 API

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

### 3.4 Frontend data flow

- TanStack Query caches each list, record and the dashboard. Any change invalidates the queries it affects (for example, moving a deal invalidates deals, the pipeline, that deal, its organization, its contact and the dashboard). That's how R-DASH-7 holds.
- Pipeline moves update the cache straight away and undo themselves if the server fails (R-PIPE-5).
- The usual probabilities are fetched from `/api/stages`, so the backend is the single source of truth.

### 3.5 Tests

- **Backend (pytest)**: stage and probability rules, close date on Won or Lost, stage-change entries, the delete rules (each case in R-DEL-1 to R-DEL-3), moving and renumbering, dashboard figures against known data, and seed counts and ranges. Uses a temporary database.
- **Frontend (Vitest + Testing Library)**: money and date formatting, late and expected-revenue display, table search and sort, form validation, the delete-confirmation wording.
- **End to end (Playwright, installed Chrome)**: one test per success criterion in the intent, against a fresh seeded test database on separate ports. Each test fails if the browser console shows an error.

## 4. Design

### 4.1 Principles

Calm, dense enough for daily work, and quick to scan. White panels on a soft grey-blue page, with Midnight ink. Color carries meaning (stage, status, alert) and isn't decoration. Numbers are set in JetBrains Mono so columns of figures line up.

### 4.2 Design tokens

```css
:root {
  /* Brand */
  --sea-green: #06D6A0;   --sea-green-ink: #04785A;   /* text on light */
  --marigold:  #FFC145;   --marigold-ink:  #8A5A00;
  --coral:     #F78C6B;   --coral-ink:     #B0482A;
  --cerulean:  #118AB2;   --cerulean-ink:  #0C6A89;
  --raspberry: #EF476F;   --raspberry-ink: #C21E48;
  --midnight:  #073B4C;
  --sea-mist:  #CDD8DB;

  /* Surfaces (light mode only) */
  --page: #F0F4F5;
  --panel: #FFFFFF;
  --panel-sunken: #F6F9F9;      /* table header, inputs */
  --hover: #E9F0F1;
  --ink: var(--midnight);
  --ink-muted: #4F6F7A;
  --ink-faint: #8FA3A9;
  --divider: #E3EAEC;           /* rows inside a panel only */

  /* Stage colors (see Concern 1) */
  --stage-new: var(--cerulean);
  --stage-qualified: var(--marigold);
  --stage-proposal: var(--coral);
  --stage-negotiation: #3D6B7A;
  --stage-won: var(--sea-green);
  --stage-lost: #A9B8BD;

  /* Shape and depth */
  --radius-panel: 14px;  --radius-control: 8px;  --radius-pill: 999px;
  --shadow-panel: 0 1px 2px rgba(7,59,76,.04), 0 4px 16px rgba(7,59,76,.05);
  --shadow-lift: 0 8px 24px rgba(7,59,76,.14);   /* dragged card, menus */

  /* Type */
  /* Brand font first, then a secondary system font for each platform
     (Mac, Windows, Linux), then the generic family as a last resort. */
  --font-sans: "Instrument Sans Variable", "Instrument Sans",
    -apple-system, "Segoe UI", "Helvetica Neue", Arial, "Liberation Sans", sans-serif;
  --font-serif: "Instrument Serif",
    Georgia, "Times New Roman", "Liberation Serif", serif;
  --font-mono: "JetBrains Mono Variable", "JetBrains Mono",
    ui-monospace, "SF Mono", Menlo, Consolas, "Liberation Mono", monospace;
}
```

The text shades (`*-ink`) are chosen to reach at least 4.5:1 on white. Check them with a contrast tool during the build and adjust them if needed.

**Font loading**: the Fontsource packages use `font-display: swap`, so text shows straight away in the secondary font and switches to the brand font once it loads. The secondary fonts are ones every Mac, Windows and Linux machine already has, so nothing is downloaded. Figures use `font-variant-numeric: tabular-nums` so they still line up in the secondary mono font.

**Type scale**: page title 28/36 semibold. Section title 18/26 semibold. Body 14/20 regular. Small label 12/16 medium, in `--ink-muted`. Figure tiles 32/40 mono medium. Table money and dates use mono 13/20.

**Spacing**: a 4px grid. Panel padding is 20px, the gap between panels is 16px, and table rows are 44px tall.

### 4.3 Layout

- **Sidebar** (232px, fixed, Midnight background, Sea Mist text): the wordmark "Accountable" in Instrument Sans semibold, with a short tagline under it in Instrument Serif italic ("Sales, in order."). Below that, nav items with Lucide icons: Dashboard, Pipeline, Deals, Organizations, Contacts. The active item has a Sea Green pill behind it with Midnight text.
- **Main area** (page background, max content width 1440px, 32px padding): a page header with the title on the left and the main action on the right (such as "New deal"), then the content.
- Panels: white, `--radius-panel`, `--shadow-panel`, with no border. There's no line along the top of the page and no single-edge accents on panels, as the brand asks.

### 4.4 Components

- **Buttons**: primary has a Sea Green fill and Midnight text. Secondary has a `--panel-sunken` fill and Midnight text. Danger has a Raspberry fill and white text, semibold at 14px. Ghost (icon buttons in rows) is transparent and gets `--hover` on hover. Height 36px, `--radius-control`.
- **Tags and chips**: a pill with the color at about 18% tint behind the matching `*-ink` text, 12px medium.
  - Contact status: Lead = Coral, Qualified = Marigold, Customer = Sea Green. These are the brand's three side-by-side colors, with Sea Green kept for the best status.
  - Stage: the stage color, as a small dot plus the name.
  - Late or Overdue: Raspberry tint with Raspberry ink.
- **Tables**: inside a panel. The header row is sticky, with a `--panel-sunken` background and 12px muted labels. Row dividers use `--divider`, and rows get `--hover` on hover. Money is right-aligned in mono. Row actions (Edit, Delete) show on hover and focus, as icon buttons with tooltips.
- **Search box**: in the panel's header, left-aligned, with a search icon and the placeholder "Search deals".
- **Dialogs**: white, 16px radius, 520px wide, with the title in 18px semibold. Forms use labels above fields. The footer has Cancel (secondary) and Save (primary). Delete confirmations put the consequence sentence in body text and use a Danger button labeled with the action ("Delete organization").
- **Timeline**: a vertical list. Each entry has a round icon badge (note, call, email, or an arrow for stage changes in the target stage's color), the description, then a muted line with the date, type and linked record. Follow-ups add a checkbox and date chip.
- **Toasts**: bottom right. White, with a lift shadow and short text ("Deal saved", "Couldn't save the move. Try again.").
- **Money**: always with its currency symbol: `$12,500`. Large figures in tiles may be shortened (`$1.2M`), with the full amount in a tooltip.
- **Dates**: `Mar 4, 2026` in tables and `Mar 4, 2026, 2:15 PM` in timelines. Relative wording ("in 3 days", "5 days overdue") is used for follow-ups only.

### 4.5 Screens

**Dashboard** (12-column grid):
- Row 1: four figure tiles (3 columns each). Each has a muted label, a large mono figure and a small line of context ("12 open deals", "+18% on last month" in Sea Green ink, or a Raspberry-ink figure for a fall).
- Row 2: the revenue won line chart (8 columns). It's a smooth Sea Green line with a soft Sea Green area fill under it, the only gradient on the page. Next to it, the follow-ups panel (4 columns).
- Row 3: the pipeline funnel (7 columns). It's drawn as centered horizontal bars in stage colors that narrow from New to Won, with the value in mono and the share kept from the stage before. Under it, the stacked open-pipeline bar. Next to it, the won and lost bar chart (5 columns).
- Row 4: recent activity (full width, two columns of entries).
- Charts use light horizontal gridlines only, muted mono axis labels and tooltips styled as small white panels.

**Pipeline**: the two board totals sit in the page header, next to the "New deal" button. Six columns, each 280px wide, scroll sideways if the window is narrow. Column headers show a stage dot, the name, the count, then the total and expected revenue in mono. Cards are white panels with a 10px radius. The name is semibold, the organization muted, and the value in mono at the bottom left with the close date at the bottom right. A dragged card lifts (`--shadow-lift`, slight tilt), and its drop place shows as a dashed outline slot in the column. Columns have a faint tint of their stage color (about 6%) to tell them apart without borders.

**Tables (Organizations, Contacts, Deals)**: page header with the title and "New …" button. One panel holds the search box (and the status filter as segmented pills on Contacts), then the table.

**Record pages**: a header panel with the name in 28px, key facts as chips (status, stage, late), and the actions on the right. Below it, two columns: details and linked records on the left (5 columns), and the timeline on the right (7 columns), with "Log activity" at the top of the timeline.

### 4.6 Tone in the interface

Short labels in sentence case: "New deal", "Log activity", "Mark done". Empty states say what's missing and what to do: "No follow-ups due. Log one from a contact or deal." There are no exclamation marks and no jargon. Errors say what happened and what to try.

## 5. Definition of done

All eight success criteria in `docs/intent.md` are met, `npm test` passes, and someone has used every section and action in a real browser with the console open and found no errors. `docs/STATUS.md` explains how to install, run, reset and test.
