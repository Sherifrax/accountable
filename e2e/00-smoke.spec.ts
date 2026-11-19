import { expect, test } from "./fixtures";

test("the app loads and shows the stages from the backend", async ({ page }) => {
  await page.goto("/");
  await expect(page.getByRole("heading", { name: "Accountable" })).toBeVisible();
  await expect(page.getByRole("list", { name: "Stages" }).getByRole("listitem")).toHaveText([
    "New", "Qualified", "Proposal", "Negotiation", "Won", "Lost",
  ]);
});
