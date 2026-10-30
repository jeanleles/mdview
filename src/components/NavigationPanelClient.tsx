"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useRef, useState } from "react";
import type { LocalFile } from "@/lib/files";
import { getBookmarkProgress, getNavButtonState } from "@/lib/navigation";

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
  const fileInputRef = useRef<HTMLInputElement>(null);
  const router = useRouter();
  const pathname = usePathname();
  const pathnameFileId = pathname.startsWith("/files/")
    ? pathname.split("/")[2]
    : undefined;
  const resolvedCurrentFileId = currentFileId ?? pathnameFileId;
  const currentIndex = files.findIndex((file) => file.id === resolvedCurrentFileId);
  const navState = getNavButtonState(
    files.map((file) => file.id),
    currentIndex
  );
  const previous = navState.prevEnabled ? files[currentIndex - 1] : null;
  const next = navState.nextEnabled ? files[currentIndex + 1] : null;

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
        <button
          type="button"
          onClick={() => setOpen(false)}
          className="min-h-11 min-w-11 md:hidden rounded-lg px-3 text-gray-700 hover:bg-gray-100 dark:text-gray-200 dark:hover:bg-gray-800"
          aria-label="Fechar painel"
        >
          Fechar
        </button>
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
        <button
          type="button"
          onClick={() => fileInputRef.current?.click()}
          disabled={uploading}
          className="mb-3 min-h-11 w-full rounded-lg bg-blue-700 px-4 py-2 text-base font-semibold text-white hover:bg-blue-800 disabled:opacity-60"
        >
          {uploading ? "Enviando..." : "Enviar arquivo Markdown"}
        </button>
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
          const progress = getBookmarkProgress(file.id, bookmarks);
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
              <span className="min-w-0 truncate">{file.name}</span>
              <span className="shrink-0 text-sm tabular-nums text-gray-600 dark:text-gray-400">
                {progress}%
              </span>
            </Link>
          );
        })}
      </nav>

      {resolvedCurrentFileId && (
        <div className="grid grid-cols-2 gap-2 border-t border-gray-200 p-3 dark:border-gray-800">
          {previous ? (
            <Link
              href={`/files/${previous.id}`}
              className="min-h-11 rounded-lg border border-gray-300 px-3 py-2 text-center text-sm font-medium"
            >
              Arquivo Anterior
            </Link>
          ) : (
            <button type="button" disabled className="min-h-11 rounded-lg border px-3 py-2 text-sm opacity-50">
              Arquivo Anterior
            </button>
          )}
          {next ? (
            <Link
              href={`/files/${next.id}`}
              className="min-h-11 rounded-lg border border-gray-300 px-3 py-2 text-center text-sm font-medium"
            >
              Próximo Arquivo
            </Link>
          ) : (
            <button type="button" disabled className="min-h-11 rounded-lg border px-3 py-2 text-sm opacity-50">
              Próximo Arquivo
            </button>
          )}
        </div>
      )}

      <button
        type="button"
        onClick={logout}
        className="m-3 min-h-11 rounded-lg border border-gray-300 px-4 py-2 text-base font-medium hover:bg-gray-100 dark:border-gray-700 dark:hover:bg-gray-900"
      >
        Sair
      </button>
    </aside>
  );

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="fixed left-3 top-3 z-40 min-h-11 min-w-11 rounded-lg border border-gray-300 bg-white px-3 shadow md:hidden dark:border-gray-700 dark:bg-gray-950"
        aria-label="Abrir painel de navegação"
      >
        Menu
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
