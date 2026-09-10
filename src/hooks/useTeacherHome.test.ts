import { describe, expect, it } from "vitest";
import { __bandForTest as band } from "./useTeacherHome";

/**
 * The pulse bands.
 *
 * These used to read "Strong", "Steady" and "Building" - words this frontend
 * invented and showed to a teacher as a judgement about their class, on
 * cutoffs nobody had ratified. Design ruled that out on 10 Sep.
 *
 * The property worth pinning is not the wording. It is that the LABEL CANNOT
 * DISAGREE WITH THE THRESHOLD: it is generated from `min`, so no future edit
 * can leave a class at 47% labelled "50 to 75%".
 */

describe("pulse band labels", () => {
  it("describes the top band by its own cutoff", () => {
    expect(band(0.9)).toBe("Above 75%");
    expect(band(0.75)).toBe("Above 75%");
  });

  it("describes the middle band by both of its edges", () => {
    expect(band(0.6)).toBe("50 to 75%");
    expect(band(0.5)).toBe("50 to 75%");
  });

  it("describes the bottom band by the edge above it", () => {
    expect(band(0.49)).toBe("Below 50%");
    expect(band(0)).toBe("Below 50%");
  });

  it("says nothing at all when there is no metric", () => {
    // "Not enough yet" is different from a low score and must never read as
    // one. Null stays null rather than falling into the bottom band.
    expect(band(null)).toBeNull();
    expect(band(Number.NaN)).toBeNull();
  });

  it("uses no judgement word anywhere", () => {
    // The whole point of the change. A cutoff we invented must not be dressed
    // up as an opinion about a teacher's class.
    for (const v of [0, 0.3, 0.5, 0.74, 0.75, 1]) {
      expect(band(v)).not.toMatch(/strong|steady|building|weak|poor|good/i);
    }
  });

  it("clamps rather than inventing a band for an out-of-range value", () => {
    expect(band(1.4)).toBe("Above 75%");
    expect(band(-0.2)).toBe("Below 50%");
  });
});
