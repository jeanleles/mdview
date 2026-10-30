/**
 * Property-based tests for getNavButtonState.
 *
 * // Feature: mdview, Property 7: Botões de navegação refletem posição na lista
 *
 * Strategy:
 *  - `getNavButtonState` is a pure function — no env vars, no database, no mocks needed.
 *  - Generate non-empty file lists (`minLength: 1`) and arbitrary natural-number indices.
 *  - Normalize the raw index into a valid in-bounds index using `rawIndex % files.length`
 *    to guarantee we always test valid positions.
 *  - Verify the exact boolean contract for prevEnabled and nextEnabled.
 *  - Cover additional specific invariants (first index, last index, single-element list).
 *
 * Validates: Requirements 6.4, 6.5
 */

import { describe, it, expect } from "vitest";
import * as fc from "fast-check";
import { getBookmarkProgress, getNavButtonState } from "../navigation";

describe("getNavButtonState property tests", () => {
  it(
    // Feature: mdview, Property 6: Progresso persistido é exibido corretamente
    "Property 6 — persisted progress is returned by file and missing files return zero",
    () => {
      fc.assert(
        fc.property(
          fc.string({ minLength: 1 }),
          fc.array(fc.string({ minLength: 1 }), { maxLength: 20 }),
          fc.integer({ min: 0, max: 100 }),
          (fileId, otherFileIds, scrollPercent) => {
            const bookmarks = [
              ...otherFileIds.map((otherId) => ({
                fileId: otherId,
                scrollPercent: 100,
              })),
              { fileId, scrollPercent },
            ];

            expect(getBookmarkProgress(fileId, bookmarks)).toBe(scrollPercent);
            expect(getBookmarkProgress("missing-file-id", bookmarks)).toBe(0);
          }
        ),
        { numRuns: 100 }
      );
    }
  );
  // ---------------------------------------------------------------------------
  // Property 7: Botões de navegação refletem posição na lista
  //
  // For any non-empty file list and any valid index, prevEnabled must be true
  // iff the index is greater than 0, and nextEnabled must be true iff the index
  // is less than the last index of the list.
  // ---------------------------------------------------------------------------
  it(
    // Feature: mdview, Property 7: Botões de navegação refletem posição na lista
    "Property 7 — prevEnabled and nextEnabled reflect the current position in the list",
    () => {
      fc.assert(
        fc.property(
          fc.array(fc.string(), { minLength: 1 }), // lista de arquivos (não-vazia)
          fc.nat(),                                 // índice corrente (inteiro ≥ 0)
          (files, rawIndex) => {
            const currentIndex = rawIndex % files.length;
            const { prevEnabled, nextEnabled } = getNavButtonState(
              files,
              currentIndex
            );

            expect(prevEnabled).toBe(currentIndex > 0);
            expect(nextEnabled).toBe(currentIndex < files.length - 1);
          }
        ),
        { numRuns: 100 }
      );
    }
  );

  // ---------------------------------------------------------------------------
  // Property 7a: First index always has prevEnabled = false
  //
  // For any non-empty list, index 0 must always disable the Previous button.
  // ---------------------------------------------------------------------------
  it(
    // Feature: mdview, Property 7: Botões de navegação refletem posição na lista
    "Property 7a — prevEnabled is always false at index 0",
    () => {
      fc.assert(
        fc.property(
          fc.array(fc.string(), { minLength: 1 }),
          (files) => {
            const { prevEnabled } = getNavButtonState(files, 0);
            expect(prevEnabled).toBe(false);
          }
        ),
        { numRuns: 100 }
      );
    }
  );

  // ---------------------------------------------------------------------------
  // Property 7b: Last index always has nextEnabled = false
  //
  // For any non-empty list, the last index must always disable the Next button.
  // ---------------------------------------------------------------------------
  it(
    // Feature: mdview, Property 7: Botões de navegação refletem posição na lista
    "Property 7b — nextEnabled is always false at the last index",
    () => {
      fc.assert(
        fc.property(
          fc.array(fc.string(), { minLength: 1 }),
          (files) => {
            const lastIndex = files.length - 1;
            const { nextEnabled } = getNavButtonState(files, lastIndex);
            expect(nextEnabled).toBe(false);
          }
        ),
        { numRuns: 100 }
      );
    }
  );

  // ---------------------------------------------------------------------------
  // Property 7c: Single-element list always disables both buttons
  //
  // When the list has exactly one file, both buttons must be disabled regardless
  // of the file's name.
  // ---------------------------------------------------------------------------
  it(
    // Feature: mdview, Property 7: Botões de navegação refletem posição na lista
    "Property 7c — both buttons are disabled for a single-element list",
    () => {
      fc.assert(
        fc.property(
          fc.string(), // nome do único arquivo
          (fileName) => {
            const { prevEnabled, nextEnabled } = getNavButtonState(
              [fileName],
              0
            );
            expect(prevEnabled).toBe(false);
            expect(nextEnabled).toBe(false);
          }
        ),
        { numRuns: 100 }
      );
    }
  );

  // ---------------------------------------------------------------------------
  // Property 7d: Idempotence — calling twice with the same args gives the same result
  // ---------------------------------------------------------------------------
  it(
    // Feature: mdview, Property 7: Botões de navegação refletem posição na lista
    "Property 7d — getNavButtonState is idempotent (same args → same result)",
    () => {
      fc.assert(
        fc.property(
          fc.array(fc.string(), { minLength: 1 }),
          fc.nat(),
          (files, rawIndex) => {
            const currentIndex = rawIndex % files.length;
            const first = getNavButtonState(files, currentIndex);
            const second = getNavButtonState(files, currentIndex);
            expect(second).toEqual(first);
          }
        ),
        { numRuns: 100 }
      );
    }
  );
});
