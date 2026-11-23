# 4. Design

## 4.1 Principles

Calm, dense enough for daily work, and quick to scan. White panels on a soft grey-blue page, with Midnight ink. In the dark theme, black panels on a deep Midnight page, with Sea Mist ink. Color carries meaning (stage, status, alert) and isn't decoration. Numbers are set in JetBrains Mono so columns of figures line up.

## 4.2 Design tokens

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

  /* Surfaces (light theme; the dark theme is below) */
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

**Dark theme.** Chosen from the menu, or by System when the device is set to dark (R-MENU). It sets `data-theme="dark"` on the page's root and overrides only the values below. The page is `#04232E` and panels are black, as the brand says, with Sea Mist ink. The `*-ink` text shades go lighter, because the light-theme ones are too dark on black. The brand colors themselves, the stage colors and the Midnight text on Sea Green, Marigold and Coral fills stay the same.

```css
:root[data-theme="dark"] {
  --page: #04232E;
  --panel: #000000;
  --panel-sunken: #0A1418;      /* table header, inputs */
  --hover: #11262E;
  --ink: #CDD8DB;               /* Sea Mist */
  --ink-muted: #8FA9B2;
  --ink-faint: #5E7983;         /* decoration and disabled only, never needed text */
  --divider: #14262D;

  --sea-green-ink: #06D6A0;     --marigold-ink: #FFC145;
  --coral-ink: #F78C6B;         --cerulean-ink: #47B5DB;
  --raspberry-ink: #FF7C99;

  --stage-negotiation: #6C97A5; /* lighter, so it reads on black */

  --shadow-panel: none;         /* shadows don't show on black; the color step does the work */
  --shadow-lift: 0 8px 24px rgba(0,0,0,.6);
}
```

Dark-theme rules: panels have no outline in either theme. Tag tints are still about 18% of the color behind the `*-ink` text. The sidebar stays Midnight in both themes, and the sign-in screen, charts, tooltips, dialogs, menus and toasts use the same tokens, so nothing needs its own dark styles. The charts' series colors are the brand colors in both themes; their gridlines and axis labels use `--divider` and `--ink-muted`. The `*-ink` and `--ink-*` values are chosen to reach 4.5:1 on their surface (white in light, black in dark), except `--ink-faint`. Check them with a contrast tool during the build and adjust them if needed.

In the light theme, the text shades (`*-ink`) are chosen to reach at least 4.5:1 on white.

**Font loading**: the Fontsource packages use `font-display: swap`, so text shows straight away in the secondary font and switches to the brand font once it loads. The secondary fonts are ones every Mac, Windows and Linux machine already has, so nothing is downloaded. Figures use `font-variant-numeric: tabular-nums` so they still line up in the secondary mono font.

**Type scale**: page title 28/36 semibold. Section title 18/26 semibold. Body 14/20 regular. Small label 12/16 medium, in `--ink-muted`. Figure tiles 32/40 mono medium. Table money and dates use mono 13/20.

**Spacing**: a 4px grid. Panel padding is 20px, the gap between panels is 16px, and table rows are 44px tall.

## 4.3 Layout

- **Sidebar** (232px, fixed, Midnight background, Sea Mist text): the wordmark "Accountable" in Instrument Sans semibold, with a short tagline under it in Instrument Serif italic ("Sales, in order."). Below that, nav items with Lucide icons: Dashboard, Pipeline, Deals, Organizations, Contacts. The active item has a Sea Green pill behind it with Midnight text.
- **Top bar** (at the top of the main area, 56px tall, 32px side padding, on the page background with no line or shadow under it): the search box on the left, and the user menu button on the right. It stays in view when the page scrolls, and has the page background so content slides under it without showing through a line.
- **Main area** (page background, max content width 1440px, 32px padding): a page header with the title on the left and the main action on the right (such as "New deal"), then the content.
- Panels: white, `--radius-panel`, `--shadow-panel`, with no border. There's no line along the top of the page and no single-edge accents on panels, as the brand asks.

## 4.4 Components

- **Buttons**: primary has a Sea Green fill and Midnight text. Secondary has a `--panel-sunken` fill and Midnight text. Danger has a Raspberry fill and white text, semibold at 14px. Ghost (icon buttons in rows) is transparent and gets `--hover` on hover. Height 36px, `--radius-control`.
- **Tags and chips**: a pill with the color at about 18% tint behind the matching `*-ink` text, 12px medium.
  - Contact status: Lead = Coral, Qualified = Marigold, Customer = Sea Green. These are the brand's three side-by-side colors, with Sea Green kept for the best status.
  - Stage: the stage color, as a small dot plus the name.
  - Late or Overdue: Raspberry tint with Raspberry ink.
- **Tables**: inside a panel. The header row is sticky, with a `--panel-sunken` background and 12px muted labels. Row dividers use `--divider`, and rows get `--hover` on hover. Money is right-aligned in mono. Row actions (Edit, Delete) show on hover and focus, as icon buttons with tooltips.
- **Search box**: in the panel's header, left-aligned, with a search icon and the placeholder "Search deals". This is the table's own filter.
- **Top bar search**: a 480px-wide box, 36px tall, `--panel` fill, `--radius-control`, with a search icon and the placeholder "Search organizations, contacts and deals". Its results panel is a menu-style panel (`--panel`, `--shadow-lift`, `--radius-control`) the same width as the box. Group headings are 12px muted labels. A result is two lines: the name in 14px, and the second line in 12px muted. The highlighted result has a `--hover` fill. The part of the name that matched is semibold.
- **User menu**: the button is a 36px circle with a Cerulean fill and white initials in 14px semibold (large enough for white on Cerulean, Concern 2). Its menu is 240px wide, in the same style as the search results panel. From the top: the email in 12px muted text, a Theme group with Light, Dark and System as three radio rows (a Lucide sun, moon and monitor icon, and a check on the chosen one), a row divider, then "Sign out" with a log-out icon. The focused row has a `--hover` fill.
- **Dialogs**: white, 16px radius, 520px wide, with the title in 18px semibold. Forms use labels above fields. The footer has Cancel (secondary) and Save (primary). Delete confirmations put the consequence sentence in body text and use a Danger button labeled with the action ("Delete organization").
- **Timeline**: a vertical list. Each entry has a round icon badge (note, call, email, or an arrow for stage changes in the target stage's color), the description, then a muted line with the date, type and linked record. Follow-ups add a checkbox and date chip.
- **Toasts**: bottom right. White, with a lift shadow and short text ("Deal saved", "Couldn't save the move. Try again.").
- **Money**: always with its currency symbol: `$12,500`. Large figures in tiles may be shortened (`$1.2M`), with the full amount in a tooltip.
- **Dates**: `Mar 4, 2026` in tables and `Mar 4, 2026, 2:15 PM` in timelines. Relative wording ("in 3 days", "5 days overdue") is used for follow-ups only.

## 4.5 Screens

**Dashboard** (12-column grid):
- Row 1: four figure tiles (3 columns each). Each has a muted label, a large mono figure and a small line of context ("12 open deals", "+18% on last month" in Sea Green ink, or a Raspberry-ink figure for a fall).
- Row 2: the revenue won line chart (8 columns). It's a smooth Sea Green line with a soft Sea Green area fill under it, the only gradient on the page. Next to it, the follow-ups panel (4 columns).
- Row 3: the pipeline funnel (7 columns). It's drawn as centered horizontal bars in stage colors that narrow from New to Won, with the value in mono and the share kept from the stage before. Under it, the stacked open-pipeline bar. Next to it, the won and lost bar chart (5 columns).
- Row 4: recent activity (full width, two columns of entries).
- Charts use light horizontal gridlines only, muted mono axis labels and tooltips styled as small white panels.

**Sign-in screen** (shown signed out, instead of the sidebar and top bar): one panel, 400px wide, centered on the page background, `--radius-panel`, 32px padding. At the top, the wordmark "Accountable" in Instrument Sans semibold, with the tagline "Sales, in order." under it in Instrument Serif italic. Then Email and Password fields with labels above, a full-width primary "Sign in" button, and an error line in Raspberry ink above the button when sign-in fails. Under the button, a muted line: "Accounts are added by your team's admin." There is no link to sign up or to reset a password.

**Record pages** also carry who added and last changed the record: two muted 12px lines at the bottom of the details panel, as "Added by name@example.com on Mar 4, 2026" and "Last changed by name@example.com on Mar 9, 2026". Sample records read "Added by Sample data". Timeline entries add "by name@example.com" to the muted line, after the date.

**Pipeline**: the two board totals sit in the page header, next to the "New deal" button. Six columns, each 280px wide, scroll sideways if the window is narrow. Column headers show a stage dot, the name, the count, then the total and expected revenue in mono. Cards are white panels with a 10px radius. The name is semibold, the organization muted, and the value in mono at the bottom left with the close date at the bottom right. A dragged card lifts (`--shadow-lift`, slight tilt), and its drop place shows as a dashed outline slot in the column. Columns have a faint tint of their stage color (about 6%) to tell them apart without borders.

**Tables (Organizations, Contacts, Deals)**: page header with the title and "New …" button. One panel holds the search box (and the status filter as segmented pills on Contacts), then the table.

**Record pages**: a header panel with the name in 28px, key facts as chips (status, stage, late), and the actions on the right. Below it, two columns: details and linked records on the left (5 columns), and the timeline on the right (7 columns), with "Log activity" at the top of the timeline.

## 4.6 Tone in the interface

Short labels in sentence case: "New deal", "Log activity", "Mark done". Empty states say what's missing and what to do: "No follow-ups due. Log one from a contact or deal." There are no exclamation marks and no jargon. Errors say what happened and what to try.
