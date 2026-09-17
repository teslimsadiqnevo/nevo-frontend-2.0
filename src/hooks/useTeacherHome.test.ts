import { describe, expect, it } from "vitest";
import {
  __bandForTest as band,
  __toActivityForTest as toActivity,
} from "./useTeacherHome";

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

/**
 * The activity mapper, where two delivered fields were being thrown away.
 *
 * `completedCount` and `totalCount` were missing from `ActivityRow`, so the
 * poll dropped them and Home's LIVE activity list showed a title and a date
 * where the SAMPLE list beside it drew a progress bar. Third instance of the
 * pattern - `note` on `Assignment` was the first.
 *
 * TESTED HERE AND NOT ON THE COMPONENT, deliberately. The component test mocks
 * this hook, so the mapper never runs under it: a mutation that deleted the
 * passthrough entirely failed nothing there. This is the only level at which
 * that mutation dies.
 */
describe("the activity mapper", () => {
  const row = (over: Record<string, unknown> = {}) =>
    ({
      id: "a-1",
      activityType: "lesson_completed",
      occurredAt: "2026-09-17T09:00:00Z",
      title: "Fractions 3",
      detail: "JSS 2A",
      classId: "c-1",
      studentId: null,
      lessonId: "l-1",
      actionTarget: "/teacher/lessons/l-1",
      completedCount: 12,
      totalCount: 28,
      ...over,
    }) as Parameters<typeof toActivity>[0];

  it("carries both counts through", () => {
    const out = toActivity(row());

    expect(out.completedCount).toBe(12);
    expect(out.totalCount).toBe(28);
  });

  it("keeps null as null, never as zero", () => {
    // "We were not told" and "none of them" are different facts about a class's
    // week, and defaulting to 0 would state the second on the strength of the
    // first.
    const out = toActivity(row({ completedCount: null, totalCount: null }));

    expect(out.completedCount).toBeNull();
    expect(out.totalCount).toBeNull();
  });

  it("keeps a real zero as zero", () => {
    const out = toActivity(row({ completedCount: 0, totalCount: 28 }));

    expect(out.completedCount).toBe(0);
    expect(out.totalCount).toBe(28);
  });
});
