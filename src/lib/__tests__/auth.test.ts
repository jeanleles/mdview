/**
 * Unit tests for src/lib/auth.ts
 *
 * Covers:
 *  - createSessionToken / verifySessionToken with correct payload
 *  - verifySessionToken returns null for expired tokens
 *  - hashPassword / verifyPassword
 *
 * Requirements: 1.1, 1.6
 *
 * @vitest-environment node
 */

import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import {
  createSessionToken,
  verifySessionToken,
  hashPassword,
  verifyPassword,
} from "../auth";

// ---------------------------------------------------------------------------
// JWT tests
// ---------------------------------------------------------------------------

describe("createSessionToken / verifySessionToken", () => {
  it("creates a token that can be verified successfully", async () => {
    const userId = 42;
    const token = await createSessionToken(userId);

    expect(typeof token).toBe("string");
    expect(token.split(".")).toHaveLength(3); // standard JWT format

    const payload = await verifySessionToken(token);
    expect(payload).not.toBeNull();
  });

  it("verified payload contains correct sub (userId as string)", async () => {
    const userId = 7;
    const token = await createSessionToken(userId);
    const payload = await verifySessionToken(token);

    expect(payload).not.toBeNull();
    expect(payload!.sub).toBe(String(userId));
  });

  it("verified payload contains iat (issued-at) timestamp", async () => {
    const before = Math.floor(Date.now() / 1000);
    const token = await createSessionToken(1);
    const after = Math.floor(Date.now() / 1000);

    const payload = await verifySessionToken(token);
    expect(payload).not.toBeNull();
    expect(payload!.iat).toBeGreaterThanOrEqual(before);
    expect(payload!.iat).toBeLessThanOrEqual(after);
  });

  it("verified payload contains exp set ~24h in the future", async () => {
    const before = Math.floor(Date.now() / 1000);
    const token = await createSessionToken(1);

    const payload = await verifySessionToken(token);
    expect(payload).not.toBeNull();

    const expectedExp = before + 24 * 60 * 60;
    // Allow 5-second tolerance for test execution time
    expect(payload!.exp).toBeGreaterThanOrEqual(expectedExp - 5);
    expect(payload!.exp).toBeLessThanOrEqual(expectedExp + 5);
  });

  it("returns null for an invalid/tampered token", async () => {
    const result = await verifySessionToken("not.a.valid.jwt");
    expect(result).toBeNull();
  });

  it("returns null for an empty string token", async () => {
    const result = await verifySessionToken("");
    expect(result).toBeNull();
  });

  it("returns null for a token signed with a different secret", async () => {
    // Manually craft a token with a different secret via jose
    const { SignJWT } = await import("jose");
    const wrongKey = new TextEncoder().encode("wrong-secret-that-is-at-least-32-chars!!");
    const token = await new SignJWT({ sub: "1" })
      .setProtectedHeader({ alg: "HS256" })
      .setIssuedAt()
      .setExpirationTime("24h")
      .sign(wrongKey);

    const result = await verifySessionToken(token);
    expect(result).toBeNull();
  });
});

// ---------------------------------------------------------------------------
// Expired token test (uses fake timers)
// ---------------------------------------------------------------------------

describe("verifySessionToken — expired token", () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("returns null when token is expired", async () => {
    // Create a valid token at the current (fake) time
    const token = await createSessionToken(99);

    // Advance time by 25 hours (past the 24h expiry)
    vi.setSystemTime(Date.now() + 25 * 60 * 60 * 1000);

    const result = await verifySessionToken(token);
    expect(result).toBeNull();
  });

  it("returns payload when token is still within 24h window", async () => {
    const token = await createSessionToken(99);

    // Advance time by only 23 hours — still valid
    vi.setSystemTime(Date.now() + 23 * 60 * 60 * 1000);

    const result = await verifySessionToken(token);
    expect(result).not.toBeNull();
    expect(result!.sub).toBe("99");
  });
});

// ---------------------------------------------------------------------------
// Password hashing tests
// ---------------------------------------------------------------------------

describe("hashPassword / verifyPassword", () => {
  it("hashPassword returns a bcrypt hash string", async () => {
    const hash = await hashPassword("my-password");

    expect(typeof hash).toBe("string");
    // bcrypt hashes start with $2b$ (bcryptjs) or $2a$
    expect(hash).toMatch(/^\$2[ab]\$/);
  });

  it("bcrypt hash encodes the expected cost factor (10)", async () => {
    const hash = await hashPassword("any-password");
    // bcrypt format: $2b$<cost>$...
    const costMatch = hash.match(/^\$2[ab]\$(\d+)\$/);
    expect(costMatch).not.toBeNull();
    expect(parseInt(costMatch![1], 10)).toBe(10);
  });

  it("hashPassword produces different hashes for the same password (salting)", async () => {
    const hash1 = await hashPassword("same-password");
    const hash2 = await hashPassword("same-password");

    expect(hash1).not.toBe(hash2);
  });

  it("verifyPassword returns true for correct password", async () => {
    const password = "correct-horse-battery-staple";
    const hash = await hashPassword(password);

    const result = await verifyPassword(password, hash);
    expect(result).toBe(true);
  });

  it("verifyPassword returns false for incorrect password", async () => {
    const hash = await hashPassword("the-real-password");

    const result = await verifyPassword("wrong-password", hash);
    expect(result).toBe(false);
  });

  it("verifyPassword returns false for empty string against a real hash", async () => {
    const hash = await hashPassword("non-empty-password");

    const result = await verifyPassword("", hash);
    expect(result).toBe(false);
  });

  it("verifyPassword returns false for an invalid hash string", async () => {
    const result = await verifyPassword("any-password", "not-a-bcrypt-hash");
    expect(result).toBe(false);
  });
});
