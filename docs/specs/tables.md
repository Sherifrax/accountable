# 2.3 Tables (Organizations, Contacts, Deals)

- **R-TBL-1** Each table has a search box that matches any visible text column as you type, ignoring case. It filters only that table. The top bar's search (`docs/specs/search.md`) is separate.
- **R-TBL-2** Clicking a column heading sorts by it. Clicking again reverses the order. An arrow shows the current sort.
- **R-TBL-3** A "New …" button opens a form to add a record. Each row has Edit and Delete actions. Clicking anywhere else on a row opens the record's page.
- **R-TBL-4** The columns are:
  - Organizations: name, industry, website, number of contacts, number of open deals, open pipeline value.
  - Contacts: name, organization, job title, email, phone, status. Above the table, a status filter: All, Lead, Qualified, Customer, each with its count.
  - Deals: name, organization, contact, stage, value, probability, expected revenue, close date. Late deals show a Raspberry "Late" tag next to the close date.
- **R-TBL-5** When there's nothing to show, the table says so in plain words, such as "No contacts match 'acme'."
- **R-TBL-6** The default sort is name A–Z for organizations and contacts, and close date (soonest first) for deals.
