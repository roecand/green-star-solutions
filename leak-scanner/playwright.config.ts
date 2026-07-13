import { defineConfig } from "@playwright/test";

const PORT = 3105;

// e2e strategy: production build in an isolated dist dir (.next-e2e) against
// a throwaway seeded SQLite db. Production serving avoids dev-server HMR and
// hydration timing flake entirely.
const env = [
  "DATABASE_PATH=./data/e2e.db",
  "SCANNER_ALLOW_PRIVATE=1",
  `NEXT_PUBLIC_APP_URL=http://127.0.0.1:${PORT}`,
  "NEXT_DIST_DIR=.next-e2e",
].join(" ");

export default defineConfig({
  testDir: "./e2e",
  timeout: 60_000,
  retries: 1,
  workers: 1, // shared SQLite test DB — keep runs serialized
  use: {
    baseURL: `http://127.0.0.1:${PORT}`,
    trace: "retain-on-failure",
  },
  webServer: {
    command: `rm -rf data/e2e.db data/e2e.db-shm data/e2e.db-wal && ${env} npx next build && ${env} npm run db:seed && ${env} npx next start --port ${PORT}`,
    url: `http://127.0.0.1:${PORT}`,
    reuseExistingServer: false,
    timeout: 240_000,
  },
});
