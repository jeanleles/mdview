/**
 * Rate limiting logic for login attempts.
 *
 * Rules (Requirement 1.7):
 *  - Count failed login attempts for a given email in the last 15 minutes.
 *  - If the count is ≥ 5, the email is blocked (checkRateLimit returns true).
 *  - Every login attempt (success or failure) is recorded in `login_attempts`.
 */

import { and, count, eq, gt } from "drizzle-orm";
import { db } from "@/lib/db";
import { loginAttempts } from "@/lib/db/schema";

/** Duration of the rate-limit window in milliseconds (15 minutes). */
const WINDOW_MS = 15 * 60 * 1000;

/** Maximum number of failures allowed within the window before blocking. */
const MAX_FAILURES = 5;

/**
 * Check whether a given email is currently rate-limited.
 *
 * @returns `true` if the email is blocked (≥ 5 failures in the last 15 min),
 *          `false` otherwise.
 */
export async function checkRateLimit(email: string): Promise<boolean> {
  const windowStart = new Date(Date.now() - WINDOW_MS);

  const result = await db
    .select({ failureCount: count(loginAttempts.id) })
    .from(loginAttempts)
    .where(
      and(
        eq(loginAttempts.email, email),
        eq(loginAttempts.success, false),
        gt(loginAttempts.attemptedAt, windowStart)
      )
    );

  const failureCount = result[0]?.failureCount ?? 0;
  return failureCount >= MAX_FAILURES;
}

/**
 * Record a login attempt for the given email.
 *
 * @param email   The email address that attempted login.
 * @param success Whether the attempt was successful.
 */
export async function recordLoginAttempt(
  email: string,
  success: boolean
): Promise<void> {
  await db.insert(loginAttempts).values({
    email,
    success,
    attemptedAt: new Date(),
  });
}
