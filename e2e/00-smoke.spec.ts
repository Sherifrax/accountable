import { expect, test } from "./fixtures";

test("the app loads with its sidebar, and the backend answers through the proxy", async ({ page, request }) => {
  await page.goto("/");
  await expect(page.getByText("Accountable", { exact: true })).toBeVisible();
  await expect(page.getByRole("navigation", { name: "Main" }).getByRole("link")).toHaveText([
    "Dashboard", "Pipeline", "Deals", "Organizations", "Contacts",
  ]);
  const stages = await request.get("/api/stages");
  expect((await stages.json()).map((s: { name: string }) => s.name)).toEqual([
    "New", "Qualified", "Proposal", "Negotiation", "Won", "Lost",
  ]);
});
