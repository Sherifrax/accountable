import { execFileSync } from "node:child_process";
import path from "node:path";
import type { Page } from "@playwright/test";
import { API, askFreshBackend, expect, test } from "./fixtures";
import { TEST_DB } from "./playwright.config";

const row = (page: Page, text: string) => page.getByRole("table").getByRole("row").filter({ hasText: text });
const dialog = (page: Page) => page.getByRole("dialog");

async function search(page: Page, placeholder: string, text: string) {
  await page.getByRole("searchbox", { name: placeholder }).fill(text);
}

test("organizations: add, search, sort, edit, restart, delete", async ({ page, request }) => {
  await page.goto("/organizations");
  await page.getByRole("button", { name: "New organization" }).click();
  await dialog(page).getByLabel("Name").fill("Zephyr Test Co");
  await dialog(page).getByLabel("Industry").fill("Aerospace");
  await dialog(page).getByRole("button", { name: "Save" }).click();
  await expect(page.getByText("Organization saved")).toBeVisible();

  await search(page, "Search organizations", "zephyr");
  await expect(page.getByRole("table").getByRole("row")).toHaveCount(2); // header + one
  await expect(row(page, "Zephyr Test Co")).toContainText("Aerospace");

  // Sorting: the arrow shows, and clicking again reverses.
  await search(page, "Search organizations", "");
  const nameHeader = page.getByRole("columnheader", { name: "Name" });
  await expect(nameHeader).toHaveAttribute("aria-sort", "ascending");
  await page.getByRole("button", { name: "Name" }).click();
  await expect(nameHeader).toHaveAttribute("aria-sort", "descending");
  await expect(page.getByRole("table").getByRole("row").nth(1)).toContainText("Zephyr Test Co");
  await page.getByRole("button", { name: "Open pipeline" }).click();
  await expect(page.getByRole("columnheader", { name: "Open pipeline" })).toHaveAttribute("aria-sort", "ascending");

  // Edit.
  await search(page, "Search organizations", "zephyr");
  await page.getByRole("button", { name: "Edit Zephyr Test Co" }).click({ force: true });
  await dialog(page).getByLabel("Industry").fill("Space travel");
  await dialog(page).getByRole("button", { name: "Save" }).click();
  await expect(row(page, "Zephyr Test Co")).toContainText("Space travel");

  // Still there after a refresh and after a restart.
  await page.reload();
  await search(page, "Search organizations", "zephyr");
  await expect(row(page, "Zephyr Test Co")).toContainText("Space travel");
  const fresh = await askFreshBackend<{ name: string; industry: string }[]>("/organizations");
  expect(fresh.find((o) => o.name === "Zephyr Test Co")?.industry).toBe("Space travel");

  // Delete asks first, with the exact consequences.
  await page.getByRole("button", { name: "Delete Zephyr Test Co" }).click({ force: true });
  await expect(dialog(page)).toContainText("Delete Zephyr Test Co? It has no contacts or deals. This can't be undone.");
  await dialog(page).getByRole("button", { name: "Cancel" }).click();
  await expect(row(page, "Zephyr Test Co")).toBeVisible();

  // An organization with people and deals: they are kept, with no organization (R-DEL-1).
  const orgs: { id: number; name: string; contact_count: number; open_deal_count: number }[] = await (await request.get(`${API}/organizations`)).json();
  const target = orgs.find((o) => o.name === "Northwind Logistics")!;
  const impact = await (await request.get(`${API}/organizations/${target.id}/delete-impact`)).json();
  await search(page, "Search organizations", "northwind");
  await page.getByRole("button", { name: "Delete Northwind Logistics" }).click({ force: true });
  await expect(dialog(page)).toContainText(
    `Delete Northwind Logistics? Its ${impact.contacts} contacts and ${impact.deals} deals will be kept, with no organization. This can't be undone.`,
  );
  await dialog(page).getByRole("button", { name: "Delete organization" }).click();
  await expect(page.getByText("Organization deleted")).toBeVisible();
  await expect(page.getByText("No organizations match 'northwind'.")).toBeVisible();
  const contacts: { organization_id: number | null; name: string }[] = await (await request.get(`${API}/contacts`)).json();
  expect(contacts).toHaveLength(40);
  expect(contacts.filter((c) => c.organization_id === null).length).toBeGreaterThanOrEqual(impact.contacts);
  await page.goto("/deals");
  await expect(row(page, "Route planning licences")).toContainText("None");
});

test("contacts: add a lead, a qualified contact and a customer; search, sort, edit, restart, delete", async ({ page, request }) => {
  await page.goto("/contacts");
  for (const [name, status] of [["Test Lead", "Lead"], ["Test Qualified", "Qualified"], ["Test Customer", "Customer"]]) {
    await page.getByRole("button", { name: "New contact" }).click();
    await dialog(page).getByLabel("Name").fill(name);
    await dialog(page).getByLabel("Status").selectOption({ label: status });
    await dialog(page).getByRole("button", { name: "Save" }).click();
    await expect(page.getByText("Contact saved").first()).toBeVisible();
  }
  await search(page, "Search contacts", "Test ");
  await expect(page.getByRole("table").getByRole("row")).toHaveCount(4);

  await page.getByRole("button", { name: "Status" }).click();
  await expect(page.getByRole("table").getByRole("row").nth(1)).toContainText("Customer");
  await page.getByRole("button", { name: "Status" }).click();
  await expect(page.getByRole("table").getByRole("row").nth(1)).toContainText("Qualified");

  // Validation shows next to the field.
  await page.getByRole("button", { name: "New contact" }).click();
  await dialog(page).getByRole("button", { name: "Save" }).click();
  await expect(dialog(page).getByText("Name is required")).toBeVisible();
  await dialog(page).getByLabel("Name").fill("Bad Email");
  await dialog(page).getByLabel("Email").fill("nope");
  await dialog(page).getByRole("button", { name: "Save" }).click();
  await expect(dialog(page).getByText("Email doesn't look right")).toBeVisible();
  await page.keyboard.press("Escape");
  await expect(dialog(page)).toHaveCount(0);

  await page.getByRole("button", { name: "Edit Test Lead" }).click({ force: true });
  await dialog(page).getByLabel("Job title").fill("Chief tester");
  await dialog(page).getByRole("button", { name: "Save" }).click();
  await expect(row(page, "Test Lead")).toContainText("Chief tester");

  await page.reload();
  await search(page, "Search contacts", "Test Lead");
  await expect(row(page, "Test Lead")).toContainText("Chief tester");
  const fresh = await askFreshBackend<{ name: string; job_title: string }[]>("/contacts");
  expect(fresh.find((c) => c.name === "Test Lead")?.job_title).toBe("Chief tester");

  // Deleting a contact keeps their deals, with no contact (R-DEL-2, R-DEL-3, R-DEL-4).
  const all: { id: number; name: string }[] = await (await request.get(`${API}/contacts`)).json();
  let withDeals: { id: number; name: string; deals: number; activities_deleted: number; activities_kept: number } | undefined;
  for (const c of all) {
    const impact = await (await request.get(`${API}/contacts/${c.id}/delete-impact`)).json();
    if (impact.deals > 0 && impact.activities_deleted > 0 && impact.activities_kept > 0) {
      withDeals = { id: c.id, ...impact };
      break;
    }
  }
  expect(withDeals).toBeTruthy();
  await search(page, "Search contacts", withDeals!.name);
  await page.getByRole("button", { name: `Delete ${withDeals!.name}` }).click({ force: true });
  const plural = (n: number, one: string, many: string) => `${n} ${n === 1 ? one : many}`;
  await expect(dialog(page)).toContainText(
    `Delete ${withDeals!.name}? Their ${plural(withDeals!.deals, "deal", "deals")} will be kept, with no contact. ` +
      `${plural(withDeals!.activities_deleted, "activity", "activities")} linked only to them will be deleted. ` +
      `${plural(withDeals!.activities_kept, "activity", "activities")} also linked to a deal will be kept, with no contact. This can't be undone.`,
  );
  const dealsBefore = (await (await request.get(`${API}/deals`)).json()).length;
  await dialog(page).getByRole("button", { name: "Delete contact" }).click();
  await expect(page.getByText("Contact deleted")).toBeVisible();
  expect((await (await request.get(`${API}/deals`)).json()).length).toBe(dealsBefore);
  expect((await (await request.get(`${API}/contacts`)).json()).length).toBe(43 - 1);
});

test("deals: add, search, sort, edit, restart, delete", async ({ page, request }) => {
  await page.goto("/deals");
  await page.getByRole("button", { name: "New deal" }).click();
  await dialog(page).getByLabel("Name").fill("Zephyr launch");
  await dialog(page).getByLabel("Organization").selectOption({ label: "Kestrel Analytics" });
  await dialog(page).getByLabel("Stage").selectOption("Proposal");
  await expect(dialog(page).getByLabel("Probability (%)")).toHaveValue("50");
  await dialog(page).getByLabel("Value (USD)").fill("12,500");
  await dialog(page).getByLabel("Close date").fill("2030-01-15");
  await dialog(page).getByRole("button", { name: "Save" }).click();
  await expect(page.getByText("Deal saved")).toBeVisible();

  await search(page, "Search deals", "zephyr");
  const created = row(page, "Zephyr launch");
  await expect(created).toContainText("Kestrel Analytics");
  await expect(created).toContainText("Proposal");
  await expect(created).toContainText("$12,500");
  await expect(created).toContainText("50%");
  await expect(created).toContainText("$6,250");
  await expect(created).toContainText("Jan 15, 2030");

  await search(page, "Search deals", "");
  await page.getByRole("button", { name: "Value" }).click();
  await page.getByRole("button", { name: "Value" }).click();
  await expect(page.getByRole("columnheader", { name: "Value" })).toHaveAttribute("aria-sort", "descending");
  await expect(page.getByRole("table").getByRole("row").nth(1)).toContainText("Distribution contract");

  await search(page, "Search deals", "zephyr");
  await page.getByRole("button", { name: "Edit Zephyr launch" }).click({ force: true });
  await dialog(page).getByLabel("Value (USD)").fill("20000");
  await dialog(page).getByRole("button", { name: "Save" }).click();
  await expect(row(page, "Zephyr launch")).toContainText("$20,000");
  await expect(row(page, "Zephyr launch")).toContainText("50%"); // a hand-set or usual probability stays on an edit

  await page.reload();
  await search(page, "Search deals", "zephyr");
  await expect(row(page, "Zephyr launch")).toContainText("$20,000");
  const fresh = await askFreshBackend<{ name: string; value: number }[]>("/deals");
  expect(fresh.find((d) => d.name === "Zephyr launch")?.value).toBe(20000);

  await page.getByRole("button", { name: "Delete Zephyr launch" }).click({ force: true });
  await expect(dialog(page)).toContainText("Delete Zephyr launch? It has no activities. This can't be undone.");
  await dialog(page).getByRole("button", { name: "Delete deal" }).click();
  await expect(page.getByText("Deal deleted")).toBeVisible();
  await expect(page.getByText("No deals match 'zephyr'.")).toBeVisible();

  // A deal with history: its stage changes go with it, linked activities stay (R-DEL-3).
  const deals: { id: number; name: string }[] = await (await request.get(`${API}/deals`)).json();
  const victim = deals.find((d) => d.name === "Route planning licences")!;
  const impact = await (await request.get(`${API}/deals/${victim.id}/delete-impact`)).json();
  expect(impact.stage_changes).toBeGreaterThan(0);
  await search(page, "Search deals", "route planning");
  await page.getByRole("button", { name: "Delete Route planning licences" }).click({ force: true });
  await expect(dialog(page)).toContainText(`${impact.stage_changes} stage change`);
  await dialog(page).getByRole("button", { name: "Cancel" }).click();
});

test("the reset command brings the sample data back", async ({ page, request }) => {
  await page.goto("/organizations");
  await page.getByRole("button", { name: "Delete Brightwave Energy" }).click({ force: true });
  await dialog(page).getByRole("button", { name: "Delete organization" }).click();
  await expect(page.getByText("Organization deleted")).toBeVisible();
  expect((await (await request.get(`${API}/organizations`)).json()).length).toBe(14);

  // `npm run seed`, pointed at the test database. The app keeps running.
  execFileSync(process.platform === "win32" ? "npm.cmd" : "npm", ["run", "seed"], {
    cwd: path.resolve(__dirname, ".."),
    env: { ...process.env, ACCOUNTABLE_DB: TEST_DB },
    stdio: "pipe",
    shell: process.platform === "win32",
  });
  await page.reload();
  await expect(row(page, "Brightwave Energy")).toBeVisible();
  await expect(page.getByText("15 organizations")).toBeVisible();
});
