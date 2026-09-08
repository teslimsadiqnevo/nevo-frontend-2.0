import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { cleanup, renderHook } from "@testing-library/react";
import { useNextLessonHref } from "./useNextLessonHref";
import { clearSession, setSession } from "@/lib/auth/session";
import { FIRST_LESSON_ID } from "@/lib/mocks";

/**
 * The defect this pins: a signed-in child was handed the mock photosynthesis
 * lesson for the whole time their dashboard read was in flight.
 *
 * Both hand-offs read `assigned ? real : dashboard ? "/student/lessons" :
 * FIRST_LESSON_ID`, meaning to say "signed out gets the demo lesson". But
 * `dashboard` is a live read's `data`, and `data === null` covers IN FLIGHT as
 * well as signed out - and one of the two screens fires the instant an account
 * is created, when the read has had no time at all.
 *
 * So the case that matters is the middle one: signed in, data still null. It
 * must not be the mock, and it must not wait.
 */

const dashboard = vi.hoisted(() => ({ useStudentDashboard: vi.fn() }));
vi.mock("./useStudentDashboard", () => dashboard);

const signIn = () =>
  setSession({
    token: "tok-test",
    expiresAt: new Date(Date.now() + 60 * 60 * 1000).toISOString(),
    userId: "student-1",
    role: "student",
  });

const read = (data: unknown, loading = false) =>
  dashboard.useStudentDashboard.mockReturnValue({
    data,
    loading,
    failed: false,
  });

beforeEach(() => {
  dashboard.useStudentDashboard.mockReset();
  clearSession();
});

afterEach(() => {
  cleanup();
  clearSession();
});

describe("useNextLessonHref", () => {
  it("does not send a signed-in child to the demo lesson while the read is in flight", () => {
    signIn();
    read(null, true);

    const { result } = renderHook(() => useNextLessonHref());

    expect(result.current).not.toContain(FIRST_LESSON_ID);
    expect(result.current).toBe("/student/lessons");
  });

  it("does not send a signed-in child to the demo lesson when the read failed", () => {
    signIn();
    read(null);

    const { result } = renderHook(() => useNextLessonHref());

    expect(result.current).not.toContain(FIRST_LESSON_ID);
  });

  it("sends them to the lesson their teacher actually set", () => {
    signIn();
    read({
      assignments: [
        { status: "completed", lesson: { id: "done-1" } },
        { status: "assigned", lesson: { id: "real-lesson" } },
      ],
      recentProgress: [],
    });

    const { result } = renderHook(() => useNextLessonHref());

    expect(result.current).toBe("/student/lessons/real-lesson");
  });

  it("sends a signed-in child with nothing set to their lessons list", () => {
    signIn();
    read({ assignments: [], recentProgress: [] });

    const { result } = renderHook(() => useNextLessonHref());

    expect(result.current).toBe("/student/lessons");
  });

  it("keeps the demo lesson for the signed-out walkthrough", () => {
    // Onboarding IS the designed walkthrough when nobody is signed in, and the
    // demo lesson is the point of it - so this one is deliberate, not a leak.
    read(null);

    const { result } = renderHook(() => useNextLessonHref());

    expect(result.current).toBe(`/student/lessons/${FIRST_LESSON_ID}`);
  });
});
