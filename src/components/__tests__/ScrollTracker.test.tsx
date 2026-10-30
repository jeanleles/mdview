import { fireEvent, render } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import ScrollTracker from "../ScrollTracker";

describe("ScrollTracker", () => {
  afterEach(() => {
    vi.useRealTimers();
    vi.restoreAllMocks();
  });

  it("updates progress and posts once after the scroll debounce", () => {
    vi.useFakeTimers();
    const fetchMock = vi.fn().mockResolvedValue({ ok: true });
    vi.stubGlobal("fetch", fetchMock);

    Object.defineProperty(document.documentElement, "scrollHeight", {
      configurable: true,
      value: 1000,
    });
    Object.defineProperty(window, "innerHeight", {
      configurable: true,
      value: 400,
    });
    Object.defineProperty(window, "scrollY", {
      configurable: true,
      value: 300,
    });

    render(
      <ScrollTracker
        fileId="file-a"
        fileName="Apostila A.md"
        initialPercent={0}
      />
    );

    fireEvent.scroll(window);
    vi.advanceTimersByTime(2000);

    expect(fetchMock).toHaveBeenCalledWith(
      "/api/bookmarks",
      expect.objectContaining({
        method: "POST",
        body: JSON.stringify({
          fileId: "file-a",
          fileName: "Apostila A.md",
          scrollPercent: 50,
        }),
      })
    );
  });

  it("does not post while scrolling data is unchanged", () => {
    vi.useFakeTimers();
    const fetchMock = vi.fn().mockResolvedValue({ ok: true });
    vi.stubGlobal("fetch", fetchMock);

    render(
      <ScrollTracker
        fileId="file-a"
        fileName="Apostila A.md"
        initialPercent={50}
      />
    );

    expect(fetchMock).toHaveBeenCalledTimes(1);
    vi.advanceTimersByTime(30000);
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });
});
