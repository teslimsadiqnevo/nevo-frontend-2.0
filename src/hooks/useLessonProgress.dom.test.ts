import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { cleanup, renderHook, waitFor, act } from "@testing-library/react";
import { useLessonProgress } from "./useLessonProgress";
import { lessonsApi } from "@/lib/api/lessons";
import { ApiError } from "@/lib/api/client";
import { pendingProgressFor } from "@/lib/lessons/pendingProgress";
import { clearSession, setSession } from "@/lib/auth/session";

/**
 * The wiring, not the store.
 *
 * `pendingProgress` has its own tests, but a correct store nobody writes to is
 * worth nothing - and that is exactly what a mutation run showed: removing the
 * `holdProgress` call from this hook, which restores the original bug outright,
 * left every store test passing.
 *
 * The bug: a failed write was held only in a REF, and the `online` listener
 * that would have re-sent it lived in the same hook. "Leave for now" - the
 * button under the words "Your progress is saved" - fires one more doomed write
 * and routes away on the next line, unmounting both. So the position was lost
 * at the one moment the UI had just promised it was safe.
 */

const LESSON = "lesson-1";

const signIn = () =>
  setSession({
    token: "tok-test",
    expiresAt: new Date(Date.now() + 60 * 60 * 1000).toISOString(),
    userId: "student-1",
    role: "student",
  });

beforeEach(() => {
  window.localStorage.clear();
  clearSession();
  signIn();
  vi.spyOn(lessonsApi, "startSession").mockResolvedValue({
    sessionId: "sess-1",
  } as never);
});

afterEach(() => {
  cleanup();
  window.localStorage.clear();
  clearSession();
  vi.restoreAllMocks();
});

describe("useLessonProgress", () => {
  it("holds a failed position somewhere that survives the player closing", async () => {
    vi.spyOn(lessonsApi, "saveProgress").mockRejectedValue(
      new ApiError(0, "offline"),
    );
    const { result, unmount } = renderHook(() =>
      useLessonProgress(LESSON, true),
    );

    await waitFor(() => expect(result.current.sessionId).toBe("sess-1"));
    act(() => result.current.report("exited", { segment: 3 }));
    await waitFor(() => expect(pendingProgressFor(LESSON)).not.toBeNull());

    // The exact sequence "Leave for now" performs.
    unmount();

    expect(pendingProgressFor(LESSON)?.segment).toBe(3);
    expect(pendingProgressFor(LESSON)?.sessionId).toBe("sess-1");
  });

  it("owes nothing once the write lands", async () => {
    vi.spyOn(lessonsApi, "saveProgress").mockResolvedValue({} as never);
    const { result } = renderHook(() => useLessonProgress(LESSON, true));

    await waitFor(() => expect(result.current.sessionId).toBe("sess-1"));
    act(() => result.current.report("in_progress", { segment: 2 }));

    await waitFor(() => expect(pendingProgressFor(LESSON)).toBeNull());
  });

  it("sends what a previous visit could not, when a lesson opens again", async () => {
    // The child came back. Nothing in the UI mentions this; it simply catches up.
    const save = vi
      .spyOn(lessonsApi, "saveProgress")
      .mockResolvedValue({} as never);
    window.localStorage.setItem(
      "nevo.lesson.pendingProgress",
      JSON.stringify({
        [LESSON]: {
          // The owner matters now: an entry with no child attached is skipped
          // rather than sent, which is what stops one child's position landing
          // on the next child to use the tablet.
          userId: "student-1",
          sessionId: "sess-old",
          status: "exited",
          segment: 5,
          heldAt: Date.now(),
        },
      }),
    );

    renderHook(() => useLessonProgress(LESSON, true));

    await waitFor(() =>
      expect(save).toHaveBeenCalledWith(
        LESSON,
        expect.objectContaining({ sessionId: "sess-old", segmentPosition: 5 }),
      ),
    );
  });
});
