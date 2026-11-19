import type { Locator, Page } from "@playwright/test";
import { API, expect, test } from "./fixtures";

type Deal = { id: number; name: string; stage: string; value: number; probability: number; position: number; close_date: string | null; late: boolean; expected_revenue: number };

const dollars = (n: number) => `$${Math.round(n).toLocaleString("en-US")}`;
const column = (page: Page, stage: string) => page.getByRole("region", { name: `${stage} column` });
const card = (page: Page, deal: Deal) => page.getByTestId(`card-${deal.id}`);
const getDeals = async (request: { get: (url: string) => Promise<{ json: () => Promise<unknown> }> }) =>
  (await (await request.get(`${API}/deals`)).json()) as Deal[];
const inColumn = (deals: Deal[], stage: string) => deals.filter((d) => d.stage === stage).sort((a, b) => a.position - b.position);

/** A mouse drag in small steps, so the drag library sees real movement. */
async function drag(page: Page, source: Locator, target: Locator, where: "center" | "top" | "bottom" = "center") {
  await target.scrollIntoViewIfNeeded();
  await source.scrollIntoViewIfNeeded();
  const s = (await source.boundingBox())!;
  const t = (await target.boundingBox())!;
  const x = t.x + t.width / 2;
  const y = where === "top" ? t.y + 6 : where === "bottom" ? t.y + t.height - 6 : t.y + t.height / 2;
  await page.mouse.move(s.x + s.width / 2, s.y + s.height / 2);
  await page.mouse.down();
  await page.mouse.move(s.x + s.width / 2 + 12, s.y + s.height / 2 + 12, { steps: 6 });
  await page.mouse.move(x, y, { steps: 25 });
  await page.waitForTimeout(150);
  await page.mouse.up();
}

const names = async (page: Page, stage: string) =>
  (await column(page, stage).locator(".card .name").allTextContents()).map((n) => n.trim());

test("dragging a card to another column changes its stage and probability, and the totals move at once", async ({ page, request }) => {
  const deals = await getDeals(request);
  const moving = inColumn(deals, "New")[1];
  await page.goto("/pipeline");

  const open = deals.filter((d) => !["Won", "Lost"].includes(d.stage));
  const boardBefore = open.reduce((s, d) => s + d.value, 0);
  const expectedBefore = open.reduce((s, d) => s + d.expected_revenue, 0);
  await expect(page.getByTestId("board-total")).toHaveText(dollars(boardBefore));
  await expect(page.getByTestId("board-expected")).toHaveText(dollars(expectedBefore));

  // Hold the server's reply back, to see the board change before it answers.
  let release: () => void = () => {};
  const held = new Promise<void>((resolve) => (release = resolve));
  await page.route("**/api/deals/*/move", async (route) => {
    await held;
    await route.continue();
  });

  await drag(page, card(page, moving), page.getByTestId("cards-Proposal"));

  const newProposalProbability = 50;
  const proposalBefore = inColumn(deals, "Proposal");
  await expect(column(page, "Proposal").getByTestId(`card-${moving.id}`)).toBeVisible();
  await expect(page.getByTestId("total-Proposal")).toHaveText(dollars(proposalBefore.reduce((s, d) => s + d.value, 0) + moving.value));
  await expect(page.getByTestId("total-New")).toHaveText(
    dollars(inColumn(deals, "New").reduce((s, d) => s + d.value, 0) - moving.value),
  );
  const expectedAfter = expectedBefore - moving.expected_revenue + (moving.value * newProposalProbability) / 100;
  await expect(page.getByTestId("board-expected")).toHaveText(dollars(expectedAfter));
  await expect(page.getByTestId("board-total")).toHaveText(dollars(boardBefore)); // still open, so unchanged

  release();
  await expect(page.getByText("Couldn't save the move")).toHaveCount(0);
  await expect.poll(async () => (await getDeals(request)).find((d) => d.id === moving.id)?.stage).toBe("Proposal");

  // The deals table shows the new stage and probability (success criterion 4).
  await page.goto("/deals");
  const row = page.getByRole("table").getByRole("row").filter({ hasText: moving.name });
  await expect(row).toContainText("Proposal");
  await expect(row).toContainText("50%");
});

test("dropping on Won sets the close date to today", async ({ page, request }) => {
  const deals = await getDeals(request);
  const moving = inColumn(deals, "Negotiation")[0];
  await page.goto("/pipeline");
  // Won sits near the edge of a 1440px window; scroll the board so the drop is well inside it.
  await page.locator(".board").evaluate((el) => (el.scrollLeft = el.scrollWidth));
  await drag(page, card(page, moving), page.getByTestId("cards-Won"));
  await expect.poll(async () => (await getDeals(request)).find((d) => d.id === moving.id)?.stage).toBe("Won");
  const today = new Date();
  const iso = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, "0")}-${String(today.getDate()).padStart(2, "0")}`;
  const after = (await getDeals(request)).find((d) => d.id === moving.id)!;
  expect(after.close_date).toBe(iso);
  expect(after.probability).toBe(100);
  await expect(column(page, "Won").getByTestId(`card-${moving.id}`)).toContainText(
    today.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }),
  );
});

test("a card moved up and down in its own column stays there after a refresh", async ({ page, request }) => {
  const deals = await getDeals(request);
  const col = inColumn(deals, "New");
  expect(col.length).toBeGreaterThanOrEqual(4);
  await page.goto("/pipeline");
  const before = await names(page, "New");
  expect(before).toEqual(col.map((d) => d.name));

  // The top card, dropped on the lower half of the third card.
  await drag(page, card(page, col[0]), card(page, col[2]), "bottom");
  await expect.poll(async () => inColumn(await getDeals(request), "New").map((d) => d.name)).toEqual([before[1], before[2], before[0], ...before.slice(3)]);
  await page.reload();
  expect(await names(page, "New")).toEqual([before[1], before[2], before[0], ...before.slice(3)]);

  // The same card, back to the top.
  const now = inColumn(await getDeals(request), "New");
  await drag(page, card(page, now[2]), card(page, now[0]), "top");
  await expect.poll(async () => inColumn(await getDeals(request), "New").map((d) => d.name)).toEqual(before);
  await page.reload();
  expect(await names(page, "New")).toEqual(before);
  expect(inColumn(await getDeals(request), "New").map((d) => d.position)).toEqual(before.map((_, i) => i));
});

test("a card can be moved with the keyboard", async ({ page, request }) => {
  const deals = await getDeals(request);
  const moving = inColumn(deals, "Qualified")[0];
  await page.goto("/pipeline");
  await card(page, moving).focus();
  await page.keyboard.press("Space"); // pick up
  // Each arrow press moves it over the next place to the right, until it is in Proposal.
  const inProposal = column(page, "Proposal").getByTestId(`card-${moving.id}`);
  for (let i = 0; i < 6 && (await inProposal.count()) === 0; i++) {
    await page.keyboard.press("ArrowRight");
    await page.waitForTimeout(250);
  }
  await expect(inProposal).toHaveCount(1);
  await page.keyboard.press("Space"); // drop
  await expect.poll(async () => (await getDeals(request)).find((d) => d.id === moving.id)?.stage).toBe("Proposal");
  await expect(column(page, "Proposal").getByTestId(`card-${moving.id}`)).toBeVisible();
});

test("the + on a column adds a deal at that stage, at the top", async ({ page, request }) => {
  await page.goto("/pipeline");
  await column(page, "Qualified").getByRole("button", { name: "Add deal to Qualified" }).click();
  const dialog = page.getByRole("dialog");
  await expect(dialog.getByLabel("Stage")).toHaveValue("Qualified");
  await dialog.getByLabel("Name").fill("Brand new deal");
  await dialog.getByLabel("Value (USD)").fill("7500");
  await dialog.getByRole("button", { name: "Save" }).click();
  await expect(page.getByText("Deal saved")).toBeVisible();
  expect((await names(page, "Qualified"))[0]).toBe("Brand new deal");
  const created = (await getDeals(request)).find((d) => d.name === "Brand new deal")!;
  expect(created).toMatchObject({ stage: "Qualified", position: 0, probability: 25 });
  await page.reload();
  expect((await names(page, "Qualified"))[0]).toBe("Brand new deal");
});

test("late cards show the Late tag, and only they do", async ({ page, request }) => {
  const deals = await getDeals(request);
  const late = deals.filter((d) => d.late);
  expect(late.length).toBeGreaterThanOrEqual(3);
  await page.goto("/pipeline");
  for (const d of late) await expect(card(page, d)).toContainText("Late");
  for (const d of deals.filter((x) => !x.late).slice(0, 8)) await expect(card(page, d)).not.toContainText("Late");
  await expect(page.locator(".card.late")).toHaveCount(late.length);
});

test("a click on a card opens the deal", async ({ page, request }) => {
  const deal = (await getDeals(request))[0];
  await page.goto("/pipeline");
  await card(page, deal).locator(".org").click();
  await expect(page).toHaveURL(new RegExp(`/deals/${deal.id}$`));
});

test("when the server refuses a move, the card goes back with a message", async ({ page, request, consoleProblems }) => {
  const deals = await getDeals(request);
  const moving = inColumn(deals, "New")[0];
  await page.goto("/pipeline");
  await page.route("**/api/deals/*/move", (route) =>
    route.fulfill({ status: 500, contentType: "application/json", body: JSON.stringify({ detail: "Broken" }) }),
  );
  await drag(page, card(page, moving), page.getByTestId("cards-Proposal"));
  await expect(page.getByText("Couldn't save the move. Try again.")).toBeVisible();
  await expect(column(page, "New").getByTestId(`card-${moving.id}`)).toBeVisible();
  expect((await getDeals(request)).find((d) => d.id === moving.id)?.stage).toBe("New");
  expect(await names(page, "New")).toEqual(inColumn(deals, "New").map((d) => d.name));
  // The browser logs the failed request itself. That one line is expected here, nothing else.
  expect(consoleProblems).toEqual([expect.stringContaining("500")]);
  consoleProblems.length = 0;
});
