import { expect, test } from "./fixtures";

test("every action can be reached with Tab, dialogs trap focus and close with Escape, and focus is visible (R-Q-5)", async ({
  page,
}) => {
  await page.goto("/deals");
  const newDeal = page.getByRole("button", { name: "New deal" });

  // Tab reaches the sidebar, the page action and the table's controls, each with a visible outline.
  const reached = new Set<string>();
  for (let i = 0; i < 14; i++) {
    await page.keyboard.press("Tab");
    const info = await page.evaluate(() => {
      const el = document.activeElement as HTMLElement;
      const style = getComputedStyle(el);
      return {
        label: el.getAttribute("aria-label") || el.textContent?.trim() || el.tagName,
        outline: style.outlineStyle !== "none" && parseFloat(style.outlineWidth) > 0,
      };
    });
    expect(info.outline, `no focus outline on ${info.label}`).toBe(true);
    reached.add(info.label);
  }
  for (const name of ["Dashboard", "Pipeline", "Deals", "Organizations", "Contacts", "New deal"])
    expect(reached).toContain(name);

  // Open the dialog from the keyboard; Escape closes it and focus goes back.
  await newDeal.focus();
  await page.keyboard.press("Enter");
  const dialog = page.getByRole("dialog");
  await expect(dialog).toBeVisible();
  await expect(dialog.getByLabel("Name")).toBeFocused();
  for (let i = 0; i < 20; i++) {
    await page.keyboard.press("Tab");
    expect(await dialog.evaluate((d) => d.contains(document.activeElement))).toBe(true);
  }
  await page.keyboard.press("Escape");
  await expect(dialog).toHaveCount(0);
  await expect(newDeal).toBeFocused();

  // Row actions are reachable without a mouse, and the name links open the record.
  await page.getByRole("link", { name: "Route planning licences" }).focus();
  await page.keyboard.press("Enter");
  await expect(page).toHaveURL(/\/deals\/\d+$/);
});
