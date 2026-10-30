/**
 * Determines the enabled/disabled state of Previous and Next navigation buttons
 * based on the current file's position in the file list.
 *
 * - prevEnabled: true when the current file is not the first in the list
 * - nextEnabled: true when the current file is not the last in the list
 *
 * Edge cases:
 * - Empty array → both buttons disabled
 * - Index out of bounds (< 0 or >= files.length) → both buttons disabled
 *
 * @param files - Ordered list of file identifiers
 * @param currentIndex - Zero-based index of the currently displayed file
 * @returns Object with `prevEnabled` and `nextEnabled` booleans
 */
export function getNavButtonState(
  files: string[],
  currentIndex: number
): { prevEnabled: boolean; nextEnabled: boolean } {
  const inBounds =
    files.length > 0 && currentIndex >= 0 && currentIndex < files.length;

  if (!inBounds) {
    return { prevEnabled: false, nextEnabled: false };
  }

  return {
    prevEnabled: currentIndex > 0,
    nextEnabled: currentIndex < files.length - 1,
  };
}

export interface BookmarkProgressRecord {
  fileId: string;
  scrollPercent: number;
}

export function getBookmarkProgress(
  fileId: string,
  bookmarks: BookmarkProgressRecord[]
): number {
  const bookmark = bookmarks.find((item) => item.fileId === fileId);
  if (!bookmark) return 0;
  return Math.min(100, Math.max(0, Math.floor(bookmark.scrollPercent)));
}
