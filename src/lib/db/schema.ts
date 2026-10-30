/**
 * Drizzle ORM schema for MDview.
 *
 * Tables:
 *  - users          — authenticated users
 *  - files          — globally shared Markdown documents
 *  - bookmarks      — per-user/per-file reading positions
 *  - login_attempts — rate-limiting data for brute-force protection
 *
 * Requirements: 8.5, 8.6, 8.7
 */

import {
  sqliteTable,
  integer,
  text,
  uniqueIndex,
} from "drizzle-orm/sqlite-core";

// ---------------------------------------------------------------------------
// users
// ---------------------------------------------------------------------------

export const users = sqliteTable("users", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  email: text("email").notNull().unique(),
  passwordHash: text("password_hash").notNull(), // bcrypt, cost ≥ 10
  createdAt: integer("created_at", { mode: "timestamp" })
    .notNull()
    .$defaultFn(() => new Date()),
  /** ID of the last local Markdown file the user had open (for the home screen). */
  lastFileId: text("last_file_id"),
});

export const files = sqliteTable(
  "files",
  {
    id: text("id").primaryKey(),
    name: text("name").notNull().unique(),
    content: text("content").notNull(),
    size: integer("size").notNull(),
    createdAt: integer("created_at", { mode: "timestamp" })
      .notNull()
      .$defaultFn(() => new Date()),
    updatedAt: integer("updated_at", { mode: "timestamp" })
      .notNull()
      .$defaultFn(() => new Date()),
  },
  (table) => [
    uniqueIndex("files_name_unique").on(table.name),
  ]
);

// ---------------------------------------------------------------------------
// bookmarks
// ---------------------------------------------------------------------------

export const bookmarks = sqliteTable(
  "bookmarks",
  {
    id: integer("id").primaryKey({ autoIncrement: true }),
    userId: integer("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    /** Local Markdown file ID. */
    fileId: text("file_id").notNull(),
    /** Cached file name for display (avoids extra Drive API calls). */
    fileName: text("file_name").notNull(),
    /** Scroll position as an integer percentage in [0, 100]. */
    scrollPercent: integer("scroll_percent").notNull().default(0),
    updatedAt: integer("updated_at", { mode: "timestamp" })
      .notNull()
      .$defaultFn(() => new Date()),
  },
  (table) => [
    // One bookmark per user per file — enables upsert via ON CONFLICT.
    uniqueIndex("bookmarks_user_file_unique").on(table.userId, table.fileId),
  ]
);

// ---------------------------------------------------------------------------
// login_attempts  (rate limiting)
// ---------------------------------------------------------------------------

export const loginAttempts = sqliteTable("login_attempts", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  email: text("email").notNull(),
  attemptedAt: integer("attempted_at", { mode: "timestamp" })
    .notNull()
    .$defaultFn(() => new Date()),
  success: integer("success", { mode: "boolean" }).notNull().default(false),
});
