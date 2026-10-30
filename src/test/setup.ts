/**
 * Vitest global test setup.
 * Imports @testing-library/jest-dom matchers so they are available in all test files.
 */
import "@testing-library/jest-dom/vitest";

if (typeof window !== "undefined") {
  if (!window.requestAnimationFrame) {
    window.requestAnimationFrame = (callback: FrameRequestCallback) =>
      window.setTimeout(() => callback(Date.now()), 0);
  }

  if (!window.cancelAnimationFrame) {
    window.cancelAnimationFrame = (id: number) => window.clearTimeout(id);
  }

  if (!window.scrollTo) {
    Object.defineProperty(window, "scrollTo", {
      configurable: true,
      value: () => undefined,
    });
  }
}
