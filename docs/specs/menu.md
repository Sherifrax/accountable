# 2.12 User menu and theme

- **R-MENU-1** At the right of the top bar, a round button shows the user's initials. It opens a menu below it. Escape or a click outside closes it, and focus goes back to the button.
- **R-MENU-2** Initials come from the email. The part before the "@" is split at ".", "_", "-" and "+". With two or more parts, the first letter of the first two parts is used ("abdalrahman.elsaid@…" gives "AE"). With one part, its first two letters are used ("sam@…" gives "SA"). They are shown in capitals.
- **R-MENU-3** The menu shows, from the top: the user's full email in muted text; a Theme choice with three options, Light, Dark and System, one marked as chosen; and "Sign out".
- **R-MENU-4** The theme applies the moment it's chosen, without a reload, and the menu stays open so the change can be seen.
- **R-MENU-5** The choice is remembered in the browser, so each computer keeps its own. It isn't stored with the user, and it isn't sent to the server. If nothing is remembered, the theme is System.
- **R-MENU-6** System follows the device's light or dark setting, and changes when the device's setting changes, without a reload.
- **R-MENU-7** The theme is applied before the page first paints, so there's no flash of the wrong theme. The sign-in screen follows it too.
- **R-MENU-8** If the browser won't let the app remember the choice, the theme still works until the page is closed, and nothing is shown as an error.
- **R-MENU-9** Both themes follow the brand and the tokens in `docs/specs/design.md`.
