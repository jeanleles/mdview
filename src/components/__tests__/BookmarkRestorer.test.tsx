import { act, render } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import BookmarkRestorer from "../BookmarkRestorer";

describe("BookmarkRestorer", () => {
  it("restores the percentage within the document scroll range", () => {
    vi.useFakeTimers();
    const scrollTo = vi.fn();
    Object.defineProperty(window, "scrollTo", { configurable: true, value: scrollTo });
    Object.defineProperty(document.documentElement, "scrollHeight", {
      configurable: true,
      value: 1000,
    });
    Object.defineProperty(window, "innerHeight", {
      configurable: true,
      value: 400,
    });

    render(<BookmarkRestorer scrollPercent={50} />);

    act(() => {
      vi.runAllTimers();
    });

    expect(scrollTo).toHaveBeenCalled();
    expect(scrollTo.mock.calls.some((call) => call[0].top === 300)).toBe(true);
  });
});
