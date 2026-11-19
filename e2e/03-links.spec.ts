import { API, expect, test } from "./fixtures";

type Contact = { id: number; name: string; status: string; organization_id: number | null; organization_name: string | null };

test("contacts filter by status, with counts", async ({ page, request }) => {
  const contacts: Contact[] = await (await request.get(`${API}/contacts`)).json();
  await page.goto("/contacts");
  const group = page.getByRole("group", { name: "Filter by status" });
  await expect(group.getByRole("button", { name: /^All/ })).toContainText(String(contacts.length));
  for (const [label, status] of [["Lead", "lead"], ["Qualified", "qualified"], ["Customer", "customer"]]) {
    const expected = contacts.filter((c) => c.status === status).length;
    expect(expected).toBeGreaterThan(0);
    await expect(group.getByRole("button", { name: new RegExp(`^${label}`) })).toContainText(String(expected));
    await group.getByRole("button", { name: new RegExp(`^${label}`) }).click();
    const rows = page.getByRole("table").getByRole("row");
    await expect(rows).toHaveCount(expected + 1);
    for (const cell of await rows.locator("td:nth-child(6)").allTextContents()) expect(cell).toBe(label);
  }
  await group.getByRole("button", { name: /^All/ }).click();
  await expect(page.getByRole("table").getByRole("row")).toHaveCount(contacts.length + 1);
});

test("an organization page shows its contacts, deals and one combined timeline", async ({ page, request }) => {
  const org = await (await request.get(`${API}/organizations/1`)).json();
  expect(org.contacts.length).toBeGreaterThan(0);
  expect(org.deals.length).toBeGreaterThan(0);
  await page.goto("/organizations");
  await page.getByRole("link", { name: org.name, exact: true }).click();
  await expect(page.getByRole("heading", { name: org.name, level: 1 })).toBeVisible();

  const contactsPanel = page.getByRole("region", { name: new RegExp(`^Contacts \\(${org.contacts.length}\\)`) });
  for (const c of org.contacts) await expect(contactsPanel.getByRole("link", { name: c.name })).toBeVisible();
  const dealsPanel = page.getByRole("region", { name: new RegExp(`^Deals \\(${org.deals.length}\\)`) });
  for (const d of org.deals) await expect(dealsPanel.getByRole("link", { name: d.name })).toBeVisible();

  const timeline = page.getByRole("region", { name: "Timeline" }).getByRole("listitem");
  await expect(timeline).toHaveCount(org.timeline.length);
  const text = await timeline.allTextContents();
  const dealIds = new Set(org.deals.map((d: { id: number }) => d.id));
  const contactIds = new Set(org.contacts.map((c: { id: number }) => c.id));
  expect(org.timeline.some((a: { deal_id: number }) => dealIds.has(a.deal_id))).toBe(true);
  expect(org.timeline.some((a: { contact_id: number; deal_id: number | null }) => contactIds.has(a.contact_id) && !dealIds.has(a.deal_id as number))).toBe(true);
  expect(text.join("\n")).toContain(org.timeline[0].description);
  // Newest first.
  expect(org.timeline.map((a: { occurred_at: string }) => a.occurred_at)).toEqual(
    [...org.timeline.map((a: { occurred_at: string }) => a.occurred_at)].sort().reverse(),
  );
});

test("a contact page links to its organization, deals and timeline", async ({ page, request }) => {
  const contacts: Contact[] = await (await request.get(`${API}/contacts`)).json();
  let detail;
  for (const c of contacts) {
    const d = await (await request.get(`${API}/contacts/${c.id}`)).json();
    if (d.organization_id && d.deals.length > 0 && d.timeline.length > 0) {
      detail = d;
      break;
    }
  }
  await page.goto(`/contacts/${detail.id}`);
  await expect(page.getByRole("heading", { name: detail.name, level: 1 })).toBeVisible();
  const details = page.getByRole("region", { name: "Details" });
  await expect(details.getByRole("link", { name: detail.organization_name })).toBeVisible();
  const deals = page.getByRole("region", { name: /^Deals/ });
  for (const d of detail.deals) await expect(deals.getByRole("link", { name: d.name })).toBeVisible();
  await expect(page.getByRole("region", { name: "Timeline" }).getByRole("listitem")).toHaveCount(detail.timeline.length);

  await deals.getByRole("link", { name: detail.deals[0].name }).click();
  await expect(page).toHaveURL(new RegExp(`/deals/${detail.deals[0].id}$`));
  await expect(page.getByRole("heading", { name: detail.deals[0].name, level: 1 })).toBeVisible();
  const dealDetails = page.getByRole("region", { name: "Details" });
  await expect(dealDetails.getByRole("link", { name: detail.name })).toBeVisible();
  await dealDetails.getByRole("link", { name: detail.name }).click();
  await expect(page).toHaveURL(new RegExp(`/contacts/${detail.id}$`));
});

test("a deleted link shows None on the record page (R-REC-5)", async ({ page, request }) => {
  const deal = (await (await request.get(`${API}/deals`)).json())[0];
  await request.delete(`${API}/organizations/${deal.organization_id}`);
  await page.goto(`/deals/${deal.id}`);
  await expect(page.getByRole("region", { name: "Details" }).locator("div", { hasText: /^Organization/ }).last()).toContainText("None");
});

test("the deal page has a stage selector that changes the stage straight away", async ({ page, request }) => {
  const deals: { id: number; name: string; stage: string }[] = await (await request.get(`${API}/deals`)).json();
  const deal = deals.find((d) => d.stage === "New")!;
  await page.goto(`/deals/${deal.id}`);
  await page.getByLabel("Stage").selectOption("Proposal");
  await expect(page.getByRole("region", { name: "Details" })).toContainText("50%");
  await expect(page.getByRole("region", { name: "Timeline" })).toContainText("Moved from New to Proposal");
});
