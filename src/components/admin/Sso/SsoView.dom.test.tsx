import { describe, expect, it, vi } from "vitest";
import { render, waitFor } from "@testing-library/react";
import { visibleText } from "@/test/visibleText";
import type { School } from "@/lib/api/school";
import type { SsoStatus } from "@/lib/api/sso";
import { SsoView } from "./SsoView";

/**
 * The worst of the five failed-read claims: a school whose sync history did not
 * answer was told its roster sync was "Healthy".
 *
 * The mechanism was `history?.failed_runs ?? 0` - a failed read coalesces to 0
 * and falls straight into the healthy branch, so absence of evidence rendered
 * as evidence of health, on the one operation that creates, matches and
 * deactivates real student and staff records. Fixed in #269; pinned here.
 */

const status = vi.fn();
const syncHistory = vi.fn();

vi.mock("@/lib/api/sso", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/lib/api/sso")>();
  return {
    ...actual,
    ssoApi: {
      ...actual.ssoApi,
      status: () => status(),
      syncHistory: () => syncHistory(),
    },
  };
});

vi.mock("@/lib/api/school", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/lib/api/school")>();
  return {
    ...actual,
    schoolApi: {
      ...actual.schoolApi,
      get: async () =>
        ({ id: "sch1", name: "Brightgate", code: "BGA-4827" }) as School,
    },
  };
});

const CONNECTED: SsoStatus = {
  provider: "microsoft",
  status: "connected",
  school_url_slug: "brightgate",
  school_entry_url: "https://nevolearning.com/s/brightgate",
  last_connection_error: null,
  connection_checked_at: null,
  reauthorised_at: null,
  last_successful_sync_at: "2026-09-08T06:00:00Z",
  next_scheduled_sync_at: null,
  disconnected_at: null,
  data_flow: [],
};


describe("SsoView roster sync health", () => {
  it("does not claim Healthy when the run history failed to load", async () => {
    status.mockResolvedValue(CONNECTED);
    syncHistory.mockRejectedValue(new Error("500"));

    const { container } = render(<SsoView />);
    await waitFor(() =>
      expect(visibleText(container)).toMatch(/sync history unavailable/i),
    );

    // The claim must be GONE, not merely qualified further down the card.
    expect(visibleText(container)).not.toMatch(/\bHealthy\b/);
    expect(visibleText(container)).toMatch(/does not account for failed runs/i);
  });

  it("says Healthy only when the history actually reports no failures", async () => {
    status.mockResolvedValue(CONNECTED);
    syncHistory.mockResolvedValue({
      window_days: 30,
      successful_runs: 12,
      failed_runs: 0,
      runs: [],
    });

    const { container } = render(<SsoView />);
    await waitFor(() => expect(visibleText(container)).toMatch(/\bHealthy\b/));
    expect(visibleText(container)).toMatch(/12 successful runs in the last 30 days/i);
    expect(visibleText(container)).not.toMatch(/unavailable/i);
  });

  it("names real failures when the history reports them", async () => {
    status.mockResolvedValue(CONNECTED);
    syncHistory.mockResolvedValue({
      window_days: 30,
      successful_runs: 9,
      failed_runs: 3,
      runs: [],
    });

    const { container } = render(<SsoView />);
    await waitFor(() => expect(visibleText(container)).toMatch(/failures to look at/i));
    expect(visibleText(container)).toMatch(/3 failed/i);
    expect(visibleText(container)).not.toMatch(/\bHealthy\b/);
  });
});
