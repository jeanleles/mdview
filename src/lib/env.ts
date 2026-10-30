/**
 * Environment variable validation and typed accessors for MDview.
 *
 * This module is evaluated at server startup. Missing required variables
 * throw a descriptive error immediately so the application fails fast
 * instead of surfacing cryptic runtime errors later.
 *
 * Requirements: 8.2
 */

function requireEnv(name: string): string {
  const value = process.env[name];
  if (!value || value.trim() === "") {
    throw new Error(
      `[env] Required environment variable "${name}" is missing or empty. ` +
        `Set it in your .env file. See .env.example for reference.`
    );
  }
  return value.trim();
}

function optionalEnv(name: string, defaultValue: string): string {
  const value = process.env[name];
  return value && value.trim() !== "" ? value.trim() : defaultValue;
}

// ---------------------------------------------------------------------------
// Required variables — throw at module load time if absent
// ---------------------------------------------------------------------------

/** HMAC-SHA256 secret used to sign JWTs. Must be at least 32 characters. */
export const JWT_SECRET: string = requireEnv("JWT_SECRET");

if (JWT_SECRET.length < 32) {
  throw new Error(
    `[env] "JWT_SECRET" must be at least 32 characters long for HMAC-SHA256 security ` +
      `(current length: ${JWT_SECRET.length}).`
  );
}

// ---------------------------------------------------------------------------
// Optional variables — use defaults when absent
// ---------------------------------------------------------------------------

/** Path to the SQLite database file. Defaults to `./data/mdview.db`. */
export const DATABASE_URL: string = optionalEnv("DATABASE_URL", "./data/mdview.db");

/** HTTP port the Next.js server listens on. Defaults to 3000. */
export const PORT: number = (() => {
  const raw = optionalEnv("PORT", "3000");
  const parsed = parseInt(raw, 10);
  if (isNaN(parsed) || parsed < 1 || parsed > 65535) {
    throw new Error(
      `[env] "PORT" must be a valid port number between 1 and 65535 (received: "${raw}").`
    );
  }
  return parsed;
})();

// ---------------------------------------------------------------------------
// Convenience export — all validated env values as a single typed object
// ---------------------------------------------------------------------------

export const env = {
  JWT_SECRET,
  DATABASE_URL,
  PORT,
} as const;

export type Env = typeof env;
