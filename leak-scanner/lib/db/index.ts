import Database from "better-sqlite3";
import { drizzle } from "drizzle-orm/better-sqlite3";
import { migrate } from "drizzle-orm/better-sqlite3/migrator";
import fs from "node:fs";
import path from "node:path";
import * as schema from "./schema";

const dbFile =
  process.env.DATABASE_PATH ?? path.join(process.cwd(), "data", "greenstar.db");

fs.mkdirSync(path.dirname(dbFile), { recursive: true });

// Reuse a single connection across dev hot reloads.
const globalForDb = globalThis as unknown as { __sqlite?: Database.Database };

const sqlite = globalForDb.__sqlite ?? new Database(dbFile);
export const db = drizzle(sqlite, { schema });

if (!globalForDb.__sqlite) {
  sqlite.pragma("journal_mode = WAL");
  sqlite.pragma("foreign_keys = ON");
  // Apply pending migrations on boot (idempotent, ~ms). Keeps dev, tests,
  // and production in sync without a separate migrate step.
  try {
    migrate(db, {
      migrationsFolder: path.join(process.cwd(), "lib", "db", "migrations"),
    });
  } catch (error) {
    console.error("db migration on boot failed", error);
  }
  globalForDb.__sqlite = sqlite;
}

export { schema };
