import { createClient, type Client } from "@libsql/client";
import { drizzle, type LibSQLDatabase } from "drizzle-orm/libsql";
import { migrate } from "drizzle-orm/libsql/migrator";
import fs from "node:fs";
import path from "node:path";
import * as schema from "./schema";

/**
 * Database client. Two modes, same schema:
 * - Production: Turso (hosted SQLite) via TURSO_DATABASE_URL + TURSO_AUTH_TOKEN.
 *   Required on hosts without persistent disk (Render free tier).
 * - Local/dev/tests: a plain SQLite file (DATABASE_PATH, default ./data/greenstar.db).
 */

const tursoUrl = process.env.TURSO_DATABASE_URL;

function buildClient(): Client {
  if (tursoUrl) {
    return createClient({
      url: tursoUrl,
      authToken: process.env.TURSO_AUTH_TOKEN,
    });
  }
  const dbFile =
    process.env.DATABASE_PATH ?? path.join(process.cwd(), "data", "greenstar.db");
  fs.mkdirSync(path.dirname(dbFile), { recursive: true });
  return createClient({ url: `file:${dbFile}` });
}

// Reuse one client + one migration run across dev hot reloads.
const globalForDb = globalThis as unknown as {
  __libsql?: Client;
  __db?: LibSQLDatabase<typeof schema>;
  __migrated?: Promise<void>;
};

const client = globalForDb.__libsql ?? buildClient();
export const db = globalForDb.__db ?? drizzle(client, { schema });

if (!globalForDb.__libsql) {
  globalForDb.__libsql = client;
  globalForDb.__db = db;
}

/**
 * Applies pending migrations exactly once per process (idempotent, ~ms).
 * Awaited lazily by dbReady() so module import stays synchronous.
 */
export function dbReady(): Promise<void> {
  if (!globalForDb.__migrated) {
    globalForDb.__migrated = (async () => {
      try {
        if (!tursoUrl) {
          await client.execute("PRAGMA foreign_keys = ON");
        }
        await migrate(db, {
          migrationsFolder: path.join(process.cwd(), "lib", "db", "migrations"),
        });
      } catch (error) {
        console.error("db migration on boot failed", error);
        throw error;
      }
    })();
  }
  return globalForDb.__migrated;
}

// Kick migrations off eagerly on first import; entry points that need a
// guaranteed-migrated db (tests, seed) await dbReady() explicitly.
void dbReady();

export { schema };
