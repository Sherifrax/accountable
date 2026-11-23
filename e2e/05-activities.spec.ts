import type { Page } from "@playwright/test";
import { API, expect, test } from "./fixtures";

type Deal = { id: number; name: string; stage: string; contact_id: number | null; contact_name: string | null };
const timeline = (page: Page) => page.getByRole("region", { name: "Timeline" });
const dialog = (page: Page) => page.getByRole("dialog");

function tomorrow() {
  const d = new Date();
  d.setDate(d.getDate() + 1);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

test("log a note and a call, see them newest first, follow the deal's stage change, and tick the follow-up", async ({
  page,
  request,
}) => {
  const deals: Deal[] = await (await request.get(`${API}/deals`)).json();
  const deal = deals.find((d) => d.stage === "New" && d.contact_id)!;

  // A note on the contact.
  await page.goto(`/contacts/${deal.contact_id}`);
  await page.getByRole("button", { name: "Log activity" }).click();
  await dialog(page).getByLabel("Description").fill("Intro chat about their needs");
  await dialog(page).getByRole("button", { name: "Save" }).click();
  await expect(page.getByText("Activity logged")).toBeVisible();
  await expect(timeline(page).getByRole("listitem").first()).toContainText("Intro chat about their needs");

  // A call with a follow-up on the deal.
  await page.goto(`/deals/${deal.id}`);
  await page.getByRole("button", { name: "Log activity" }).click();
  await dialog(page).getByLabel("Type").selectOption("call");
  await dialog(page).getByLabel("Description").fill("Pricing call with a callback");
  await dialog(page).getByLabel("Follow-up date (optional)").fill(tomorrow());
  await dialog(page).getByRole("button", { name: "Save" }).click();
  const first = timeline(page).getByRole("listitem").first();
  await expect(first).toContainText("Pricing call with a callback");
  await expect(first).toContainText("Call");
  await expect(first).toContainText("Follow up");
  await expect(first).toContainText(deal.contact_name!); // the deal's contact was added

  // Move the deal: a stage-change entry appears, with no edit or delete.
  await page.getByLabel("Stage").selectOption("Qualified");
  await expect(timeline(page).getByRole("listitem").first()).toContainText("Moved from New to Qualified");
  await expect(timeline(page).getByRole("listitem").first().getByRole("button", { name: "Edit activity" })).toHaveCount(
    0,
  );

  // The deal's call is on its contact's timeline too, newest first.
  await page.goto(`/contacts/${deal.contact_id}`);
  const items = await timeline(page).getByRole("listitem").allTextContents();
  const call = items.findIndex((t) => t.includes("Pricing call with a callback"));
  const note = items.findIndex((t) => t.includes("Intro chat about their needs"));
  expect(call).toBeGreaterThanOrEqual(0);
  expect(call).toBeLessThan(note);
  expect(items[0]).toContain("Moved from New to Qualified");

  // On the dashboard, then ticked off there.
  await page.getByRole("link", { name: "Dashboard" }).click();
  const followUps = page.getByRole("region", { name: "Follow-ups" });
  await expect(followUps).toContainText("Pricing call with a callback");
  await expect(followUps).toContainText("in 1 day");
  await followUps.getByRole("checkbox", { name: "Mark done: Pricing call with a callback" }).click();
  await expect(followUps).not.toContainText("Pricing call with a callback");

  // ...and ticked in the timeline.
  await page.goto(`/deals/${deal.id}`);
  await expect(timeline(page).getByRole("checkbox", { name: /Mark not done: Pricing call/ })).toBeChecked();
});

test("overdue follow-ups are tagged, and edit and delete work with a confirmation", async ({ page, request }) => {
  await page.goto("/");
  const followUps = page.getByRole("region", { name: "Follow-ups" });
  expect(await followUps.getByText("Overdue", { exact: true }).count()).toBeGreaterThanOrEqual(3);
  await expect(followUps.getByText("Today")).toBeVisible();

  const deals: Deal[] = await (await request.get(`${API}/deals`)).json();
  const deal = deals[0];
  await page.goto(`/deals/${deal.id}`);
  await page.getByRole("button", { name: "Log activity" }).click();
  await dialog(page).getByLabel("Description").fill("To be edited");
  await dialog(page).getByRole("button", { name: "Save" }).click();
  const item = timeline(page).getByRole("listitem").first();
  await item.getByRole("button", { name: "Edit activity" }).click({ force: true });
  await dialog(page).getByLabel("Description").fill("Edited text");
  await dialog(page).getByLabel("Follow-up date (optional)").fill(tomorrow());
  await dialog(page).getByLabel("Follow-up is done").check();
  await dialog(page).getByRole("button", { name: "Save" }).click();
  await expect(timeline(page).getByRole("listitem").first()).toContainText("Edited text");
  await expect(timeline(page).getByRole("listitem").first()).toContainText("Done");

  await timeline(page)
    .getByRole("listitem")
    .first()
    .getByRole("button", { name: "Delete activity" })
    .click({ force: true });
  await expect(dialog(page)).toContainText("Delete this note? This can't be undone.");
  await dialog(page).getByRole("button", { name: "Cancel" }).click();
  await expect(timeline(page)).toContainText("Edited text");
  await timeline(page)
    .getByRole("listitem")
    .first()
    .getByRole("button", { name: "Delete activity" })
    .click({ force: true });
  await dialog(page).getByRole("button", { name: "Delete activity" }).click();
  await expect(page.getByText("Activity deleted")).toBeVisible();
  await expect(timeline(page)).not.toContainText("Edited text");
});
