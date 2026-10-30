/**
 * POST /api/auth/logout
 *
 * Terminates the current session by clearing the session cookie.
 *
 * Sets Max-Age=0 on the `session_token` cookie so the browser deletes it
 * immediately, effectively ending the authenticated session.
 *
 * Requirements: 1.4
 */

import { NextResponse } from "next/server";

/** Cookie name shared across the application. */
const COOKIE_NAME = "session_token";

export async function POST(): Promise<NextResponse> {
  const response = NextResponse.json({ ok: true }, { status: 200 });

  // Clear the session cookie by setting Max-Age=0.
  response.cookies.set(COOKIE_NAME, "", {
    httpOnly: true,
    secure: true,
    sameSite: "strict",
    maxAge: 0,
    path: "/",
  });

  return response;
}
