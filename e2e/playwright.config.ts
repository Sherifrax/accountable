import path from "node:path";
import { defineConfig } from "@playwright/test";

// Separate ports and a database file of their own, so tests never touch real data.
export const BACKEND_PORT = 8001;
export const FRONTEND_PORT = 5174;
export const TEST_DB = path.resolve(__dirname, ".data", "e2e.db");
const root = path.resolve(__dirname, "..");

export default defineConfig({
  testDir: ".",
  testMatch: "*.spec.ts",
  workers: 1,
  fullyParallel: false,
  reporter: [["list"]],
  outputDir: path.resolve(__dirname, "results"),
  use: {
    baseURL: `http://localhost:${FRONTEND_PORT}`,
    channel: "chrome",
    viewport: { width: 1440, height: 900 },
    trace: "retain-on-failure",
  },
  webServer: [
    {
      command: `uv run uvicorn backend.app.main:app --host 127.0.0.1 --port ${BACKEND_PORT}`,
      cwd: root,
      url: `http://127.0.0.1:${BACKEND_PORT}/api/stages`,
      env: { ACCOUNTABLE_DB: TEST_DB },
      reuseExistingServer: false,
      timeout: 60_000,
    },
    {
      command: "npm run dev -w frontend",
      cwd: root,
      url: `http://localhost:${FRONTEND_PORT}`,
      env: { FRONTEND_PORT: String(FRONTEND_PORT), BACKEND_PORT: String(BACKEND_PORT) },
      reuseExistingServer: false,
      timeout: 60_000,
    },
  ],
});
