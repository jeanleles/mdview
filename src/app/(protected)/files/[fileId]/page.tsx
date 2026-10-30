/**
 * File view page — renders a single locally stored Markdown file.
 *
 * This is a Server Component: data fetching happens on the server and the
 * rendered HTML is streamed to the client. The interactive
 * MarkdownRenderer (Client Component) handles link interception and
 * in-app navigation.
 *
 * Error handling (Requirement 3.5):
 *   If the file content cannot be loaded, an error message is displayed
 *   in-place. The page does NOT redirect — the user's navigation state
 *   (URL, browser history) remains unchanged.
 *
 * Typography (Requirements 3.2, 7.5):
 *   - Minimum font-size: 16px (1rem) — enforced via Tailwind `text-base` and
 *     inline style on the prose container.
 *   - Minimum line-height: 1.5 — enforced via `leading-relaxed` (1.625) and
 *     inline style.
 *   - No horizontal overflow from 320px wide viewports — enforced via
 *     `min-w-0 overflow-x-hidden max-w-[600px]` on the content wrapper.
 *
 * Future tasks:
 *   - BookmarkRestorer: will be added in task 7.7
 *   - ScrollTracker:    will be added in task 7.6
 *
 * Requirements: 3.1, 3.2, 3.5, 7.5
 */

import { Suspense } from "react";
import { getLocalFile, listLocalFiles } from "@/lib/files";
import MarkdownRenderer from "@/components/MarkdownRenderer";
import BookmarkRestorer from "@/components/BookmarkRestorer";
import ScrollTracker from "@/components/ScrollTracker";
import { cookies } from "next/headers";
import { eq, and } from "drizzle-orm";
import { db } from "@/lib/db";
import { bookmarks } from "@/lib/db/schema";
import { verifySessionToken } from "@/lib/auth";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface FilePageProps {
  params: Promise<{ fileId: string }>;
}

export const instant = false;

// ---------------------------------------------------------------------------
// Error UI
// ---------------------------------------------------------------------------

interface FileLoadErrorProps {
  fileId: string;
  message: string;
}

function FileLoadError({ fileId, message }: FileLoadErrorProps) {
  return (
    <div
      role="alert"
      aria-live="assertive"
      className="flex flex-col items-center justify-center gap-4 px-6 py-16 text-center"
    >
      {/* Icon */}
      <span className="text-5xl" aria-hidden="true">
        ⚠️
      </span>

      {/* Heading */}
      <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100">
        Não foi possível carregar o arquivo
      </h2>

      {/* User-facing error detail */}
      <p className="max-w-md text-base text-gray-600 dark:text-gray-400">
        {message}
      </p>

      {/* Technical ID for debugging — hidden from screen readers */}
      <p
        className="text-xs text-gray-400 dark:text-gray-600 font-mono"
        aria-hidden="true"
      >
        ID: {fileId}
      </p>

      {/* Instruction: do NOT redirect — requirement 3.5 says navigation state
          must be preserved. The user can press the browser back button or
          choose another file from the navigation panel. */}
      <p className="text-sm text-gray-500 dark:text-gray-500">
        Use o painel de navegação ou o botão Voltar do navegador para continuar.
      </p>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Content loader
// ---------------------------------------------------------------------------

interface FileContentProps {
  fileId: string;
}

async function FileContent({ fileId }: FileContentProps) {
  // Fetch content and file list concurrently to minimise latency.
  // Both are independent requests; a failure in either is handled below.
  let content = "";
  let fileList: Array<{ id: string; name: string }> = [];
  let fileName = "Arquivo";
  let storedFile: Awaited<ReturnType<typeof getLocalFile>> = null;
  let loadError: string | null = null;

  try {
    const [loadedFile, localFiles] = await Promise.all([
      getLocalFile(fileId),
      listLocalFiles(),
    ]);
    storedFile = loadedFile;
    content = storedFile?.content ?? "";
    fileList = localFiles.map((file) => ({ id: file.id, name: file.name }));
    fileName = storedFile?.name ?? "Arquivo";
  } catch (err) {
    loadError =
      err instanceof Error
        ? err.message
        : "Erro desconhecido ao buscar o arquivo local.";
  }

  if (loadError) {
    return <FileLoadError fileId={fileId} message={loadError} />;
  }
  if (!storedFile) {
    return <FileLoadError fileId={fileId} message="Arquivo não encontrado." />;
  }

  let initialPercent = 0;
  let bookmarkError: string | null = null;

  try {
    const cookieStore = await cookies();
    const token = cookieStore.get("session_token")?.value;
    const payload = token ? await verifySessionToken(token) : null;
    const userId = payload?.sub ? Number(payload.sub) : null;

    if (userId && Number.isInteger(userId)) {
      const rows = await db
        .select({ scrollPercent: bookmarks.scrollPercent })
        .from(bookmarks)
        .where(and(eq(bookmarks.userId, userId), eq(bookmarks.fileId, fileId)))
        .limit(1);

      initialPercent = rows[0]?.scrollPercent ?? 0;
    }
  } catch {
    bookmarkError =
      "Não foi possível recuperar a posição salva. O arquivo será exibido do início.";
    initialPercent = 0;
  }

  return (
    <>
      {bookmarkError && (
        <div role="alert" className="mx-auto max-w-[600px] px-4 pt-4 text-sm text-red-700">
          {bookmarkError}
        </div>
      )}
      <BookmarkRestorer scrollPercent={initialPercent} />
      <ScrollTracker
        key={fileId}
        fileId={fileId}
        fileName={fileName}
        initialPercent={initialPercent}
      />

      {/*
       * Prose container
       * ───────────────
       * - max-w-[600px] → limits the reading column to 600px
       * - min-w-0        → prevents flex/grid children from overflowing
       * - overflow-x-hidden → no horizontal scroll on narrow viewports (req 3.2)
       * - text-base      → font-size: 1rem (16px) — requirement 3.2 / 7.5
       * - leading-relaxed → line-height: 1.625 (> 1.5) — requirement 3.2 / 7.5
       * - px-4 sm:px-6  → horizontal padding; keeps text off the edge on mobile
       * - py-6 sm:py-10 → vertical breathing room
       * - mx-auto        → centres the column within the layout
       */}
      <div
        className="
          w-full min-w-0 overflow-x-hidden
          max-w-[600px] mx-auto
          px-4 sm:px-6
          py-6 sm:py-10
          text-base leading-relaxed
          text-gray-900 dark:text-gray-100
        "
        style={{
          // Reinforce typographic requirements inline so they survive
          // any Tailwind purge edge-case (requirements 3.2, 7.5).
          fontSize: "1rem",       // ≥ 16px
          lineHeight: "1.625",    // ≥ 1.5
        }}
      >
        <MarkdownRenderer content={content} fileList={fileList} />
      </div>
    </>
  );
}

// ---------------------------------------------------------------------------
// Page component
// ---------------------------------------------------------------------------

export default async function FilePage({ params }: FilePageProps) {
  const { fileId } = await params;

  return (
    /*
     * Outer container — fills the available viewport height so the
     * loading skeleton (Suspense fallback) looks right on slow connections.
     */
    <div className="w-full min-w-0 overflow-x-hidden">
      <Suspense fallback={<FileLoadingSkeleton />}>
        <FileContent fileId={fileId} />
      </Suspense>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Loading skeleton
// ---------------------------------------------------------------------------

function FileLoadingSkeleton() {
  return (
    <div
      aria-label="Carregando arquivo…"
      aria-busy="true"
      className="
        w-full max-w-[600px] mx-auto
        px-4 sm:px-6 py-6 sm:py-10
        animate-pulse space-y-4
      "
    >
      {/* Simulate heading */}
      <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded w-2/3" />
      {/* Simulate paragraph lines */}
      <div className="space-y-2">
        <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-full" />
        <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-11/12" />
        <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-4/5" />
      </div>
      <div className="space-y-2 pt-2">
        <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-full" />
        <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-10/12" />
        <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-3/4" />
      </div>
    </div>
  );
}
