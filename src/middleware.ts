/**
 * Route protection middleware for MDview.
 *
 * Runs on Edge Runtime using `jose` for JWT verification (no Node.js-only
 * modules). Protects all routes except the login page, auth API endpoints,
 * Next.js internals and static assets.
 *
 * Behaviour:
 *  - No `session_token` cookie  → redirect to /login
 *  - Invalid / expired JWT      → redirect to /login
 *  - Valid JWT                  → slide the session (new token with +24h
 *                                  expiry) and forward the request
 *
 * Requirements: 1.3, 1.5
 */

import { NextRequest, NextResponse } from "next/server";
import { SignJWT, jwtVerify } from "jose";

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const COOKIE_NAME = "session_token";
const SESSION_TTL_SECONDS = 24 * 60 * 60; // 86 400 s  (24 hours)
const LOGIN_PATH = "/login";

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/**
 * Returns the secret key as a `Uint8Array` suitable for `jose`.
 * Reads directly from `process.env.JWT_SECRET` to stay Edge-compatible
 * (avoids importing `src/lib/env.ts` which throws on missing vars at load
 * time and bundles non-Edge code).
 */
function getSecretKey(): Uint8Array {
  const secret = process.env.JWT_SECRET;
  if (!secret) {
    // In production a missing JWT_SECRET is a hard error; the app should
    // not have started. Here we return an empty key so the subsequent
    // jwtVerify call fails gracefully and the user is redirected to /login.
    return new Uint8Array(0);
  }
  return new TextEncoder().encode(secret);
}

/**
 * Attempts to verify a JWT string. Returns the `sub` claim (userId) on
 * success, or `null` when the token is invalid / expired / malformed.
 */
async function verifyToken(token: string): Promise<string | null> {
  try {
    const { payload } = await jwtVerify(token, getSecretKey(), {
      algorithms: ["HS256"],
    });
    return typeof payload.sub === "string" ? payload.sub : null;
  } catch {
    return null;
  }
}

/**
 * Issues a new JWT for the given `userId` with a fresh +24 h expiry.
 * This implements the sliding-session strategy.
 */
async function renewToken(userId: string): Promise<string> {
  const now = Math.floor(Date.now() / 1000);

  return new SignJWT({ sub: userId })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt(now)
    .setExpirationTime(now + SESSION_TTL_SECONDS)
    .sign(getSecretKey());
}

// ---------------------------------------------------------------------------
// Middleware
// ---------------------------------------------------------------------------

export async function middleware(request: NextRequest): Promise<NextResponse> {
  const token = request.cookies.get(COOKIE_NAME)?.value;

  // No cookie → redirect to login immediately.
  if (!token) {
    return NextResponse.redirect(new URL(LOGIN_PATH, request.url));
  }

  const userId = await verifyToken(token);

  // Invalid or expired token → redirect to login.
  if (!userId) {
    const response = NextResponse.redirect(new URL(LOGIN_PATH, request.url));
    // Clear the stale cookie so browsers don't keep sending it.
    response.cookies.set(COOKIE_NAME, "", {
      httpOnly: true,
      secure: true,
      sameSite: "strict",
      maxAge: 0,
      path: "/",
    });
    return response;
  }

  // Valid token — forward the request and slide the session expiry.
  const response = NextResponse.next();
  const newToken = await renewToken(userId);

  response.cookies.set(COOKIE_NAME, newToken, {
    httpOnly: true,
    secure: true,
    sameSite: "strict",
    maxAge: SESSION_TTL_SECONDS,
    path: "/",
  });

  return response;
}

// ---------------------------------------------------------------------------
// Matcher — routes the middleware applies to
// ---------------------------------------------------------------------------

export const config = {
  matcher: [
    /*
     * Match all paths EXCEPT:
     *   /login
     *   /api/auth/*   (login and logout endpoints)
     *   /_next/*      (Next.js internals: static files, HMR, etc.)
     *   /favicon.ico
     */
    "/((?!login$|api/auth/|_next/|favicon\\.ico$).*)",
  ],
};
