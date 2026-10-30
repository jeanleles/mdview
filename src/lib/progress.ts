/**
 * Calculates the reading progress as an integer percentage in [0, 100].
 *
 * When the content fits entirely in the viewport (scrollHeight <= viewportHeight),
 * there is no scrollable area, so progress is 0.
 *
 * Formula: Math.min(100, Math.max(0, Math.floor(scrollTop / (scrollHeight - viewportHeight) * 100)))
 *
 * @param scrollTop - Current scroll offset in pixels (≥ 0)
 * @param scrollHeight - Total scrollable height of the content in pixels
 * @param viewportHeight - Height of the visible viewport in pixels
 * @returns Integer progress value in [0, 100]
 */
export function calcProgress(
  scrollTop: number,
  scrollHeight: number,
  viewportHeight: number
): number {
  const scrollable = scrollHeight - viewportHeight;

  // Guard against division by zero when content fits in viewport
  if (scrollable <= 0) {
    return 0;
  }

  return Math.min(100, Math.max(0, Math.floor((scrollTop / scrollable) * 100)));
}
