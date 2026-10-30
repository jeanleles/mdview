/**
 * Smoke test — verifies the Vitest + jsdom + jest-dom setup works end-to-end.
 */
import { describe, it, expect } from "vitest";

describe("vitest setup", () => {
  it("runs a basic assertion", () => {
    expect(1 + 1).toBe(2);
  });

  it("has access to the DOM via jsdom", () => {
    const el = document.createElement("p");
    el.textContent = "hello";
    expect(el.textContent).toBe("hello");
  });
});
