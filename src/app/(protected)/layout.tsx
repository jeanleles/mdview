/**
 * Protected layout for MDview.
 *
 * Verifies the session server-side and redirects to /login if absent or
 * invalid. Wraps all protected routes (/files/[fileId], home, etc.) with
 * shared structure.
 *
 * Note: NavigationPanel integration is deferred to task 9.4.
 *
 * Requirements: 1.5
 */

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { jwtVerify } from "jose";
import type { ReactNode } from "react";
import { eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { bookmarks } from "@/lib/db/schema";
import { listLocalFiles, type LocalFile } from "@/lib/files";
import NavigationPanel from "@/components/NavigationPanel";

export const instant = false;

const COOKIE_NAME = "session_token";

async function getSecretKey(): Promise<Uint8Array> {
  const secret = process.env.JWT_SECRET;
  if (!secret) return new Uint8Array(0);
  return new TextEncoder().encode(secret);
}

async function verifySession(): Promise<string | null> {
  const cookieStore = await cookies();
  const token = cookieStore.get(COOKIE_NAME)?.value;
  if (!token) return null;
  try {
    const { payload } = await jwtVerify(token, await getSecretKey(), {
      algorithms: ["HS256"],
    });
    return typeof payload.sub === "string" ? payload.sub : null;
  } catch {
    return null;
  }
}

interface ProtectedLayoutProps {
  children: ReactNode;
}

export default async function ProtectedLayout({ children }: ProtectedLayoutProps) {
  const userId = await verifySession();

  if (!userId) {
    redirect("/login");
  }

  let files: LocalFile[] = [];
  let navigationError: string | null = null;
  try {
    files = await listLocalFiles();
  } catch (error) {
    navigationError =
      error instanceof Error
        ? error.message
        : "Não foi possível carregar os arquivos locais.";
  }

  let bookmarkRecords: Array<{ fileId: string; scrollPercent: number }> = [];
  try {
    bookmarkRecords = await db
      .select({
        fileId: bookmarks.fileId,
        scrollPercent: bookmarks.scrollPercent,
      })
      .from(bookmarks)
      .where(eq(bookmarks.userId, Number(userId)));
  } catch (error) {
    console.error("[protected layout] Failed to load bookmarks:", error);
    navigationError = "Não foi possível recuperar o progresso dos arquivos.";
  }

  return (
    <div className="min-h-screen flex flex-col bg-gray-50 dark:bg-gray-950">
      <div className="flex min-h-screen flex-1">
        <NavigationPanel
          files={files}
          bookmarks={bookmarkRecords}
          error={navigationError}
        />
        <main className="min-w-0 flex-1">{children}</main>
      </div>
    </div>
  );
}
