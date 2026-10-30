"use client";

import { useEffect, useState } from "react";
import {
  BOOKMARK_PROGRESS_EVENT,
  type BookmarkProgressDetail,
} from "@/lib/bookmark-events";

interface HomeReadingProgressProps {
  fileId: string | null;
  initialPercent: number;
}

export default function HomeReadingProgress({
  fileId,
  initialPercent,
}: HomeReadingProgressProps) {
  const [progress, setProgress] = useState(initialPercent);

  useEffect(() => {
    if (!fileId) return;

    const updateProgress = (event: Event) => {
      const detail = (event as CustomEvent<BookmarkProgressDetail>).detail;
      if (detail.fileId === fileId) setProgress(detail.scrollPercent);
    };

    window.addEventListener(BOOKMARK_PROGRESS_EVENT, updateProgress);
    return () =>
      window.removeEventListener(BOOKMARK_PROGRESS_EVENT, updateProgress);
  }, [fileId]);

  return (
    <p className="mb-6 text-base leading-relaxed text-gray-600 dark:text-gray-300">
      Progresso salvo: {Math.max(0, Math.min(100, Math.floor(progress)))}%
    </p>
  );
}
