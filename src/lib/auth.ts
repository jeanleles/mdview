/**
 * Authentication utilities for MDview.
 *
 * Provides JWT session token creation/verification and password hashing.
 *
 * Requirements: 1.1, 1.3, 1.6
 */

import { SignJWT, jwtVerify, type JWTPayload } from "jose";
import bcrypt from "bcryptjs";
import { JWT_SECRET } from "./env";

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

/** Session lifetime in seconds: 24 hours. */
const SESSION_TTL_SECONDS = 24 * 60 * 60; // 86400s

/** bcrypt cost factor — must be ≥10 per Requirement 1.6. */
const BCRYPT_COST = 10;

// ---------------------------------------------------------------------------
// JWT secret key (Uint8Array required by jose)
// ---------------------------------------------------------------------------

const SECRET_KEY = new TextEncoder().encode(JWT_SECRET);

// ---------------------------------------------------------------------------
// JWT helpers
// ---------------------------------------------------------------------------

/**
 * Creates a signed JWT session token for the given user.
 *
 * Payload: `{ sub: "<userId>", iat, exp (+24h) }`
 *
 * @param userId - The numeric database user ID.
 * @returns Signed JWT string.
 */
export async function createSessionToken(userId: number): Promise<string> {
  const now = Math.floor(Date.now() / 1000);

  return new SignJWT({ sub: String(userId) })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt(now)
    .setExpirationTime(now + SESSION_TTL_SECONDS)
    .sign(SECRET_KEY);
}

/**
 * Verifies a JWT session token and returns the decoded payload.
 *
 * Sliding session: the caller (middleware) is responsible for issuing a
 * renewed token after a successful verification.
 *
 * @param token - The JWT string to verify.
 * @returns The decoded `JWTPayload` on success, or `null` if the token is
 *          invalid, expired, or malformed.
 */
export async function verifySessionToken(token: string): Promise<JWTPayload | null> {
  try {
    const { payload } = await jwtVerify(token, SECRET_KEY, {
      algorithms: ["HS256"],
    });
    return payload;
  } catch {
    // Token is invalid, expired, or tampered with — return null as documented.
    return null;
  }
}

// ---------------------------------------------------------------------------
// Password hashing
// ---------------------------------------------------------------------------

/**
 * Hashes a plain-text password using bcrypt with cost factor 10.
 *
 * @param password - The plain-text password to hash.
 * @returns The bcrypt hash string.
 */
export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, BCRYPT_COST);
}

/**
 * Verifies a plain-text password against a bcrypt hash.
 *
 * @param password - The plain-text password to check.
 * @param hash     - The stored bcrypt hash.
 * @returns `true` if the password matches, `false` otherwise.
 */
export async function verifyPassword(password: string, hash: string): Promise<boolean> {
  return bcrypt.compare(password, hash);
}
