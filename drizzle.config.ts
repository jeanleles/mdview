/**
 * Drizzle Kit configuration for MDview.
 *
 * - Schema: src/lib/db/schema.ts
 * - Migrations output: ./drizzle
 * - Driver: better-sqlite3
 */

import type { Config } from "drizzle-kit";

const config: Config = {
  schema: "./src/lib/db/schema.ts",
  out: "./drizzle",
  dialect: "sqlite",
};

export default config;
