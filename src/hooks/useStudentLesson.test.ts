import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { cleanup, renderHook, waitFor } from "@testing-library/react";
import { useStudentLesson } from "./useStudentLesson";
import { clearSession, setSession } from "@/lib/auth/session";
import { FIRST_LESSON_ID } from "@/lib/mocks";
import { ApiError } from "@/lib/api/client";

/**
 * The worst thing this hook could do, and did.
 *
 * The two authored lessons are the signed-out walkthrough. But `mock` was read
 * unconditionally and the flags were `failed && !mock`, so a SIGNED-IN child
 * whose lesson 404'd or whose read failed was handed the authored
 * photosynthesis lesson of the same id - a rich, multi-modal lesson that does
 * not exist in their school's library, shown at exactly the moment the backend
 * had failed them. `LessonRoute` wrapped it in `SampleRegion`, which is
 * `display: contents`: readable by a test, invisible to the child, their
 * teacher, or anyone watching a demo over their shoulder.
 *
 * So these tests are about who is allowed to see invented content. A signed-out
 * visitor: yes, that is the designed walkthrough. A signed-in child: never, and
 * least of all when something has gone wrong.
 */

const { detail, modules, dashboard, adaptation } = vi.hoisted(() => ({
  detail: vi.fn(),
  modules: vi.fn(),
  dashboard: vi.fn(),
  adaptation: vi.fn(),
}));

vi.mock("@/lib/api/lessons", async (orig) => ({
  ...(await orig<Record<string, unknown>>()),
  lessonsApi: { detail, modules },
}));
vi.mock("./useStudentDashboard", () => ({ useStudentDashboard: dashboard }));
vi.mock("./useAdaptation", () => ({ useAdaptation: adaptation }));

const signIn = () =>
  setSession({
    token: "tok-test",
    expiresAt: new Date(Date.now() + 60 * 60 * 1000).toISOString(),
    userId: "student-1",
    role: "student",
  });

beforeEach(() => {
  clearSession();
  modules.mockResolvedValue([]);
  dashboard.mockReturnValue({ data: null, loading: false, failed: false });
  adaptation.mockReturnValue({ plan: null });
});

afterEach(() => {
  cleanup();
  clearSession();
  vi.clearAllMocks();
});

describe("useStudentLesson", () => {
  it("does not hand a signed-in child the fixture when their lesson is gone", async () => {
    signIn();
    detail.mockRejectedValue(new ApiError(404, "Not found"));

    const { result } = renderHook(() => useStudentLesson(FIRST_LESSON_ID));

    await waitFor(() => expect(result.current.loading).toBe(false));
    // The id IS one the mock registry holds. That used to be enough to paper
    // over a 404 with photosynthesis.
    expect(result.current.lesson).toBeNull();
    expect(result.current.missing).toBe(true);
  });

  it("does not hand a signed-in child the fixture when the read fails", async () => {
    signIn();
    detail.mockRejectedValue(new ApiError(500, "Server error"));

    const { result } = renderHook(() => useStudentLesson(FIRST_LESSON_ID));

    await waitFor(() => expect(result.current.failed).toBe(true));
    expect(result.current.lesson).toBeNull();
  });

  it("does not lend a signed-in child an authored adaptation plan either", async () => {
    // The authored plan is richer than anything the engine returns, so it would
    // have made the failure look like an unusually good lesson.
    signIn();
    detail.mockRejectedValue(new ApiError(500, "Server error"));

    const { result } = renderHook(() => useStudentLesson(FIRST_LESSON_ID));

    await waitFor(() => expect(result.current.failed).toBe(true));
    expect(result.current.plan).toBeNull();
  });

  it("still gives a signed-out visitor the designed walkthrough", async () => {
    // No session, no read, and the authored lesson is the whole point.
    const { result } = renderHook(() => useStudentLesson(FIRST_LESSON_ID));

    await waitFor(() => expect(result.current.lesson).not.toBeNull());
    expect(result.current.live).toBe(false);
    expect(result.current.failed).toBe(false);
    expect(detail).not.toHaveBeenCalled();
  });

  it("serves a signed-in child their school's lesson when the read works", async () => {
    signIn();
    detail.mockResolvedValue({
      id: FIRST_LESSON_ID,
      title: "Fractions Lesson 3",
      confirmationSummary: null,
      segments: [
        {
          id: "seg-1",
          segmentKey: "s1",
          contentType: "explanatory_text",
          sequenceOrder: 1,
          title: "Numerators",
          body: "The number on top.",
          availableModalities: ["text"],
          comprehensionCheckpoints: [],
          textVariant: null,
          visualVariant: null,
          audioVariant: null,
          interactiveVariant: null,
          calculationVariant: null,
          needsReview: false,
          reviewReasons: [],
        },
      ],
    });

    const { result } = renderHook(() => useStudentLesson(FIRST_LESSON_ID));

    await waitFor(() => expect(result.current.lesson).not.toBeNull());
    expect(result.current.live).toBe(true);
    expect(result.current.lesson?.title).toBe("Fractions Lesson 3");
  });
});
