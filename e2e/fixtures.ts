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

export const API = "http://127.0.0.1:8001/api";

/**
 * Starts a second backend process on the same database file and asks it a question. A new
 * process that finds the data proves the change reached the file, as a restart would.
 */
export async function askFreshBackend<T>(path: string): Promise<T> {
  const { spawn } = await import("node:child_process");
  const port = 8002;
  const child = spawn("uv", ["run", "uvicorn", "backend.app.main:app", "--host", "127.0.0.1", "--port", String(port)], {
    cwd: root,
    env: { ...process.env, ACCOUNTABLE_DB: TEST_DB },
    stdio: "ignore",
  });
  try {
    for (let i = 0; i < 100; i++) {
      try {
        const response = await fetch(`http://127.0.0.1:${port}/api${path}`);
        if (response.ok) return (await response.json()) as T;
      } catch {
        /* not up yet */
      }
      await new Promise((resolve) => setTimeout(resolve, 200));
    }
    throw new Error("The second backend never answered");
  } finally {
    child.kill();
  }
}
