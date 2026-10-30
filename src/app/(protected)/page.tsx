import Link from "next/link";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { and, eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { bookmarks, users } from "@/lib/db/schema";
import { verifySessionToken } from "@/lib/auth";
import { listLocalFiles } from "@/lib/files";

export const instant = false;

export default async function HomePage() {
  const cookieStore = await cookies();
  const token = cookieStore.get("session_token")?.value;
  const payload = token ? await verifySessionToken(token) : null;
  const userId = payload?.sub ? Number(payload.sub) : null;

  if (!userId || !Number.isInteger(userId)) {
    redirect("/login");
  }

  const [userRows, files] = await Promise.all([
    db.select({ lastFileId: users.lastFileId }).from(users).where(eq(users.id, userId)).limit(1),
    listLocalFiles().catch(() => []),
  ]);

  const lastFileId = userRows[0]?.lastFileId ?? null;
  const lastFile = lastFileId
    ? files.find((file) => file.id === lastFileId)
    : undefined;

  let scrollPercent = 0;
  if (lastFileId) {
    try {
      const bookmarkRows = await db
        .select({ scrollPercent: bookmarks.scrollPercent })
        .from(bookmarks)
        .where(
          and(
            eq(bookmarks.userId, userId),
            eq(bookmarks.fileId, lastFileId)
          )
        )
        .limit(1);
      scrollPercent = bookmarkRows[0]?.scrollPercent ?? 0;
    } catch {
      scrollPercent = 0;
    }
  }

  if (lastFileId && lastFile) {
    return (
      <main className="mx-auto flex min-h-[calc(100vh-1px)] w-full max-w-3xl flex-col items-start justify-center px-6 py-16">
        <p className="mb-2 text-sm font-semibold uppercase tracking-wide text-blue-700 dark:text-blue-400">
          Última leitura
        </p>
        <h1 className="mb-4 text-3xl font-bold text-gray-950 dark:text-gray-100">
          {lastFile.name}
        </h1>
        <p className="mb-6 text-base leading-relaxed text-gray-600 dark:text-gray-300">
          Progresso salvo: {Math.max(0, Math.min(100, Math.floor(scrollPercent)))}%
        </p>
        <Link
          href={`/files/${lastFileId}`}
          className="min-h-11 flex items-center rounded-lg bg-blue-700 px-6 py-3 text-base font-semibold text-white hover:bg-blue-800"
        >
          Retomar leitura
        </Link>
      </main>
    );
  }

  return (
    <main className="mx-auto flex min-h-[calc(100vh-1px)] w-full max-w-3xl flex-col justify-center px-6 py-16">
      <h1 className="mb-3 text-3xl font-bold text-gray-950 dark:text-gray-100">
        Apostilas
      </h1>
      {files.length === 0 ? (
        <p className="text-base text-gray-600 dark:text-gray-300">
          Nenhum arquivo encontrado
        </p>
      ) : (
        <div className="flex flex-col gap-2">
          {files.map((file) => (
            <Link
              key={file.id}
              href={`/files/${file.id}`}
              className="min-h-11 flex items-center rounded-lg border border-gray-200 px-4 py-3 text-base font-medium text-gray-900 hover:bg-gray-100 dark:border-gray-800 dark:text-gray-100 dark:hover:bg-gray-900"
            >
              {file.name}
            </Link>
          ))}
        </div>
      )}
    </main>
  );
}
