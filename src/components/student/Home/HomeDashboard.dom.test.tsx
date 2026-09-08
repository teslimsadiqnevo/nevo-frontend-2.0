import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { cleanup, render, waitFor } from "@testing-library/react";
import { HomeDashboard } from "./HomeDashboard";
import { SAMPLE_ATTR } from "@/lib/sampleData";
import { clearSession, setSession } from "@/lib/auth/session";

/**
 * The sample mark has to be right in BOTH directions, and this screen had it
 * backwards.
 *
 * Home builds `cont` and `today` from the live read when there is a session and
 * from the fixtures when there is not, then rendered one body through a single
 * return that was wrapped in `<SampleRegion>`. So a signed-in child whose
 * dashboard loaded perfectly had their own week stamped `student:home`.
 *
 * That is the more dangerous direction. The end-to-end assertion this mark
 * exists for is "no sample marks once signed in" - it would have failed on a
 * healthy Home, and the obvious way to make a test like that pass is to delete
 * the mark that was telling the truth everywhere else.
 *
 * So: one test per direction, and neither is redundant.
 */

const dashboard = vi.hoisted(() => ({ useStudentDashboard: vi.fn() }));
vi.mock("@/hooks/useStudentDashboard", () => dashboard);

const signIn = () =>
  setSession({
    token: "tok-test",
    expiresAt: new Date(Date.now() + 60 * 60 * 1000).toISOString(),
    userId: "student-1",
    role: "student",
  });

beforeEach(() => {
  // Every other hook on this screen reads the network; none of them decides
  // the mark. Failing fast keeps them in their catch instead of pending.
  vi.stubGlobal("fetch", vi.fn().mockRejectedValue(new Error("no network")));
  dashboard.useStudentDashboard.mockReset();
  clearSession();
});

afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
  clearSession();
});

describe("HomeDashboard sample marking", () => {
  it("does not mark a signed-in child's own dashboard as sample data", async () => {
    signIn();
    dashboard.useStudentDashboard.mockReturnValue({
      data: { assignments: [], recentProgress: [] },
      failed: false,
      loading: false,
    });

    const { container } = render(<HomeDashboard />);

    // Wait past the hydration gate, which renders the skeleton first.
    await waitFor(() =>
      expect(container.querySelector(".animate-pulse")).toBeNull(),
    );
    expect(container.querySelector(`[${SAMPLE_ATTR}]`)).toBeNull();
  });

  it("marks the signed-out walkthrough, which is a fictional child's week", async () => {
    dashboard.useStudentDashboard.mockReturnValue({
      data: null,
      failed: false,
      loading: false,
    });

    const { container } = render(<HomeDashboard />);

    await waitFor(() =>
      expect(container.querySelector(`[${SAMPLE_ATTR}]`)).not.toBeNull(),
    );
    expect(
      container.querySelector(`[${SAMPLE_ATTR}]`)?.getAttribute(SAMPLE_ATTR),
    ).toBe("student:home");
  });

  it("shows a signed-in child nothing rather than sample data while the read is in flight", async () => {
    signIn();
    dashboard.useStudentDashboard.mockReturnValue({
      data: null,
      failed: false,
      loading: true,
    });

    const { container } = render(<HomeDashboard />);

    // The loading branch is the one that used to leak: `data === null` covers
    // in-flight as well as signed-out, so a slow read rendered the fixtures.
    await waitFor(() =>
      expect(container.querySelector(".animate-pulse")).not.toBeNull(),
    );
    expect(container.querySelector(`[${SAMPLE_ATTR}]`)).toBeNull();
  });
});
