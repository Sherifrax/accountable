import { execFileSync } from "node:child_process";
import path from "node:path";
import { test as base, expect } from "@playwright/test";
import { TEST_DB } from "./playwright.config";

const root = path.resolve(__dirname, "..");

/** Resets the test database to the sample data, the same way `npm run seed` does. */
export function reseed() {
  execFileSync("uv", ["run", "python", "-m", "backend.app.seed"], {
    cwd: root,
    env: { ...process.env, ACCOUNTABLE_DB: TEST_DB },
    stdio: "pipe",
  });
}

/** Every test starts from freshly seeded data and fails on any console error or warning (R-Q-1). */
export const test = base.extend<{ consoleProblems: string[] }>({
  consoleProblems: [
    async ({ page }, use) => {
      reseed();
      const problems: string[] = [];
      page.on("console", (msg) => {
        if (msg.type() === "error" || msg.type() === "warning") problems.push(`${msg.type()}: ${msg.text()}`);
      });
      page.on("pageerror", (err) => problems.push(`pageerror: ${err.message}`));
      await use(problems);
      expect(problems, "browser console output").toEqual([]);
    },
    { auto: true },
  ],
});

export { expect };
