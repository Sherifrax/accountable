# 2.11 Search

A search box in the top bar finds any organization, contact or deal from any page. It's separate from the search box inside each table (R-TBL-1), which only filters that table.

- **R-SRCH-1** The top bar shows a search box on every page while signed in, with the placeholder "Search organizations, contacts and deals".
- **R-SRCH-2** As the user types, a results panel opens under the box. Results are grouped under Organizations, Contacts and Deals, with up to 5 in each group. A group with no match is left out.
- **R-SRCH-3** A record matches when the text typed, with spaces trimmed from both ends, appears anywhere in its name. Case doesn't matter, so "acme", "ACME" and "Acme" find the same records. Only names are searched. Searching with nothing typed shows nothing.
- **R-SRCH-4** Within a group, names that start with the text come first, then the rest, each A–Z.
- **R-SRCH-5** Each result shows the name and a muted second line: for a contact, their organization and job title; for a deal, its organization and stage; for an organization, its industry. Missing parts are left out.
- **R-SRCH-6** Clicking a result, or choosing it with the arrow keys and Enter, opens the record's page and closes the panel. Escape closes the panel and keeps the text. Clicking elsewhere closes it.
- **R-SRCH-7** If nothing matches, the panel says "Nothing matches 'xyz'."
- **R-SRCH-8** The search works the same on SQLite and on Postgres, including for names with accents and other non-English letters. "ÉCOLE" finds "École Nord".
- **R-SRCH-9** The backend does the search (`GET /api/search?q=`), so it stays right when the lists grow. Typing doesn't send a request for every key: the app waits briefly for typing to stop, and ignores any answer that is out of date.
- **R-SRCH-10** The box can be reached by Tab as the first stop after the sidebar. The results panel is a listbox, announced to screen readers with the number of results.
