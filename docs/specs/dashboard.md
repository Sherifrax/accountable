# 2.7 Dashboard

- **R-DASH-1** A row of four figure tiles:
  - **Open pipeline**: total value of open deals, with the count.
  - **Expected revenue**: total expected revenue of open deals.
  - **Won this month**: revenue won this calendar month, with the change from last month as a percentage.
  - **Win rate**: deals won ÷ (won + lost) over the last 12 months, by close date.
- **R-DASH-2** **Line chart: revenue won by month**, for the last 12 months including this one, by close date. Hovering shows the month, the revenue and the number of deals.
- **R-DASH-3** **Bar chart: deals won and lost by month**, for the same 12 months, as two series side by side (Won in Sea Green, Lost in grey).
- **R-DASH-4** **Pipeline funnel**: one bar per stage from New to Won, each as wide as the value of deals that reached that stage. A deal reached a stage if its current stage or any stage in its history is that stage or later. Lost isn't later than anything, and a deal created at a later stage counts as having passed the earlier ones. Each bar shows its value and the share kept from the stage before it. Next to the funnel, a stacked bar shows today's open pipeline by stage.
- **R-DASH-5** **Follow-ups**: overdue ones first (oldest first, Raspberry tag), then those due in the next 7 days (soonest first). Each shows the description, the contact or deal, the date and a done checkbox. If there are none, it says "Nothing due this week."
- **R-DASH-6** **Recent activity**: the 10 newest activities and stage changes across everything, each linking to its record.
- **R-DASH-7** Every figure comes from the current data. Marking a deal won or logging a follow-up shows on the dashboard the next time it's opened, without a manual refresh.
