import { describe, expect, it } from "vitest";
import { groupByLesson } from "./useClassLessons";
import type { Assignment } from "@/lib/api/assignments";

/**
 * Grouping the class's assignments into lessons.
 *
 * `GET /api/v1/assignments?classId=` returns ONE ROW PER STUDENT: `studentId` is
 * required on `AssignmentResponse` and `classId` is nullable. A lesson set for a
 * class of 28 comes back as 28 rows, so rendering the response raw would show a
 * teacher the same lesson twenty-eight times.
 */

const NOW = Date.parse("2026-09-16T12:00:00Z");

const row = (over: Partial<Assignment> = {}): Assignment =>
  ({
    id: "a-1",
    lesson: { id: "l-1", title: "Fractions 3" },
    studentId: "s-1",
    classId: "c-1",
    status: "assigned",
    availableFrom: null,
    dueAt: null,
    note: null,
    assignedAt: "2026-09-10T09:00:00Z",
    ...over,
  }) as unknown as Assignment;

describe("grouping", () => {
  it("shows one lesson set for a whole class once, not once per child", () => {
    const rows = ["s-1", "s-2", "s-3"].map((studentId, i) =>
      row({ id: `a-${i}`, studentId }),
    );

    const out = groupByLesson(rows, NOW);

    expect(out).toHaveLength(1);
    expect(out[0].title).toBe("Fractions 3");
    expect(out[0].studentCount).toBe(3);
  });

  it("counts a child once even if they hold the lesson twice", () => {
    // Re-assigning the same lesson to the same child is a second row, not a
    // second student.
    const rows = [row({ id: "a-1" }), row({ id: "a-2" })];

    expect(groupByLesson(rows, NOW)[0].studentCount).toBe(1);
  });

  it("keeps separate lessons separate, newest first", () => {
    const out = groupByLesson(
      [
        row({ lesson: { id: "l-1", title: "Older" } as never, assignedAt: "2026-09-01T09:00:00Z" }),
        row({ lesson: { id: "l-2", title: "Newer" } as never, assignedAt: "2026-09-14T09:00:00Z" }),
      ],
      NOW,
    );

    expect(out.map((l) => l.title)).toEqual(["Newer", "Older"]);
  });
});

describe("cancellation", () => {
  it("does not call a lesson off while any child still has it", () => {
    // The case that matters: a teacher called it off for one child. Reporting
    // "cancelled" would tell them something untrue about the other two.
    const out = groupByLesson(
      [
        row({ studentId: "s-1", status: "cancelled" }),
        row({ studentId: "s-2" }),
        row({ studentId: "s-3" }),
      ],
      NOW,
    );

    expect(out[0].cancelled).toBe(false);
    // ...and the count is the children who still have it, not all three.
    expect(out[0].studentCount).toBe(2);
  });

  it("calls a lesson off only when every child's row is cancelled", () => {
    const out = groupByLesson(
      [
        row({ studentId: "s-1", status: "cancelled" }),
        row({ studentId: "s-2", status: "cancelled" }),
      ],
      NOW,
    );

    expect(out[0].cancelled).toBe(true);
    expect(out[0].studentCount).toBe(0);
  });
});

describe("lessons that have not opened yet", () => {
  it("marks one that opens later for everyone", () => {
    const out = groupByLesson(
      [
        row({ studentId: "s-1", availableFrom: "2026-09-20T08:00:00Z" }),
        row({ studentId: "s-2", availableFrom: "2026-09-20T08:00:00Z" }),
      ],
      NOW,
    );

    expect(out[0].opensAt).toBe("2026-09-20T08:00:00Z");
  });

  it("says nothing when it is already open", () => {
    const out = groupByLesson(
      [row({ availableFrom: "2026-09-01T08:00:00Z" })],
      NOW,
    );

    expect(out[0].opensAt).toBeNull();
  });

  it("says nothing when children have different opening times", () => {
    // A single date for a lesson opening at different times for different
    // children would be a claim the data does not support.
    const out = groupByLesson(
      [
        row({ studentId: "s-1", availableFrom: "2026-09-20T08:00:00Z" }),
        row({ studentId: "s-2", availableFrom: "2026-09-25T08:00:00Z" }),
      ],
      NOW,
    );

    expect(out[0].opensAt).toBeNull();
  });

  it("says nothing when only some children have an opening time", () => {
    const out = groupByLesson(
      [
        row({ studentId: "s-1", availableFrom: "2026-09-20T08:00:00Z" }),
        row({ studentId: "s-2", availableFrom: null }),
      ],
      NOW,
    );

    expect(out[0].opensAt).toBeNull();
  });
});

describe("rows the response should not contain but might", () => {
  it("drops a row carrying no lesson rather than rendering an empty card", () => {
    const out = groupByLesson(
      [row(), row({ lesson: undefined as never, studentId: "s-9" })],
      NOW,
    );

    expect(out).toHaveLength(1);
  });

  it("returns nothing for an empty response", () => {
    expect(groupByLesson([], NOW)).toEqual([]);
  });
});
