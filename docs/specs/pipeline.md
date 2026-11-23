# 2.5 Pipeline

- **R-PIPE-1** Six columns in stage order. Each column header shows the stage name, the number of deals, the total value and the expected revenue.
- **R-PIPE-2** Above the board, two figures for open deals only: total value and expected revenue.
- **R-PIPE-3** Each card shows the deal name, the organization, the value, the close date and the contact. Late cards show the Raspberry "Late" tag and a Raspberry tint behind the date.
- **R-PIPE-4** Dragging a card to another column changes its stage (with R-DATA-2, R-DATA-3 and R-DATA-4). Dragging within a column changes its place. The card stays exactly where it was dropped, including after a refresh.
- **R-PIPE-5** All totals update as soon as the card is dropped, before the server replies. If the server rejects the move, the card goes back and a message says the move didn't save.
- **R-PIPE-6** Each column has a "+" button that opens the new-deal form with that stage chosen. The new card goes to the top of that column.
- **R-PIPE-7** Won and Lost show every deal ever won or lost. The columns scroll on their own if long.
- **R-PIPE-8** Clicking a card (without dragging) opens the deal's page.
- **R-PIPE-9** Cards can also be moved with the keyboard (the drag library's keyboard support).
- **R-PIPE-10** Several people may use the board at once. A move saves the user as the deal's last changer. Other people's moves show up the next time the board is loaded or refreshed by the app's normal refetching, not live, and a drop is never silently lost: if the server rejects a move, R-PIPE-5 applies.
