# 2.1 Running the app

- **R-RUN-1** `npm run dev` starts the backend on `http://localhost:8000` and the frontend on `http://localhost:5173`. The terminal prints the address to open. Opening it shows the dashboard.
- **R-RUN-2** `npm run seed` deletes all data and loads the sample data. It works whether or not the app is running.
- **R-RUN-3** On first start, if the database file doesn't exist, the backend creates it and loads the sample data.
- **R-RUN-4** `npm test` runs the frontend, backend and end-to-end tests, and fails if any test fails. The tests use their own database file.
- **R-RUN-5** Nothing needs an internet connection after `npm install`.
- **R-RUN-6** The commands work on Mac, Linux and Windows. No shell-specific syntax goes in the npm scripts.
