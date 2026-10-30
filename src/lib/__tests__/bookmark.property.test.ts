/**
 * Property-based test for bookmark round trips.
 *
 * // Feature: mdview, Property 2: Marca-página round-trip preserva dado por usuário
 *
 * Validates: Requirements 4.1, 4.6
 */

import { describe, it, expect } from "vitest";
import * as fc from "fast-check";
import Database from "better-sqlite3";
import { drizzle } from "drizzle-orm/better-sqlite3";
import { and, eq } from "drizzle-orm";
import { bookmarks, users } from "@/lib/db/schema";

describe("Bookmark round-trip property tests", () => {
  it(
    // Feature: mdview, Property 2: Marca-página round-trip preserva dado por usuário
    "Property 2 — bookmark values are preserved and isolated per user/file",
    () => {
      fc.assert(
        fc.property(
          fc.integer({ min: 1, max: 100 }),
          fc.integer({ min: 1, max: 100 }),
          fc.string({ minLength: 1, maxLength: 40 }),
          fc.integer({ min: 0, max: 100 }),
          (userId, otherUserId, fileId, scrollPercent) => {
            const sqlite = new Database(":memory:");
            sqlite.exec(`
              CREATE TABLE users (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                email TEXT NOT NULL UNIQUE,
                password_hash TEXT NOT NULL,
                created_at INTEGER NOT NULL,
                last_file_id TEXT
              );
              CREATE TABLE bookmarks (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
                file_id TEXT NOT NULL,
                file_name TEXT NOT NULL,
                scroll_percent INTEGER NOT NULL DEFAULT 0,
                updated_at INTEGER NOT NULL,
                UNIQUE(user_id, file_id)
              );
            `);
            const db = drizzle(sqlite);
            const now = new Date();

            db.insert(users).values({
              id: userId,
              email: `user-${userId}@example.com`,
              passwordHash: "hash",
              createdAt: now,
              lastFileId: null,
            }).run();

            db.insert(bookmarks).values({
              userId,
              fileId,
              fileName: `${fileId}.md`,
              scrollPercent,
              updatedAt: now,
            }).run();

            if (otherUserId !== userId) {
              db.insert(users).values({
                id: otherUserId,
                email: `user-${otherUserId}@example.com`,
                passwordHash: "hash",
                createdAt: now,
                lastFileId: null,
              }).run();
            }

            const rows = db
              .select({ scrollPercent: bookmarks.scrollPercent })
              .from(bookmarks)
              .where(and(eq(bookmarks.userId, userId), eq(bookmarks.fileId, fileId)))
              .all();

            expect(rows).toHaveLength(1);
            expect(rows[0].scrollPercent).toBe(scrollPercent);

            if (otherUserId !== userId) {
              const otherRows = db
                .select({ scrollPercent: bookmarks.scrollPercent })
                .from(bookmarks)
                .where(and(eq(bookmarks.userId, otherUserId), eq(bookmarks.fileId, fileId)))
                .all();

              expect(otherRows).toHaveLength(0);
            }

            sqlite.close();
          }
        ),
        { numRuns: 100 }
      );
    }
  );
});
