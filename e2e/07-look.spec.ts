import { fileURLToPath } from "node:url";
import fs from "node:fs";
import path from "node:path";
import { expect, test } from "./fixtures";

const HERE_DIR = path.dirname(fileURLToPath(import.meta.url));

const SHOTS = path.resolve(HERE_DIR, "results", "screenshots");
const SCREENS: [string, string][] = [
  ["dashboard", "/"],
  ["pipeline", "/pipeline"],
  ["deals", "/deals"],
  ["organizations", "/organizations"],
  ["contacts", "/contacts"],
  ["organization", "/organizations/1"],
  ["contact", "/contacts/1"],
  ["deal", "/deals/1"],
];

test("the dashboard's charts render", async ({ page }) => {
  await page.goto("/");
  await expect(page.locator(".recharts-area-curve")).toHaveCount(1);
  await expect(page.locator(".recharts-area-area")).toHaveCount(1);
  await expect(page.locator(".recharts-bar-rectangle path").first()).toBeVisible();
  await expect(page.locator(".funnel-bar")).toHaveCount(5);
  await expect(page.locator(".stack > span")).toHaveCount(4);
  // Hovering the line chart shows a tooltip with the month and revenue.
  const chart = page.locator(".recharts-wrapper").first();
  const box = (await chart.boundingBox())!;
  await page.mouse.move(box.x + box.width * 0.6, box.y + box.height * 0.5);
  await expect(page.locator(".chart-tip").first()).toContainText("Revenue won");
});

test("the brand fonts and colors are in use", async ({ page }) => {
  await page.goto("/");
  await page.evaluate(() => document.fonts.ready);
  const fonts = await page.evaluate(async () => {
    await Promise.all([
      document.fonts.load('600 14px "Instrument Sans Variable"'),
      document.fonts.load('500 14px "JetBrains Mono Variable"'),
      document.fonts.load('italic 400 16px "Instrument Serif"'),
    ]);
    return {
      sans: document.fonts.check('14px "Instrument Sans Variable"'),
      mono: document.fonts.check('14px "JetBrains Mono Variable"'),
      serif: document.fonts.check('italic 16px "Instrument Serif"'),
      body: getComputedStyle(document.body).fontFamily,
      figure: getComputedStyle(document.querySelector(".tile .figure")!).fontFamily,
      tagline: getComputedStyle(document.querySelector(".tagline")!).fontFamily,
    };
  });
  expect(fonts).toMatchObject({ sans: true, mono: true, serif: true });
  expect(fonts.body).toContain("Instrument Sans");
  expect(fonts.figure).toContain("JetBrains Mono");
  expect(fonts.tagline).toContain("Instrument Serif");

  const colors = await page.evaluate(() => ({
    sidebar: getComputedStyle(document.querySelector(".sidebar")!).backgroundColor,
    active: getComputedStyle(document.querySelector(".nav a.active")!).backgroundColor,
    page: getComputedStyle(document.body).backgroundColor,
  }));
  expect(colors).toEqual({ sidebar: "rgb(7, 59, 76)", active: "rgb(6, 214, 160)", page: "rgb(240, 244, 245)" });

  await page.goto("/pipeline");
  await expect(page.locator(".col")).toHaveCount(6);
  const dots = await page.evaluate(() =>
    Object.fromEntries(
      Array.from(document.querySelectorAll(".col")).map((c) => [
        c.getAttribute("data-stage"),
        getComputedStyle(c.querySelector(".dot")!).backgroundColor,
      ]),
    ),
  );
  expect(dots).toEqual({
    New: "rgb(17, 138, 178)",
    Qualified: "rgb(255, 193, 69)",
    Proposal: "rgb(247, 140, 107)",
    Negotiation: "rgb(61, 107, 122)",
    Won: "rgb(6, 214, 160)",
    Lost: "rgb(169, 184, 189)",
  });
});

for (const width of [1280, 1440]) {
  test(`every screen at ${width}px: nothing overflows, and screenshots are saved for review`, async ({ page }) => {
    await page.setViewportSize({ width, height: 900 });
    fs.mkdirSync(SHOTS, { recursive: true });
    for (const [name, url] of SCREENS) {
      await page.goto(url);
      await page.waitForLoadState("networkidle");
      await page.waitForTimeout(300);
      const overflow = await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth);
      expect(overflow, `${name} overflows sideways`).toBeLessThanOrEqual(0);
      await page.screenshot({ path: path.join(SHOTS, `${name}-${width}.png`), fullPage: true });
    }
  });
}
