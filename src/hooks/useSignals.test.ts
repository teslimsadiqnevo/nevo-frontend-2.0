import { beforeEach, describe, expect, it, vi } from "vitest";
import { act, renderHook } from "@testing-library/react";

/** Typed so `submitBatch.mock.calls` carries a real tuple and needs no casts. */
interface Envelope {
  sessionId: string;
  lessonId: string | null;
  sessionType: string;
  startedAt: string;
}
interface Event {
  type: string;
  timestamp: string;
  payload?: Record<string, unknown>;
}

const submitBatch = vi.fn(
  async (_envelope: Envelope, _events: Event[]) => ({
    session_id: "s",
    accepted_events: _events.length,
  }),
);

vi.mock("@/lib/api", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/lib/api")>();
  return { ...actual, signalsApi: { submitBatch } };
});

const { useSignals } = await import("./useSignals");
const { clearSession, setSession } = await import("@/lib/auth/session");

/**
 * These tests encode a defect that destroyed real data silently.
 *
 * Signal ingest is Bearer-only, and a 4xx batch is DROPPED rather than retried
 * - correctly, since a contract rejection would fail identically every five
 * seconds forever. But onboarding happens BEFORE an account exists, so every
 * pre-auth batch 401'd and was dropped: a child's entire baseline profiling
 * stream, gone, with nothing on screen to show it. Both failure paths ended in
 * silence, which is why nothing surfaced it until the wire was read.
 *
 * The fix holds the queue while unauthenticated and flushes once a session
 * exists. The first two tests are the fix; without them a future refactor
 * "simplifying" the token check would reintroduce the loss invisibly.
 */

const UUID = "fd0cba6c-0828-48e3-8510-c78146a5d449";
const LESSON = "9c1e77aa-1111-4222-8333-444455556666";

const signIn = () =>
  setSession({
    token: "tok-test",
    expiresAt: new Date(Date.now() + 60 * 60 * 1000).toISOString(),
    userId: "user-1",
    role: "student",
  });

beforeEach(() => {
  submitBatch.mockClear();
  clearSession();
});

describe("useSignals", () => {
  it("does not send while signed out - and does not lose the events either", async () => {
    const { result } = renderHook(() =>
      useSignals(UUID, undefined, "onboarding"),
    );

    await act(async () => {
      result.current.trackEvent("time_on_segment", { phase: "pre-auth" });
      result.current.flush();
    });

    // Nothing sent: a 401 batch would be dropped, taking the events with it.
    expect(submitBatch).not.toHaveBeenCalled();

    // ...and the events are still held, so signing in delivers them.
    signIn();
    await act(async () => {
      result.current.flush();
    });
    expect(submitBatch).toHaveBeenCalledTimes(1);
    // The batch carries a device-context event alongside the tracked one, so
    // the assertion is that the PRE-AUTH event survived the wait - not a count.
    const [, events] = submitBatch.mock.calls[0];
    expect(events.some((e) => e.payload?.phase === "pre-auth")).toBe(true);
  });

  it("labels a non-lesson stream and sends no lesson id for it", async () => {
    signIn();
    const { result } = renderHook(() =>
      useSignals(UUID, undefined, "onboarding"),
    );

    await act(async () => {
      result.current.trackEvent("time_on_segment", {});
      result.current.flush();
    });

    const [envelope] = submitBatch.mock.calls[0];
    expect(envelope.sessionType).toBe("onboarding");
    // `lessonId` is nullable now; onboarding is not a lesson and must not
    // borrow an id to satisfy a required field, as it once did.
    expect(envelope.lessonId).toBeNull();
    expect(envelope.sessionId).toBe(UUID);
  });

  it("sends the lesson id for a lesson stream", async () => {
    signIn();
    const { result } = renderHook(() => useSignals(UUID, LESSON, "lesson"));

    await act(async () => {
      result.current.trackEvent("time_on_segment", {});
      result.current.flush();
    });

    const [envelope] = submitBatch.mock.calls[0];
    expect(envelope.sessionType).toBe("lesson");
    expect(envelope.lessonId).toBe(LESSON);
  });

  it("holds a lesson stream that has no lesson id yet", async () => {
    signIn();
    // A lesson session id arrives asynchronously. Sending before it lands
    // would post a batch the validator refuses, so the events wait.
    const { result } = renderHook(() => useSignals(UUID, undefined, "lesson"));

    await act(async () => {
      result.current.trackEvent("time_on_segment", {});
      result.current.flush();
    });
    expect(submitBatch).not.toHaveBeenCalled();
  });

  it("sends nothing when there is nothing to send", async () => {
    signIn();
    const { result } = renderHook(() => useSignals(UUID, LESSON, "lesson"));
    await act(async () => {
      result.current.flush();
    });
    expect(submitBatch).not.toHaveBeenCalled();
  });
});
