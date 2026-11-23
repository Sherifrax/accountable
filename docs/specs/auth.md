# 2.10 Sign-in and users

Accountable is shared by a small team on the web. Everyone signs in with an email and a password held by Supabase Auth, and everyone works on the same data. There are no roles: every signed-in user can do everything.

- **R-AUTH-1** Signed out, every page of the app shows the sign-in screen and nothing else. After signing in, the user lands on the page they asked for (a link to a deal opens that deal).
- **R-AUTH-2** The sign-in screen has an email field, a password field and a "Sign in" button. A wrong email or password shows "That email and password don't match." A network failure shows "Couldn't reach the sign-in service. Try again." The password is never shown or stored by Accountable.
- **R-AUTH-3** There is no sign-up page, no password reset, no Google sign-in and no magic link. The screen says "Accounts are added by your team's admin." People are added in Supabase's dashboard.
- **R-AUTH-4** The browser holds only `SUPABASE_URL` and the publishable key. It never holds the database address or any secret key.
- **R-AUTH-5** Every `/api` route needs a valid access token from Supabase, sent as `Authorization: Bearer <token>`. With no token, a bad token or an expired token, the route answers 401 with `{"detail": "Sign in to continue."}` and does nothing. The only routes that answer without a token are the built frontend files and `GET /healthz` (see R-DEP-5), and none of them returns data.
- **R-AUTH-6** The backend checks the token on every request: its signature against Supabase's public signing keys (fetched from `SUPABASE_URL` and kept in memory), that it hasn't expired, that it was issued for `SUPABASE_URL`, and that its audience is `authenticated`. The user's email comes from the token. A token without an email is refused.
- **R-AUTH-7** The user is only ever taken from the token. Any user, `created_by` or `updated_by` field in a request body, query or header is ignored.
- **R-AUTH-8** If the token expires or the user is removed while the app is open, the next request answers 401, the app goes back to the sign-in screen and says "Your session ended. Sign in again." The Supabase client renews the token before it expires, so this only happens when the session truly ended.
- **R-AUTH-9** Signing out ends the session, clears everything the app cached, and shows the sign-in screen. Signing out in one tab signs out the others.
- **R-AUTH-10** While the app checks for a saved session, it shows a blank page with a small spinner, not the sign-in screen, so a signed-in user doesn't see it flash.
- **R-AUTH-11** **Test sign-in.** The end-to-end tests and the ui-check agent run the app in test mode. In test mode the backend accepts tokens signed with a fixed test key instead of Supabase's, and the frontend signs in through the same screen against the backend's own `POST /api/test/session`, which exists only in test mode. Nothing in test mode contacts Supabase, whatever is in `.env`, and no real password is needed. Test mode is switched on only by the test runners, and the backend refuses to start in test mode if `DATABASE_URL` isn't a SQLite file, or if it's running on Render.
- **R-AUTH-12** If `DATABASE_URL`, `SUPABASE_URL` or `SUPABASE_PUBLISHABLE_KEY` is missing outside test mode, the backend doesn't start and says which one is missing.

## Who added it, who changed it

- **R-AUTH-13** Every organization, contact, deal and activity records who added it and who last changed it, and when. Both are the signed-in user's email at the time. Stage-change entries record the user who moved the deal.
- **R-AUTH-14** Adding a record sets added by and last changed by to the same user. Any change through the API sets last changed by to the user making it. Changing the order of other deals in a column when one is moved doesn't count as changing them.
- **R-AUTH-15** Records that were loaded as sample data have no user. The app shows "Sample data" for both until someone changes them.
- **R-AUTH-16** If a user is later removed from Supabase, the records keep their email.
- **R-AUTH-17** Where it's shown: each record page (organization, contact, deal) says "Added by name@example.com on Mar 4, 2026" and "Last changed by name@example.com on Mar 9, 2026" in its details. Every timeline entry, including stage changes, adds "by name@example.com" to its muted line. Tables don't get an extra column.
