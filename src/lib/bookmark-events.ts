export const BOOKMARK_PROGRESS_EVENT = "mdview:bookmark-progress";

export interface BookmarkProgressDetail {
  fileId: string;
  scrollPercent: number;
}

export function emitBookmarkProgress(detail: BookmarkProgressDetail): void {
  if (typeof window === "undefined") return;
  window.dispatchEvent(
    new CustomEvent<BookmarkProgressDetail>(BOOKMARK_PROGRESS_EVENT, {
      detail,
    })
  );
}
