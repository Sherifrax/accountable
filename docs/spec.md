# Spec: the Accountable MVP

This spec turns `docs/intent.md` into requirements and a design. It is split by product area: this file is the summary and the index, and the detail lives in `docs/specs/`. The stack is in `docs/TECH_STACK.md`. The look follows the brand skill (`.claude/skills/brand`). Where this spec and the intent disagree, the intent wins, and this spec should be fixed.

## Summary

Accountable is a small sales CRM for one person on one computer. It has five sections: a dashboard, a pipeline board, and tables for deals, organizations and contacts. Organizations, contacts, deals and activities are the four kinds of record. Deals move through six stages (New, Qualified, Proposal, Negotiation, Won, Lost), each with a usual probability, and every stage change is written to the deal's timeline. Activities (notes, calls, emails and follow-ups) hang off contacts and deals, and follow-ups show on the dashboard until they're done. Data is stored in a local SQLite file and loaded with sample data. The backend is FastAPI with SQLAlchemy Core, the frontend is React, and the look follows the brand skill.

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
| `docs/specs/architecture.md` | Folder layout, libraries, data model, API, frontend data flow, tests | |
| `docs/specs/design.md` | Tokens, layout, components, screens, tone | |

## 1. Scope

In: the five sections, the four kinds of record, local storage that survives restarts, sample data, a reset command, and the tests described in `docs/TECH_STACK.md`.

Out, as the intent says: sign-in, several users, dark mode, phone layouts, AI, integrations, other currencies, extra reports, tags, custom fields, editable stages, import and export.

## 2. Requirements

Requirement IDs (R-…) are referenced by the tests.

The requirements, architecture and design are in the area files listed in the index.

## 5. Definition of done

All eight success criteria in `docs/intent.md` are met, `npm test` passes, and someone has used every section and action in a real browser with the console open and found no errors. `docs/STATUS.md` explains how to install, run, reset and test.
