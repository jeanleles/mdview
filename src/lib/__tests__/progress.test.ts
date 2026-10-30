import { describe, it, expect } from "vitest";
import { calcProgress } from "../progress";

describe("calcProgress", () => {
  // --- Normal usage ---
  it("returns 0 when at the top of a scrollable page", () => {
    expect(calcProgress(0, 1000, 500)).toBe(0);
  });

  it("returns 50 when halfway through a scrollable page", () => {
    expect(calcProgress(250, 1000, 500)).toBe(50);
  });

  it("returns 100 when at the bottom of a scrollable page", () => {
    expect(calcProgress(500, 1000, 500)).toBe(100);
  });

  it("floors the result to an integer", () => {
    // scrollTop=1, scrollHeight=1000, viewportHeight=500 → 1/500*100 = 0.2 → floor → 0
    expect(calcProgress(1, 1000, 500)).toBe(0);
  });

  it("clamps values above 100 to 100", () => {
    // scrollTop beyond the theoretical max
    expect(calcProgress(9999, 1000, 500)).toBe(100);
  });

  it("clamps negative scrollTop to 0", () => {
    expect(calcProgress(-10, 1000, 500)).toBe(0);
  });

  // --- Division-by-zero guard ---
  it("returns 0 when scrollHeight equals viewportHeight (no scrollable area)", () => {
    expect(calcProgress(0, 500, 500)).toBe(0);
  });

  it("returns 0 when scrollHeight is less than viewportHeight", () => {
    expect(calcProgress(0, 300, 500)).toBe(0);
  });

  it("returns 0 when scrollHeight is 0", () => {
    expect(calcProgress(0, 0, 500)).toBe(0);
  });

  // --- Boundary values ---
  it("returns 100 when scrollTop equals the scrollable range exactly", () => {
    expect(calcProgress(100, 600, 500)).toBe(100);
  });

  it("returns an integer for fractional intermediate calculations", () => {
    // 1/3 * 100 = 33.33... → floor → 33
    const result = calcProgress(100, 400, 100);
    // scrollable = 300, 100/300*100 = 33.33 → 33
    expect(result).toBe(33);
    expect(Number.isInteger(result)).toBe(true);
  });
});
