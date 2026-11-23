# 2.13 Deploying to Render

The app runs on Render's free plan as one web service. FastAPI serves the built frontend and the API from the same address.

- **R-DEP-1** A `render.yaml` at the repo root describes one web service on the free plan. It sets the build and start commands and the environment variables. `DATABASE_URL`, `SUPABASE_URL` and `SUPABASE_PUBLISHABLE_KEY` are listed with no value (`sync: false`), and their values are entered in Render. No value from `.env` is written in the file.
- **R-DEP-2** The build installs the Python packages and builds the frontend into `frontend/dist`. The `SUPABASE_URL` and `SUPABASE_PUBLISHABLE_KEY` values are needed at build time, because the frontend takes them from the environment when it's built (see `docs/specs/architecture.md`).
- **R-DEP-3** The start command applies the database migrations, then starts the backend on the port Render gives it. If a migration fails, the service doesn't start and the log says why.
- **R-DEP-4** FastAPI serves the files in `frontend/dist`. Any path that isn't `/api` and isn't a file answers with `index.html`, so a link to a deal or a refresh on any page works. An unknown `/api` path answers 404 with `{"detail": "Not found."}`, never `index.html`.
- **R-DEP-5** `GET /healthz` answers 200 with no data and needs no token. It is Render's health check and is the only route outside the built files that does.
- **R-DEP-6** The service answers at its `onrender.com` address, over HTTPS, with no CORS setup, because the page and the API share an address.
- **R-DEP-7** `DATABASE_URL` is a Supabase connection string for the pooler, not the direct connection, because Render's free plan can't reach Supabase's direct address (IPv6 only). It carries the password, so it is only ever in `.env` and in Render, never in the repo, the frontend or the logs.
- **R-DEP-8** On the free plan Render stops the service after about 15 minutes with no requests, and the next request waits up to a minute while it starts. This is expected. The page shows the spinner from R-AUTH-10 while it waits.
- **R-DEP-9** Nothing in the repo, the CI run or the tests needs a Supabase or Render secret.
