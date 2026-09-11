import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
  clearProgress,
  flushPendingProgress,
  holdProgress,
  pendingProgressFor,
} from "./pendingProgress";
import { lessonsApi } from "@/lib/api/lessons";
import { ApiError } from "@/lib/api/client";
import { clearSession, setSession } from "@/lib/auth/session";

/**
 * The promise outlived the mechanism.
 *
 * `useLessonProgress` holds the newest failed write and re-sends it on
 * `online`, which is correct for exactly as long as the player stays mounted.
 * It held it in a REF and registered the listener in the same hook - so both
 * died on unmount.
 *
 * That is the one moment it was guaranteed to be needed. A child offline
 * mid-lesson sees a banner promising we will save where they got to; they tap
 * X, and a dialog headed "Your progress is saved" offers "Leave for now".
 * Taking it fires one more doomed write and routes away on the next line,
 * unmounting the hook and dropping the buffer. When the connection came back
 * there was nothing left to send, and the child re-read what they had done.
 *
 * So these tests are about outliving the player, and about not retrying
 * something the server has already refused.
 */

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
  vi.restoreAllMocks();
});

afterEach(() => {
  window.localStorage.clear();
  clearSession();
});

const held = { sessionId: "sess-1", status: "exited" as never, segment: 3 };

describe("progress that could not be saved", () => {
  it("outlives the player that captured it", () => {
    holdProgress("lesson-1", held);

    // A ref would be gone by now; this is the whole point.
    expect(pendingProgressFor("lesson-1")?.segment).toBe(3);
  });

  it("is sent when a student screen opens again", async () => {
    const save = vi
      .spyOn(lessonsApi, "saveProgress")
      .mockResolvedValue({} as never);
    signIn();
    holdProgress("lesson-1", held);

    await flushPendingProgress();

    expect(save).toHaveBeenCalledWith("lesson-1", {
      sessionId: "sess-1",
      status: "exited",
      segmentPosition: 3,
    });
    expect(pendingProgressFor("lesson-1")).toBeNull();
  });

  it("is sent for a lesson the child never opens again", async () => {
    // A child who gave up offline may never return to that lesson, but their
    // position still belongs on Home's "Pick back up" card.
    const save = vi
      .spyOn(lessonsApi, "saveProgress")
      .mockResolvedValue({} as never);
    signIn();
    holdProgress("lesson-a", held);
    holdProgress("lesson-b", { ...held, sessionId: "sess-2", segment: 7 });

    await flushPendingProgress();

    expect(save).toHaveBeenCalledTimes(2);
    expect(pendingProgressFor("lesson-a")).toBeNull();
    expect(pendingProgressFor("lesson-b")).toBeNull();
  });

  it("is kept when the network is still down", async () => {
    vi.spyOn(lessonsApi, "saveProgress").mockRejectedValue(
      new ApiError(0, "offline"),
    );
    signIn();
    holdProgress("lesson-1", held);

    await flushPendingProgress();

    expect(pendingProgressFor("lesson-1")?.segment).toBe(3);
  });

  it("is dropped when the server refuses it, rather than retried for ever", async () => {
    // A session id the server will never accept again would otherwise be
    // resent on every mount, for ever.
    vi.spyOn(lessonsApi, "saveProgress").mockRejectedValue(
      new ApiError(404, "gone"),
    );
    signIn();
    holdProgress("lesson-1", held);

    await flushPendingProgress();

    expect(pendingProgressFor("lesson-1")).toBeNull();
  });

  it("sends nothing when nobody is signed in", async () => {
    const save = vi
      .spyOn(lessonsApi, "saveProgress")
      .mockResolvedValue({} as never);
    holdProgress("lesson-1", held);

    await flushPendingProgress();

    expect(save).not.toHaveBeenCalled();
    expect(pendingProgressFor("lesson-1")).not.toBeNull();
  });

  it("keeps only the newest position for a lesson", () => {
    holdProgress("lesson-1", held);
    holdProgress("lesson-1", { ...held, segment: 9 });

    expect(pendingProgressFor("lesson-1")?.segment).toBe(9);
  });

  it("forgets a position from another week", async () => {
    signIn();
    const save = vi
      .spyOn(lessonsApi, "saveProgress")
      .mockResolvedValue({} as never);
    holdProgress("lesson-1", held);
    const raw = JSON.parse(
      window.localStorage.getItem("nevo.lesson.pendingProgress") ?? "{}",
    );
    raw["lesson-1"].heldAt = Date.now() - 8 * 24 * 60 * 60 * 1000;
    window.localStorage.setItem(
      "nevo.lesson.pendingProgress",
      JSON.stringify(raw),
    );

    await flushPendingProgress();

    expect(save).not.toHaveBeenCalled();
    expect(pendingProgressFor("lesson-1")).toBeNull();
  });

  it("clears cleanly", () => {
    holdProgress("lesson-1", held);
    clearProgress("lesson-1");
    expect(pendingProgressFor("lesson-1")).toBeNull();
  });
});
