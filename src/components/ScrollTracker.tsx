"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { calcProgress } from "@/lib/progress";
import ProgressBar from "./ProgressBar";

interface ScrollTrackerProps {
  fileId: string;
  fileName: string;
  initialPercent?: number;
}

export default function ScrollTracker({
  fileId,
  fileName,
  initialPercent = 0,
}: ScrollTrackerProps) {
  const [progress, setProgress] = useState(initialPercent);
  const progressRef = useRef(initialPercent);
  const lastSavedRef = useRef(initialPercent);
  const saveTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const initialRequestSentRef = useRef(false);

  const save = useCallback(
    (keepalive = false) => {
      if (progressRef.current === lastSavedRef.current) return;
      lastSavedRef.current = progressRef.current;

      fetch("/api/bookmarks", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          fileId,
          fileName,
          scrollPercent: progressRef.current,
        }),
        keepalive,
      }).catch(() => {
        // Bookmark persistence is best-effort and must not block navigation.
      });
    },
    [fileId, fileName]
  );

  useEffect(() => {
    const updateProgress = () => {
      const next = calcProgress(
        window.scrollY,
        document.documentElement.scrollHeight,
        window.innerHeight
      );

      if (next !== progressRef.current) {
        progressRef.current = next;
        setProgress(next);
      }
    };

    const onScroll = () => {
      updateProgress();
      if (saveTimerRef.current) clearTimeout(saveTimerRef.current);
      saveTimerRef.current = setTimeout(() => save(), 2000);
    };

    const onBeforeUnload = () => save(true);
    if (!initialRequestSentRef.current) {
      initialRequestSentRef.current = true;
      fetch("/api/bookmarks", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          fileId,
          fileName,
          scrollPercent: progressRef.current,
        }),
        keepalive: false,
      }).catch(() => {
        // Bookmark persistence is best-effort.
      });
      lastSavedRef.current = progressRef.current;
    }

    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("beforeunload", onBeforeUnload);

    return () => {
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("beforeunload", onBeforeUnload);
      if (saveTimerRef.current) clearTimeout(saveTimerRef.current);
      save(true);
    };
  }, [save, fileId, fileName]);

  return <ProgressBar progress={progress} />;
}
