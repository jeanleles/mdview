/**
 * Property-based tests for calcProgress.
 *
 * // Feature: mdview, Property 1: Progresso de scroll é idempotente e limitado
 *
 * Strategy:
 *  - `calcProgress` is a pure function — no env vars, no database, no mocks needed.
 *  - Use `fc.integer` with appropriate bounds and `fc.pre` to constrain the input
 *    to the valid domain (`scrollHeight > viewportHeight`).
 *  - Verify structural invariants: result is an integer in [0, 100] and the
 *    function is idempotent (calling twice with the same arguments returns the
 *    same value).
 *
 * Validates: Requirements 5.1
 */

import { describe, it } from "vitest";
import * as fc from "fast-check";
import { calcProgress } from "@/lib/progress";

describe("calcProgress property tests", () => {
  // -------------------------------------------------------------------------
  // Property 1a: Result is always an integer in [0, 100] when scrollHeight > viewportHeight
  // -------------------------------------------------------------------------
  it(
    // Feature: mdview, Property 1: Progresso de scroll é idempotente e limitado
    "Property 1a — result is an integer in [0, 100] for any valid scroll state",
    () => {
      fc.assert(
        fc.property(
          fc.integer({ min: 0 }),   // scrollTop
          fc.integer({ min: 1 }),   // scrollHeight
          fc.integer({ min: 0 }),   // viewportHeight
          (scrollTop, scrollHeight, viewportHeight) => {
            fc.pre(scrollHeight > viewportHeight);

            const result = calcProgress(scrollTop, scrollHeight, viewportHeight);

            return (
              Number.isInteger(result) &&
              result >= 0 &&
              result <= 100
            );
          }
        ),
        { numRuns: 100 }
      );
    }
  );

  // -------------------------------------------------------------------------
  // Property 1b: Function is idempotent — calling twice produces the same result
  // -------------------------------------------------------------------------
  it(
    // Feature: mdview, Property 1: Progresso de scroll é idempotente e limitado
    "Property 1b — calcProgress is idempotent: same arguments always return the same value",
    () => {
      fc.assert(
        fc.property(
          fc.integer({ min: 0 }),   // scrollTop
          fc.integer({ min: 1 }),   // scrollHeight
          fc.integer({ min: 0 }),   // viewportHeight
          (scrollTop, scrollHeight, viewportHeight) => {
            fc.pre(scrollHeight > viewportHeight);

            const first = calcProgress(scrollTop, scrollHeight, viewportHeight);
            const second = calcProgress(scrollTop, scrollHeight, viewportHeight);

            return first === second;
          }
        ),
        { numRuns: 100 }
      );
    }
  );

  // -------------------------------------------------------------------------
  // Property 1c: When scrollTop = 0, result is always 0
  // -------------------------------------------------------------------------
  it(
    // Feature: mdview, Property 1: Progresso de scroll é idempotente e limitado
    "Property 1c — when scrollTop is 0, result is always 0",
    () => {
      fc.assert(
        fc.property(
          fc.integer({ min: 1 }),   // scrollHeight
          fc.integer({ min: 0 }),   // viewportHeight
          (scrollHeight, viewportHeight) => {
            fc.pre(scrollHeight > viewportHeight);

            const result = calcProgress(0, scrollHeight, viewportHeight);

            return result === 0;
          }
        ),
        { numRuns: 100 }
      );
    }
  );

  // -------------------------------------------------------------------------
  // Property 1d: When scrollTop >= scrollHeight - viewportHeight, result is 100
  // -------------------------------------------------------------------------
  it(
    // Feature: mdview, Property 1: Progresso de scroll é idempotente e limitado
    "Property 1d — when scrollTop reaches or exceeds the scrollable range, result is 100",
    () => {
      fc.assert(
        fc.property(
          fc.integer({ min: 1 }),   // scrollHeight
          fc.integer({ min: 0 }),   // viewportHeight
          fc.integer({ min: 0 }),   // extra scroll beyond the bottom
          (scrollHeight, viewportHeight, extra) => {
            fc.pre(scrollHeight > viewportHeight);

            const scrollable = scrollHeight - viewportHeight;
            const scrollTop = scrollable + extra; // at or past the bottom

            const result = calcProgress(scrollTop, scrollHeight, viewportHeight);

            return result === 100;
          }
        ),
        { numRuns: 100 }
      );
    }
  );
});
