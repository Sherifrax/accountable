# 2.2 Data rules

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
- **R-DATA-8** "Today" is the date, in the time zone of the computer running the backend, which is UTC on Render. Late deals, overdue follow-ups, "Won this month" and the close date set on Won or Lost all use it.
- **R-DATA-12** Timestamps (when an activity happened, and when a record was added or changed) are stored in UTC and shown in the viewer's own time zone. Dates without a time (close date, follow-up date) are stored and shown as they are.

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
- **R-DATA-13** Who added and last changed every record is recorded as `docs/specs/auth.md` says (R-AUTH-13 to R-AUTH-17). Users can't set it.

**Deleting**

- **R-DEL-1** Deleting an organization keeps its contacts and deals, with no organization.
- **R-DEL-2** Deleting a contact keeps their deals, with no main contact.
- **R-DEL-3** Deleting a contact deletes the activities linked only to that contact. Activities that are also linked to a deal stay, with no contact. The same goes for deleting a deal: activities linked only to it are deleted, and activities also linked to a contact stay, with no deal. Stage-change entries are always deleted with their deal.
- **R-DEL-4** Before deleting, a confirmation dialog names the record and says exactly what happens, with counts. For example: "Delete Northwind Logistics? Its 4 contacts and 3 deals will be kept, with no organization. This can't be undone."
- **R-DEL-5** Deleting an activity asks first. Stage-change entries can't be deleted on their own.
