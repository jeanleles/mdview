import bcrypt from "bcryptjs";
import { eq } from "drizzle-orm";
import { db } from "../src/lib/db";
import { users } from "../src/lib/db/schema";

async function main() {
  const email = process.env.SEED_ADMIN_EMAIL?.trim().toLowerCase();
  const password = process.env.SEED_ADMIN_PASSWORD;

  if (!email) {
    throw new Error("SEED_ADMIN_EMAIL is required.");
  }

  if (!password || password.length < 12) {
    throw new Error(
      "SEED_ADMIN_PASSWORD is required and must have at least 12 characters."
    );
  }

  const existing = await db
    .select({ id: users.id })
    .from(users)
    .where(eq(users.email, email))
    .limit(1);

  if (existing.length > 0) {
    console.log(`Admin already exists: ${email}`);
    return;
  }

  const passwordHash = await bcrypt.hash(password, 10);

  await db.insert(users).values({ email, passwordHash });

  console.log(`Admin created: ${email}`);
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error);
  process.exit(1);
});
