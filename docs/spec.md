# Spec: the Accountable MVP

This spec turns `docs/intent.md` and `docs/changes/multi-user/intent.md` into requirements and a design. It is split by product area: this file is the summary and the index, and the detail lives in `docs/specs/`. The stack is in `docs/TECH_STACK.md`. The look follows the brand skill (`.claude/skills/brand`). Where this spec and an intent disagree, the intent wins, and this spec should be fixed. Where the two intents disagree, the multi-user one is newer and wins.

## Summary

Accountable is a small sales CRM shared by a team on the web. Everyone signs in with an email and password through Supabase, and everyone works on the same data. Each record shows who added it and who last changed it. A search box in the top bar finds any organization, contact or deal, and a menu under the user's initials holds the theme (light, dark or system) and signing out. It has five sections: a dashboard, a pipeline board, and tables for deals, organizations and contacts. Organizations, contacts, deals and activities are the four kinds of record. Deals move through six stages (New, Qualified, Proposal, Negotiation, Won, Lost), each with a usual probability, and every stage change is written to the deal's timeline. Activities (notes, calls, emails and follow-ups) hang off contacts and deals, and follow-ups show on the dashboard until they're done. Data is stored in Postgres on Supabase and loaded with sample data when the database is empty, and the tests use their own SQLite databases. The backend is FastAPI with SQLAlchemy Core and checks the user's token on every request. The frontend is React. FastAPI serves the built frontend and the API as one web service on Render's free plan. The look follows the brand skill, in a light and a dark theme.

## Index

Read this file first, then only the area files a change touches. Each area file keeps the original section number in its title, and requirement IDs (R-…) are unchanged.

| Area file | What it holds | Requirement IDs |
|---|---|---|
| `docs/specs/concerns.md` | Open decisions and what the spec does about each for now | |
| `docs/specs/running.md` | Starting, seeding and testing the app | R-RUN |
| `docs/specs/data-rules.md` | Stages, probabilities, late deals, required fields, deleting | R-DATA, R-DEL |
| `docs/specs/tables.md` | The Organizations, Contacts and Deals tables | R-TBL |
| `docs/specs/records.md` | Organization, contact and deal pages, and timelines | R-REC |
| `docs/specs/pipeline.md` | The drag-and-drop board | R-PIPE |
| `docs/specs/activities.md` | Logging activities and follow-ups | R-ACT |
| `docs/specs/dashboard.md` | Figures, charts, funnel, follow-ups, recent activity | R-DASH |
| `docs/specs/sample-data.md` | The seeded sample data | R-SEED |
| `docs/specs/quality.md` | Console, feedback, forms, widths, keyboard | R-Q |
| `docs/specs/auth.md` | Sign-in, protecting the API, test sign-in, who added and changed each record | R-AUTH |
| `docs/specs/search.md` | The top bar search | R-SRCH |
| `docs/specs/menu.md` | The user menu and the theme | R-MENU |
| `docs/specs/deployment.md` | Render, `render.yaml`, migrations on start, the built frontend | R-DEP |
| `docs/specs/architecture.md` | Folder layout, libraries, data model, API, frontend data flow, tests | |
| `docs/specs/design.md` | Tokens, layout, components, screens, tone | |

## 1. Scope

In: the five sections, the four kinds of record, sign-in and several users sharing one database, who added and last changed each record, a top bar search, a user menu with a light, dark and system theme, deployment to Render, sample data, a reset command, and the tests described in `docs/TECH_STACK.md`.

Out, as the intents say: roles and permissions (everyone can do everything), signing in with Google, magic links or password reset, a sign-up page, moving the old local SQLite data to Supabase, phone layouts, AI, integrations, other currencies, extra reports, tags, custom fields, editable stages, import and export.

## 2. Requirements

Requirement IDs (R-…) are referenced by the tests.

The requirements, architecture and design are in the area files listed in the index.

## 5. Definition of done

All eight success criteria in `docs/intent.md` and the six in `docs/changes/multi-user/intent.md` are met, `npm run check` passes without touching Supabase, and someone has used every section and action in a real browser with the console open and found no errors. The built app has been run on this computer the way Render runs it (`npm run build`, then `npm start`) and signed in against Supabase, and the app is deployed on Render. `docs/STATUS.md` explains how to install, set up `.env` and Supabase, run, reset, test and deploy.
