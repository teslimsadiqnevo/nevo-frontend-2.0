import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { act, renderHook, waitFor } from "@testing-library/react";
import { useAccommodations } from "./useAccommodations";
import { ApiError } from "@/lib/api/client";
import { clearSession, setSession } from "@/lib/auth/session";

/**
 * The accommodations a SEND child had been granted never reached them.
 *
 * The engine computes them, the teacher's screen lists them as active support
 * Nevo has turned on, and the player is built to apply them — a spacious body
 * for `reading`, a chunked flow and dimmed chrome for `attention`. Nothing ever
 * fetched them for the child. `AdaptationPlan.accommodations` was undefined for
 * every signed-in learner, and the only plan that ever carried one was the
 * authored mock a signed-OUT visitor sees. The demo had the accommodation; the
 * child it was built for did not.
 *
 * THE DEFAULT IS THE DELICATE PART, and it points the opposite way to
 * `useConsentGate` on purpose:
 *   - There, a failed read must NOT stop a consented child being measured, so
 *     silence means carry on.
 *   - Here, a failed read must NOT invent a provision. An accommodation is a
 *     claim that Nevo is doing something particular for this child, and a
 *     network error is not evidence for it.
 *
 * The 403 case is not hypothetical. Every other caller of this route is a
 * teacher or a SENCo, and the contract carries no scope information at all, so
 * the route may yet turn out to be staff-only. If it is, the child must simply
 * get what they get today — never a crash, and never an accommodation we made
 * up.
 */

const { accommodations } = vi.hoisted(() => ({ accommodations: vi.fn() }));
vi.mock("@/lib/api/students", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/lib/api/students")>();
  return { ...actual, studentsApi: { ...actual.studentsApi, accommodations } };
});

const answer = (active: string[]) => ({
  studentId: "student-1",
  activeAccommodations: active,
  frontendSignals: [],
  signals: [],
  source: "engine",
  persistedAsLabel: false,
});

const signIn = () =>
  setSession({
    token: "tok",
    expiresAt: new Date(Date.now() + 60 * 60 * 1000).toISOString(),
    userId: "student-1",
    role: "student",
  });

/** Let a rejection and its setState settle before asking what was decided. */
const settle = async () => {
  await act(async () => {
    await Promise.resolve();
    await Promise.resolve();
  });
};

beforeEach(() => {
  accommodations.mockReset();
  clearSession();
  window.localStorage.clear();
});

afterEach(() => {
  clearSession();
  window.localStorage.clear();
});

describe("useAccommodations", () => {
  it("turns on the accommodation the engine says is active", async () => {
    // The defect in one line: this is what the teacher is already being shown.
    signIn();
    accommodations.mockResolvedValue(answer(["reading"]));

    const { result } = renderHook(() => useAccommodations());

    await waitFor(() => expect(result.current).not.toBeNull());
    expect(result.current?.reading).toBe(true);
  });

  it("asks for the signed-in child, not for somebody else", async () => {
    // The route takes a student id in the path. Reading another child's
    // accommodations would be a data leak, and reading nobody's is a 404.
    signIn();
    accommodations.mockResolvedValue(answer([]));

    renderHook(() => useAccommodations());

    await waitFor(() =>
      expect(accommodations).toHaveBeenCalledWith("student-1"),
    );
  });

  it("leaves the ones it was not told about off", async () => {
    /*
     * Without this a test that only ever checked the granted one would pass
     * against a hook that turned everything on.
     */
    signIn();
    accommodations.mockResolvedValue(answer(["attention"]));

    const { result } = renderHook(() => useAccommodations());

    await waitFor(() => expect(result.current).not.toBeNull());
    expect(result.current?.attention).toBe(true);
    expect(result.current?.reading).toBe(false);
    expect(result.current?.numerical).toBe(false);
  });

  it("carries more than one at a time", async () => {
    signIn();
    accommodations.mockResolvedValue(answer(["reading", "attention"]));

    const { result } = renderHook(() => useAccommodations());

    await waitFor(() => expect(result.current).not.toBeNull());
    expect(result.current?.reading).toBe(true);
    expect(result.current?.attention).toBe(true);
  });

  it("does not invent an accommodation when the read fails", async () => {
    // A network error is not evidence that a child was granted anything.
    signIn();
    accommodations.mockRejectedValue(new ApiError(0, "Network"));

    const { result } = renderHook(() => useAccommodations());

    await waitFor(() => expect(accommodations).toHaveBeenCalled());
    await settle();

    expect(result.current).toBeNull();
  });

  it("survives the route turning out to be staff-only", async () => {
    /*
     * A 403 here is a scope refusal, not a dead session — only a 401 reaches
     * `handleAuthFailure`. So this must degrade to today's behaviour and must
     * not take the child's lesson down with it.
     */
    signIn();
    accommodations.mockRejectedValue(new ApiError(403, "Forbidden"));

    const { result } = renderHook(() => useAccommodations());

    await waitFor(() => expect(accommodations).toHaveBeenCalled());
    await settle();

    expect(result.current).toBeNull();
  });

  it("does not ask on behalf of a signed-out visitor", async () => {
    // The walkthrough has no child to hold an accommodation, and the route is
    // Bearer-only — asking would be a guaranteed 401 on every lesson open.
    renderHook(() => useAccommodations());

    await new Promise((r) => setTimeout(r, 20));
    expect(accommodations).not.toHaveBeenCalled();
  });
});
