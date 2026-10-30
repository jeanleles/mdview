import { describe, it, expect } from "vitest";
import { getNavButtonState } from "../navigation";

const FILES = ["a.md", "b.md", "c.md"];

describe("getNavButtonState", () => {
  // --- Normal positions ---
  it("disables prev and enables next when at the first file", () => {
    expect(getNavButtonState(FILES, 0)).toEqual({
      prevEnabled: false,
      nextEnabled: true,
    });
  });

  it("enables both buttons when in the middle of the list", () => {
    expect(getNavButtonState(FILES, 1)).toEqual({
      prevEnabled: true,
      nextEnabled: true,
    });
  });

  it("enables prev and disables next when at the last file", () => {
    expect(getNavButtonState(FILES, 2)).toEqual({
      prevEnabled: true,
      nextEnabled: false,
    });
  });

  // --- Single-file list ---
  it("disables both buttons when list has only one file", () => {
    expect(getNavButtonState(["only.md"], 0)).toEqual({
      prevEnabled: false,
      nextEnabled: false,
    });
  });

  // --- Edge cases ---
  it("disables both buttons when the file list is empty", () => {
    expect(getNavButtonState([], 0)).toEqual({
      prevEnabled: false,
      nextEnabled: false,
    });
  });

  it("disables both buttons when index is negative (out of bounds)", () => {
    expect(getNavButtonState(FILES, -1)).toEqual({
      prevEnabled: false,
      nextEnabled: false,
    });
  });

  it("disables both buttons when index equals files.length (out of bounds)", () => {
    expect(getNavButtonState(FILES, FILES.length)).toEqual({
      prevEnabled: false,
      nextEnabled: false,
    });
  });

  it("disables both buttons when index is far out of bounds", () => {
    expect(getNavButtonState(FILES, 999)).toEqual({
      prevEnabled: false,
      nextEnabled: false,
    });
  });

  // --- Two-file list ---
  it("handles a two-file list correctly at index 0", () => {
    expect(getNavButtonState(["a.md", "b.md"], 0)).toEqual({
      prevEnabled: false,
      nextEnabled: true,
    });
  });

  it("handles a two-file list correctly at index 1", () => {
    expect(getNavButtonState(["a.md", "b.md"], 1)).toEqual({
      prevEnabled: true,
      nextEnabled: false,
    });
  });
});
