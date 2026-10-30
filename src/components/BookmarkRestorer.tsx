"use client";

import { useEffect } from "react";

interface BookmarkRestorerProps {
  scrollPercent: number;
}

export default function BookmarkRestorer({ scrollPercent }: BookmarkRestorerProps) {
  useEffect(() => {
    const restore = () => {
      const scrollHeight = document.documentElement.scrollHeight;
      const viewportHeight = window.innerHeight;
      const scrollTop = (scrollPercent / 100) * (scrollHeight - viewportHeight);
      window.scrollTo({
        top: Math.max(0, scrollTop),
        behavior: "auto",
      });
    };

    const firstFrame = window.requestAnimationFrame(() => {
      restore();
    });
    const secondFrame = window.requestAnimationFrame(() => {
      window.setTimeout(restore, 50);
    });

    return () => {
      window.cancelAnimationFrame(firstFrame);
      window.cancelAnimationFrame(secondFrame);
    };
  }, [scrollPercent]);

  return null;
}
