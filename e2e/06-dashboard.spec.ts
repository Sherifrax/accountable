import { shortMoney } from "../frontend/src/lib/format";
import { API, expect, test } from "./fixtures";

type Dash = { tiles: { open_pipeline: { value: number; count: number }; won_this_month: { value: number }; win_rate: { percent: number; won: number; lost: number } } };
const tile = (page: import("@playwright/test").Page, label: string) => page.locator(".tile", { hasText: label });

test("the tiles match the data, and marking an open deal Won changes them by the right amounts", async ({ page, request }) => {
  const before: Dash = await (await request.get(`${API}/dashboard`)).json();
  await page.goto("/");
  await expect(tile(page, "Open pipeline").locator(".figure")).toHaveText(shortMoney(before.tiles.open_pipeline.value));
  await expect(tile(page, "Won this month").locator(".figure")).toHaveText(shortMoney(before.tiles.won_this_month.value));
  await expect(tile(page, "Win rate").locator(".figure")).toHaveText(`${before.tiles.win_rate.percent}%`);

  const deals: { id: number; name: string; stage: string; value: number }[] = await (await request.get(`${API}/deals`)).json();
  const deal = deals.find((d) => d.stage === "Negotiation")!;
  await page.getByRole("navigation", { name: "Main" }).getByRole("link", { name: "Deals" }).click();
  await page.getByRole("link", { name: deal.name, exact: true }).click();
  await page.getByLabel("Stage").selectOption("Won");
  await expect(page.getByRole("region", { name: "Details" })).toContainText("100%");
  await page.getByRole("navigation", { name: "Main" }).getByRole("link", { name: "Dashboard" }).click();

  const after: Dash = await (await request.get(`${API}/dashboard`)).json();
  expect(after.tiles.open_pipeline.value).toBe(before.tiles.open_pipeline.value - deal.value);
  expect(after.tiles.open_pipeline.count).toBe(before.tiles.open_pipeline.count - 1);
  expect(after.tiles.won_this_month.value).toBe(before.tiles.won_this_month.value + deal.value);
  expect(after.tiles.win_rate.won).toBe(before.tiles.win_rate.won + 1);
  await expect(tile(page, "Open pipeline").locator(".figure")).toHaveText(shortMoney(after.tiles.open_pipeline.value));
  await expect(tile(page, "Open pipeline")).toContainText(`${after.tiles.open_pipeline.count} open deals`);
  await expect(tile(page, "Won this month").locator(".figure")).toHaveText(shortMoney(after.tiles.won_this_month.value));
  await expect(tile(page, "Win rate").locator(".figure")).toHaveText(`${after.tiles.win_rate.percent}%`);
  // The full amount is in the tooltip.
  await tile(page, "Open pipeline").locator(".figure").hover();
  await expect(page.getByRole("tooltip").first()).toContainText(`$${after.tiles.open_pipeline.value.toLocaleString("en-US")}`);
});

test("a follow-up due tomorrow appears on the dashboard without a manual refresh", async ({ page, request }) => {
  const contacts: { id: number }[] = await (await request.get(`${API}/contacts`)).json();
  await page.goto("/");
  await expect(page.getByRole("region", { name: "Follow-ups" })).not.toContainText("Brand new follow-up");
  await page.getByRole("navigation", { name: "Main" }).getByRole("link", { name: "Contacts" }).click();
  await page.goto(`/contacts/${contacts[0].id}`);
  await page.getByRole("button", { name: "Log activity" }).click();
  const d = new Date();
  d.setDate(d.getDate() + 1);
  await page.getByRole("dialog").getByLabel("Description").fill("Brand new follow-up");
  await page.getByRole("dialog").getByLabel("Follow-up date (optional)").fill(d.toLocaleDateString("en-CA"));
  await page.getByRole("dialog").getByRole("button", { name: "Save" }).click();
  await expect(page.getByText("Activity logged")).toBeVisible();
  await page.getByRole("navigation", { name: "Main" }).getByRole("link", { name: "Dashboard" }).click();
  await expect(page.getByRole("region", { name: "Follow-ups" })).toContainText("Brand new follow-up");
  await expect(page.getByRole("region", { name: "Recent activity" })).toContainText("Brand new follow-up");
});
