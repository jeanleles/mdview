/**
 * Property-based tests for rate-limit logic.
 *
 * // Feature: mdview, Property 5: Rate limiting bloqueia após N falhas consecutivas
 *
 * Strategy:
 *  - Mock `@/lib/db` before importing `rate-limit.ts` so the real database
 *    module (which reads env vars and calls process.exit on failure) is never
 *    loaded. Each test gets a fresh in-memory SQLite database via
 *    better-sqlite3 + Drizzle so there are no shared-state side effects.
 *  - For each generated email, insert exactly N failed attempts then verify
 *    the gate behaviour (≥5 → blocked, <5 → allowed).
 *
 * Validates: Requirements 1.7
 */

import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import * as fc from "fast-check";
import Database from "better-sqlite3";
import { drizzle, BetterSQLite3Database } from "drizzle-orm/better-sqlite3";
import * as schema from "@/lib/db/schema";

// ---------------------------------------------------------------------------
// Inline DDL — mirrors the Drizzle migration exactly but runs in-memory.
// We apply it manually so we don't need the drizzle/ migrations folder.
// ---------------------------------------------------------------------------
const DDL = `
CREATE TABLE IF NOT EXISTS login_attempts (
  id         INTEGER PRIMARY KEY AUTOINCREMENT NOT NULL,
  email      TEXT    NOT NULL,
  attempted_at INTEGER NOT NULL,
  success    INTEGER DEFAULT false NOT NULL
);
`;

// ---------------------------------------------------------------------------
// Module-level mock: replace @/lib/db before rate-limit.ts is imported.
// The factory is called once per test file by Vitest's module isolation.
// We export a mutable "currentDb" reference that beforeEach can swap out.
// ---------------------------------------------------------------------------

// Shared mutable reference — tests swap this before each run
let currentDb: BetterSQLite3Database<typeof schema>;

vi.mock("@/lib/db", () => {
  // Return a proxy object whose `db` property reads from `currentDb` lazily.
  // This allows beforeEach to replace the db without re-hoisting the mock.
  return {
    get db() {
      return currentDb;
    },
  };
});

// ---------------------------------------------------------------------------
// Import the functions under test AFTER the mock is set up (static hoisting
// means vi.mock is processed before imports in Vitest).
// ---------------------------------------------------------------------------
import { checkRateLimit, recordLoginAttempt } from "@/lib/rate-limit";

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function createInMemoryDb(): {
  db: BetterSQLite3Database<typeof schema>;
  close: () => void;
} {
  const sqlite = new Database(":memory:");
  sqlite.exec(DDL);
  const db = drizzle(sqlite, { schema });
  return { db, close: () => sqlite.close() };
}

// ---------------------------------------------------------------------------
// Test suite
// ---------------------------------------------------------------------------

describe("rate-limit property tests", () => {
  let closeDb: () => void;

  beforeEach(() => {
    const instance = createInMemoryDb();
    currentDb = instance.db;
    closeDb = instance.close;
  });

  afterEach(() => {
    closeDb?.();
  });

  // -------------------------------------------------------------------------
  // Property 5a: After exactly 5 failed attempts the 6th attempt is blocked
  // -------------------------------------------------------------------------
  it(
    // Feature: mdview, Property 5: Rate limiting bloqueia após N falhas consecutivas
    "Property 5a — after exactly 5 failures, checkRateLimit returns true (blocked)",
    async () => {
      await fc.assert(
        fc.asyncProperty(
          // Generate a valid email-ish string; fc.emailAddress() produces valid
          // RFC-style emails that the system would receive.
          fc.emailAddress(),
          async (email) => {
            // Re-create a fresh in-memory database for every generated value
            // so previous runs don't pollute the state.
            const instance = createInMemoryDb();
            const savedDb = currentDb;
            currentDb = instance.db;

            try {
              // Pre-condition: no attempts yet → not blocked
              const blockedBefore = await checkRateLimit(email);
              expect(blockedBefore).toBe(false);

              // Record exactly 5 failed attempts
              for (let i = 0; i < 5; i++) {
                await recordLoginAttempt(email, false);
              }

              // Post-condition: ≥5 failures → blocked
              const blockedAfter = await checkRateLimit(email);
              expect(blockedAfter).toBe(true);
            } finally {
              // Restore the outer db reference and close the per-run db
              currentDb = savedDb;
              instance.close();
            }
          }
        ),
        { numRuns: 100 }
      );
    }
  );

  // -------------------------------------------------------------------------
  // Property 5b: Fewer than 5 failures must NOT trigger the block
  // -------------------------------------------------------------------------
  it(
    // Feature: mdview, Property 5: Rate limiting bloqueia após N falhas consecutivas
    "Property 5b — after fewer than 5 failures, checkRateLimit returns false (not blocked)",
    async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.emailAddress(),
          fc.integer({ min: 0, max: 4 }), // 0..4 failures (below threshold)
          async (email, failureCount) => {
            const instance = createInMemoryDb();
            const savedDb = currentDb;
            currentDb = instance.db;

            try {
              for (let i = 0; i < failureCount; i++) {
                await recordLoginAttempt(email, false);
              }

              const blocked = await checkRateLimit(email);
              expect(blocked).toBe(false);
            } finally {
              currentDb = savedDb;
              instance.close();
            }
          }
        ),
        { numRuns: 100 }
      );
    }
  );

  // -------------------------------------------------------------------------
  // Property 5c: Successful attempts do NOT count toward the failure threshold
  // -------------------------------------------------------------------------
  it(
    // Feature: mdview, Property 5: Rate limiting bloqueia após N falhas consecutivas
    "Property 5c — successful login attempts do not count toward the rate-limit threshold",
    async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.emailAddress(),
          fc.integer({ min: 1, max: 10 }), // N successful attempts
          async (email, successCount) => {
            const instance = createInMemoryDb();
            const savedDb = currentDb;
            currentDb = instance.db;

            try {
              // Record only successful attempts — should never block
              for (let i = 0; i < successCount; i++) {
                await recordLoginAttempt(email, true);
              }

              const blocked = await checkRateLimit(email);
              expect(blocked).toBe(false);
            } finally {
              currentDb = savedDb;
              instance.close();
            }
          }
        ),
        { numRuns: 100 }
      );
    }
  );

  // -------------------------------------------------------------------------
  // Property 5d: Rate-limit is scoped per email — one email's failures do NOT
  //              affect a different email's status.
  // -------------------------------------------------------------------------
  it(
    // Feature: mdview, Property 5: Rate limiting bloqueia após N falhas consecutivas
    "Property 5d — rate-limit is scoped per email; failures on one email do not block another",
    async () => {
      await fc.assert(
        fc.asyncProperty(
          // Two distinct emails
          fc.tuple(fc.emailAddress(), fc.emailAddress()).filter(
            ([a, b]) => a.toLowerCase() !== b.toLowerCase()
          ),
          async ([emailA, emailB]) => {
            const instance = createInMemoryDb();
            const savedDb = currentDb;
            currentDb = instance.db;

            try {
              // Block emailA with 5 failures
              for (let i = 0; i < 5; i++) {
                await recordLoginAttempt(emailA, false);
              }

              const blockedA = await checkRateLimit(emailA);
              const blockedB = await checkRateLimit(emailB);

              expect(blockedA).toBe(true);
              expect(blockedB).toBe(false);
            } finally {
              currentDb = savedDb;
              instance.close();
            }
          }
        ),
        { numRuns: 100 }
      );
    }
  );
});
