import { expect, test } from "./fixtures";

test("the app opens on the dashboard with figures, and every section has sample data", async ({ page }) => {
  await page.goto("/");
  await expect(page.getByRole("heading", { name: "Dashboard", level: 1 })).toBeVisible();
  await expect(page.locator(".tile")).toHaveCount(4);
  await expect(page.locator(".tile", { hasText: "Open pipeline" })).toContainText("18 open deals");
  await expect(page.getByRole("heading", { name: "Revenue won by month" })).toBeVisible();
  await expect(page.getByRole("region", { name: "Recent activity" }).getByRole("listitem")).toHaveCount(10);

  const nav = page.getByRole("navigation", { name: "Main" });
  const checks: [string, string, RegExp][] = [
    ["Pipeline", "Pipeline", /^$/],
    ["Deals", "Deals", /30 deals/],
    ["Organizations", "Organizations", /15 organizations/],
    ["Contacts", "Contacts", /40 contacts/],
  ];
  for (const [link, heading, count] of checks) {
    await nav.getByRole("link", { name: link }).click();
    await expect(page.getByRole("heading", { name: heading, level: 1 })).toBeVisible();
    if (link === "Pipeline") await expect(page.locator(".card")).toHaveCount(30);
    else await expect(page.getByText(count)).toBeVisible();
  }
  await nav.getByRole("link", { name: "Dashboard" }).click();
  await expect(page.locator(".tile")).toHaveCount(4);
});

test("nothing is requested from outside this computer (R-RUN-5)", async ({ page }) => {
  const outside: string[] = [];
  page.on("request", (request) => {
    const url = new URL(request.url());
    if (!["localhost", "127.0.0.1"].includes(url.hostname) && url.protocol.startsWith("http"))
      outside.push(request.url());
  });
  for (const path of [
    "/",
    "/pipeline",
    "/deals",
    "/organizations",
    "/contacts",
    "/organizations/1",
    "/deals/1",
    "/contacts/1",
  ]) {
    await page.goto(path);
    await page.waitForLoadState("networkidle");
  }
  expect(outside).toEqual([]);
});
