# 2.9 Quality

- **R-Q-1** No errors or warnings in the browser console during normal use, including on the sign-in screen and in both themes.
- **R-Q-2** Every action gives visible feedback: a short message after saving or deleting, and a clear message if something fails.
- **R-Q-3** Forms show errors next to the field, in plain words ("Name is required").
- **R-Q-4** It works well at laptop and desktop widths, from 1280px up. Below that, it can scroll sideways but must not break.
- **R-Q-5** Keyboard use: every action can be reached by Tab, dialogs and the user menu close with Escape (dialogs also trap focus), and focus is clearly visible.
- **R-Q-6** Every unit test, frontend and backend, old and new, runs in under a second on a developer's computer, because CI runs on a much slower machine. Tests that need a database use SQLite in memory or a temporary file, and never wait on the network.
- **R-Q-7** Text and controls meet the contrast rules in both themes (see `docs/specs/design.md`).
