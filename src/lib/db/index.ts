/**
 * Database connection, Drizzle ORM instance and automatic migration runner.
 *
 * Boot sequence:
 *  1. Open the SQLite file specified by DATABASE_URL.
 *     On failure → console.error + process.exit(1)  (Requirement 8.5)
 *  2. Run drizzle-kit migrations from ./drizzle automatically.
 *     On failure → console.error + process.exit(1)  (Requirement 8.7)
 *  3. Export the drizzle `db` instance for use across the application.
 *
 * Requirements: 8.5, 8.6, 8.7
 */

import { mkdirSync } from "fs";
import * as path from "path";
import Database from "better-sqlite3";
import { drizzle } from "drizzle-orm/better-sqlite3";
import { migrate } from "drizzle-orm/better-sqlite3/migrator";
import { DATABASE_URL } from "@/lib/env";
import * as schema from "./schema";

// ---------------------------------------------------------------------------
// 1. Open the SQLite database
// ---------------------------------------------------------------------------

// Resolve relative paths against the project root (process.cwd()), not the
// compiled output directory, so `./data/mdview.db` works in both dev and
// production.
const dbPath = path.isAbsolute(DATABASE_URL)
  ? DATABASE_URL
  : path.resolve(process.cwd(), DATABASE_URL);

// Ensure the parent directory exists before trying to open the file.
try {
  mkdirSync(path.dirname(dbPath), { recursive: true });
} catch {
  // Ignore — directory may already exist. Actual open errors are caught below.
}

let sqlite: InstanceType<typeof Database>;

try {
  sqlite = new Database(dbPath);
  // WAL mode improves concurrent read performance.
  sqlite.pragma("journal_mode = WAL");
} catch (err) {
  console.error(
    "[db] Failed to connect to the database:",
    (err as Error).message
  );
  process.exit(1);
}

// ---------------------------------------------------------------------------
// 2. Drizzle ORM instance
// ---------------------------------------------------------------------------

export const db = drizzle(sqlite!, { schema });

// ---------------------------------------------------------------------------
// 3. Run migrations automatically on startup (Requirement 8.6, 8.7)
// ---------------------------------------------------------------------------

try {
  migrate(db, {
    migrationsFolder: path.resolve(process.cwd(), "./drizzle"),
  });
} catch (err) {
  console.error("[db] Migration failed:", (err as Error).message);
  process.exit(1);
}
