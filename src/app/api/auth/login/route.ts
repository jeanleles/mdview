/**
 * POST /api/auth/login
 *
 * Authenticates a user with email + password credentials.
 *
 * Flow:
 *  1. Parse request body { email, password }
 *  2. Check rate limit — return 429 if blocked
 *  3. Look up user by email in the database
 *  4. Verify password hash
 *  5. Record the login attempt (success or failure)
 *  6. On success: create JWT, set HttpOnly cookie, return 200
 *  7. On failure: return 401 with a generic message (no field disclosure)
 *
 * Requirements: 1.1, 1.2, 1.4, 1.7
 */

import { type NextRequest, NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { users } from "@/lib/db/schema";
import { createSessionToken, verifyPassword } from "@/lib/auth";
import { checkRateLimit, recordLoginAttempt } from "@/lib/rate-limit";

/** Cookie name shared across the application. */
const COOKIE_NAME = "session_token";

/** Session cookie lifetime: 24 hours in seconds. */
const MAX_AGE = 86_400;

export async function POST(request: NextRequest): Promise<NextResponse> {
  // ------------------------------------------------------------------
  // 1. Parse and validate the request body
  // ------------------------------------------------------------------
  let email: string;
  let password: string;

  try {
    const body = await request.json();
    email = String(body?.email ?? "").trim();
    password = String(body?.password ?? "");
  } catch {
    return NextResponse.json(
      { error: "Requisição inválida." },
      { status: 400 }
    );
  }

  if (!email || !password) {
    return NextResponse.json(
      { error: "Requisição inválida." },
      { status: 400 }
    );
  }

  // ------------------------------------------------------------------
  // 2. Rate limit check — Requirement 1.7
  // ------------------------------------------------------------------
  const isBlocked = await checkRateLimit(email);
  if (isBlocked) {
    return NextResponse.json(
      {
        error:
          "Conta temporariamente bloqueada por excesso de tentativas. Tente novamente em 15 minutos.",
        code: "RATE_LIMITED",
      },
      { status: 429 }
    );
  }

  // ------------------------------------------------------------------
  // 3. Look up user by email
  // ------------------------------------------------------------------
  const userRows = await db
    .select()
    .from(users)
    .where(eq(users.email, email))
    .limit(1);

  const user = userRows[0] ?? null;

  // ------------------------------------------------------------------
  // 4. Verify password (always run to prevent timing attacks)
  // ------------------------------------------------------------------
  // Use a placeholder hash when user is not found so the verify call still
  // runs — this keeps timing consistent and prevents user enumeration.
  const DUMMY_HASH =
    "$2a$10$abcdefghijklmnopqrstuvuXYZ012345678901234567890123456";

  const passwordMatch = await verifyPassword(
    password,
    user?.passwordHash ?? DUMMY_HASH
  );

  const success = user !== null && passwordMatch;

  // ------------------------------------------------------------------
  // 5. Record the attempt — Requirement 1.7
  // ------------------------------------------------------------------
  await recordLoginAttempt(email, success);

  // ------------------------------------------------------------------
  // 6. Handle failure — Requirement 1.2: generic message, no field info
  // ------------------------------------------------------------------
  if (!success) {
    return NextResponse.json(
      { error: "Credenciais inválidas" },
      { status: 401 }
    );
  }

  // ------------------------------------------------------------------
  // 7. Issue JWT and set the session cookie — Requirements 1.1, 1.4
  // ------------------------------------------------------------------
  const token = await createSessionToken(user!.id);

  const response = NextResponse.json({ ok: true }, { status: 200 });

  response.cookies.set(COOKIE_NAME, token, {
    httpOnly: true,
    secure: true,
    sameSite: "strict",
    maxAge: MAX_AGE,
    path: "/",
  });

  return response;
}
