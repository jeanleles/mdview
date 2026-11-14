"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import type { LocalFile } from "@/lib/files";
import { getBookmarkProgress } from "@/lib/navigation";
import {
  BOOKMARK_PROGRESS_EVENT,
  type BookmarkProgressDetail,
} from "@/lib/bookmark-events";

export interface BookmarkRecord {
  fileId: string;
  scrollPercent: number;
}

interface NavigationPanelClientProps {
  files: LocalFile[];
  currentFileId?: string;
  bookmarks: BookmarkRecord[];
  error?: string | null;
}

export default function NavigationPanelClient({
  files,
  currentFileId,
  bookmarks,
  error,
}: NavigationPanelClientProps) {
  const [open, setOpen] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [liveBookmarks, setLiveBookmarks] = useState<BookmarkRecord[]>([]);
  const [darkMode, setDarkMode] = useState(
    () => typeof document !== "undefined" &&
      document.documentElement.classList.contains("dark")
  );
  const fileInputRef = useRef<HTMLInputElement>(null);
  const router = useRouter();
  const pathname = usePathname();
  const pathnameFileId = pathname.startsWith("/files/")
    ? pathname.split("/")[2]
    : undefined;
  const resolvedCurrentFileId = currentFileId ?? pathnameFileId;

  useEffect(() => {
    const updateBookmark = (event: Event) => {
      const { fileId, scrollPercent } = (
        event as CustomEvent<BookmarkProgressDetail>
      ).detail;
      setLiveBookmarks((current) => {
        const existing = current.find((bookmark) => bookmark.fileId === fileId);
        if (!existing) return [...current, { fileId, scrollPercent }];
        if (existing.scrollPercent === scrollPercent) return current;
        return current.map((bookmark) =>
          bookmark.fileId === fileId ? { ...bookmark, scrollPercent } : bookmark
        );
      });
    };

    window.addEventListener(BOOKMARK_PROGRESS_EVENT, updateBookmark);
    return () => window.removeEventListener(BOOKMARK_PROGRESS_EVENT, updateBookmark);
  }, []);

  function toggleTheme() {
    const nextDarkMode = !document.documentElement.classList.contains("dark");
    document.documentElement.classList.toggle("dark", nextDarkMode);
    localStorage.setItem("mdview-theme", nextDarkMode ? "dark" : "light");
    setDarkMode(nextDarkMode);
  }

  async function logout() {
    await fetch("/api/auth/logout", { method: "POST" });
    router.push("/login");
    router.refresh();
  }

  async function uploadFile(file: File) {
    setUploadError(null);
    setUploading(true);

    try {
      const formData = new FormData();
      formData.append("file", file);
      const response = await fetch("/api/files", {
        method: "POST",
        body: formData,
      });
      const body = await response.json();

      if (!response.ok) {
        throw new Error(body.error ?? "Não foi possível enviar o arquivo.");
      }

      router.refresh();
    } catch (error) {
      setUploadError(
        error instanceof Error ? error.message : "Não foi possível enviar o arquivo."
      );
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  }

  const panel = (
    <aside
      className={`
        fixed inset-y-0 left-0 z-50 flex w-[min(86vw,320px)] flex-col border-r
        border-gray-200 bg-white shadow-xl transition-transform duration-200
        md:sticky md:top-0 md:z-20 md:h-screen md:w-72 md:translate-x-0 md:shadow-none
        dark:border-gray-800 dark:bg-gray-950
        ${open ? "translate-x-0" : "-translate-x-full md:translate-x-0"}
      `}
      aria-label="Painel de navegação"
    >
      <div className="flex min-h-16 items-center justify-between border-b border-gray-200 px-4 dark:border-gray-800">
        <Link
          href="/"
          className="min-h-11 flex items-center text-lg font-bold text-gray-900 dark:text-gray-100"
        >
          MDview
        </Link>
        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            disabled={uploading}
            className="flex min-h-11 min-w-11 items-center justify-center rounded-lg text-gray-700 hover:bg-gray-100 disabled:cursor-not-allowed disabled:opacity-60 dark:text-gray-200 dark:hover:bg-gray-800"
            aria-label={uploading ? "Enviando arquivo" : "Enviar arquivo Markdown"}
            title={uploading ? "Enviando..." : "Enviar arquivo Markdown"}
          >
            <svg
              aria-hidden="true"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="h-5 w-5"
            >
              <path d="M12 16V4" />
              <path d="M7 9l5-5 5 5" />
              <path d="M5 20h14" />
            </svg>
          </button>
          <button
            type="button"
            onClick={toggleTheme}
            className="flex min-h-11 min-w-11 items-center justify-center rounded-lg text-gray-700 hover:bg-gray-100 dark:text-gray-200 dark:hover:bg-gray-800"
            aria-label={darkMode ? "Ativar modo claro" : "Ativar modo escuro"}
            title={darkMode ? "Ativar modo claro" : "Ativar modo escuro"}
          >
            {darkMode ? (
              <svg
                aria-hidden="true"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                className="h-5 w-5"
              >
                <circle cx="12" cy="12" r="4" />
                <path d="M12 2v2M12 20v2M4.93 4.93l1.42 1.42M17.66 17.66l1.41 1.41M2 12h2M20 12h2M4.93 19.07l1.42-1.42M17.66 6.34l1.41-1.41" />
              </svg>
            ) : (
              <svg
                aria-hidden="true"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                className="h-5 w-5"
              >
                <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
              </svg>
            )}
          </button>
          <button
            type="button"
            onClick={logout}
            className="flex min-h-11 min-w-11 items-center justify-center rounded-lg text-gray-700 hover:bg-gray-100 dark:text-gray-200 dark:hover:bg-gray-900"
            aria-label="Sair"
            title="Sair"
          >
            <svg
              aria-hidden="true"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="h-5 w-5"
            >
              <path d="M10 17l5-5-5-5" />
              <path d="M15 12H3" />
              <path d="M14 3h5a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-5" />
            </svg>
          </button>
          <button
            type="button"
            onClick={() => setOpen(false)}
            className="flex min-h-11 min-w-11 items-center justify-center rounded-lg text-gray-700 hover:bg-gray-100 md:hidden dark:text-gray-200 dark:hover:bg-gray-800"
            aria-label="Fechar painel"
            title="Fechar painel"
          >
            <svg
              aria-hidden="true"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="h-5 w-5"
            >
              <path d="M18 6 6 18" />
              <path d="m6 6 12 12" />
            </svg>
          </button>
        </div>
      </div>

      <nav className="min-h-0 flex-1 overflow-y-auto p-3" aria-label="Arquivos">
        <input
          ref={fileInputRef}
          type="file"
          accept=".md,text/markdown,text/plain"
          className="hidden"
          aria-label="Selecionar arquivo Markdown"
          onChange={(event) => {
            const file = event.target.files?.[0];
            if (file) void uploadFile(file);
          }}
        />
        {uploadError && (
          <div role="alert" className="mb-3 rounded-lg bg-red-50 p-3 text-sm text-red-700">
            {uploadError}
          </div>
        )}
        {error && (
          <div role="alert" className="mb-3 rounded-lg bg-red-50 p-3 text-sm text-red-700">
            {error}
          </div>
        )}
        {files.length === 0 && !error && (
          <p className="px-3 py-4 text-base text-gray-600 dark:text-gray-400">
            Nenhum arquivo encontrado
          </p>
        )}
        {files.map((file) => {
          const active = file.id === resolvedCurrentFileId;
          const liveProgress = liveBookmarks.find(
            (bookmark) => bookmark.fileId === file.id
          );
          const progress = liveProgress
            ? liveProgress.scrollPercent
            : getBookmarkProgress(file.id, bookmarks);
          return (
            <Link
              key={file.id}
              href={`/files/${file.id}`}
              onClick={() => setOpen(false)}
              className={`
                mb-1 min-h-11 flex items-center justify-between gap-2 rounded-lg px-3 py-2 text-base
                ${active
                  ? "border-l-4 border-blue-700 bg-blue-50 font-semibold text-blue-900 dark:bg-blue-950 dark:text-blue-100"
                  : "text-gray-800 hover:bg-gray-100 dark:text-gray-200 dark:hover:bg-gray-900"}
              `}
              aria-current={active ? "page" : undefined}
            >
              <span className="min-w-0 truncate" title={file.name}>{file.name}</span>
              <span className="shrink-0 text-sm tabular-nums text-gray-600 dark:text-gray-400">
                {progress}%
              </span>
            </Link>
          );
        })}
      </nav>
    </aside>
  );

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="fixed left-3 top-3 z-40 flex min-h-11 min-w-11 items-center justify-center rounded-lg border border-gray-300 bg-white shadow md:hidden dark:border-gray-700 dark:bg-gray-950"
        aria-label="Abrir painel de navegação"
        title="Abrir painel de navegação"
      >
        <svg
          aria-hidden="true"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          className="h-5 w-5"
        >
          <path d="M4 6h16" />
          <path d="M4 12h16" />
          <path d="M4 18h16" />
        </svg>
      </button>
      {open && (
        <button
          type="button"
          className="fixed inset-0 z-40 bg-black/40 md:hidden"
          onClick={() => setOpen(false)}
          aria-label="Fechar painel tocando fora"
        />
      )}
      {panel}
    </>
  );
}
