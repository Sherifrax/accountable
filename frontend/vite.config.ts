import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";

// The ports can be changed so the end-to-end tests run beside a real copy of the app.
const port = Number(process.env.FRONTEND_PORT ?? 5173);
const backend = `http://127.0.0.1:${process.env.BACKEND_PORT ?? 8000}`;

export default defineConfig({
  plugins: [react()],
  server: { port, strictPort: true, proxy: { "/api": backend } },
});
