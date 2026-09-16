import { beforeEach, describe, expect, it, vi } from "vitest";
import { renderHook } from "@testing-library/react";
import { useStudentLessons } from "./useStudentLessons";

/**
 * The child's whole lesson list showed work that was not theirs to do.
 *
 * This hook was a bare `data.assignments.map(...)` with no filter of any kind,
 * so every assignment the dashboard returned became a card: one a teacher had
 * cancelled, one that does not open until Friday, all of them.
 *
 * It matters more here than on Home, because the Lessons tab IS the child's
 * list. Its empty state — "nothing has been assigned yet" — is gated on this
 * array, so a child whose only assignment had been cancelled was never told
 * their list was empty. They were shown the cancelled lesson instead.
 */

const dashboard = vi.hoisted(() => vi.fn());
vi.mock("./useStudentDashboard", () => ({ useStudentDashboard: dashboard }));

const lesson = (id: string) => ({ id, title: `Lesson ${id}`, segmentCount: 4 });

const assignment = (
  id: string,
  over: Partial<{ status: string; availableFrom: string | null }> = {},
) => ({
  id: `a-${id}`,
  status: "assigned",
  availableFrom: null,
  lesson: lesson(id),
  ...over,
});

const read = (assignments: unknown[]) =>
  dashboard.mockReturnValue({
    data: { assignments, recentProgress: [] },
    loading: false,
    failed: false,
  });

const titles = (r: { current: { lessons: { lessonId: string }[] } }) =>
  r.current.lessons.map((l) => l.lessonId);

beforeEach(() => {
  dashboard.mockReset();
});

describe("which lessons reach a child's Lessons tab", () => {
  it("drops one the teacher cancelled", () => {
    // THE DEFECT.
    read([assignment("keep"), assignment("off", { status: "cancelled" })]);

    const { result } = renderHook(() => useStudentLessons());

    expect(titles(result)).toEqual(["keep"]);
  });

  it("drops one that has not opened yet", () => {
    read([
      assignment("keep"),
      assignment("friday", {
        availableFrom: new Date(Date.now() + 86_400_000).toISOString(),
      }),
    ]);

    const { result } = renderHook(() => useStudentLessons());

    expect(titles(result)).toEqual(["keep"]);
  });

  it("keeps one whose opening time has passed", () => {
    read([
      assignment("opened", {
        availableFrom: new Date(Date.now() - 86_400_000).toISOString(),
      }),
    ]);

    const { result } = renderHook(() => useStudentLessons());

    expect(titles(result)).toEqual(["opened"]);
  });

  it("keeps an ordinary assignment with no opening time", () => {
    /*
     * The one that stops a filter from simply emptying the tab. `availableFrom`
     * is nullable and null means there is no opening time — if absence were
     * read as "later", every ordinary lesson would vanish and the child would
     * be told nothing had been assigned.
     */
    read([assignment("plain")]);

    const { result } = renderHook(() => useStudentLessons());

    expect(titles(result)).toEqual(["plain"]);
  });

  it("leaves the list genuinely empty when everything was cancelled", () => {
    // So the tab can honestly say nothing is waiting, which it could not do
    // while the cancelled lesson was still standing in the list.
    read([assignment("off", { status: "cancelled" })]);

    const { result } = renderHook(() => useStudentLessons());

    expect(titles(result)).toEqual([]);
    expect(result.current.live).toBe(true);
  });
});
