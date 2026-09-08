import { describe, expect, it, vi } from "vitest";
import { render, waitFor } from "@testing-library/react";
import { visibleText } from "@/test/visibleText";
import type { OutcomePeriod, SchoolHealth } from "@/lib/api/analytics";
import { ReportsView } from "./ReportsView";

/**
 * "There aren't enough lessons yet" is a statement ABOUT THE SCHOOL, and a
 * failed outcomes read does not license it.
 *
 * The trend card branched on `sorted.length >= 3` alone, so a 500 on the
 * outcomes call - which leaves the array empty - told a school that had taught
 * all year that it had not taught enough. That is the worst kind of wrong: it
 * is plausible, it is unfalsifiable from the screen, and an admin might act on
 * it. Fixed in #269; pinned here.
 */

const outcomes = vi.fn();
vi.mock("@/lib/api/analytics", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/lib/api/analytics")>();
  return {
    ...actual,
    analyticsApi: {
      ...actual.analyticsApi,
      getSchoolHealth: async (): Promise<SchoolHealth> => ({
        schoolId: "sch1",
        studentCount: 240,
        activeStudentsLast30Days: 180,
        completedLessonSessions: 4200,
        participationRate: 0.75,
      }),
      getOutcomes: () => outcomes(),
      getSchoolMastery: async () => [],
      getTransformationMetrics: async () => null,
    },
  };
});

const period = (day: number, rate: number): OutcomePeriod => ({
  period: `2026-08-0${day}`,
  sessions: 100,
  completedSessions: Math.round(100 * rate),
  completionRate: rate,
  averageAdaptations: 2.4,
});

describe("ReportsView outcomes trend", () => {
  it("does not blame the school for lessons when the read failed", async () => {
    outcomes.mockRejectedValue(new Error("500"));

    const { container } = render(<ReportsView />);
    await waitFor(() =>
      expect(visibleText(container)).toMatch(/couldn't read/i),
    );

    expect(visibleText(container)).toMatch(/lesson outcomes/i);
    // The sentence that puts it on them must be gone entirely.
    expect(visibleText(container)).not.toMatch(/enough lessons yet/i);
    expect(visibleText(container)).not.toMatch(/Still gathering/i);
  });

  it("says there isn't enough yet when the read succeeded and is thin", async () => {
    outcomes.mockResolvedValue({ schoolId: "sch1", outcomes: [period(1, 0.4)] });

    const { container } = render(<ReportsView />);
    await waitFor(() =>
      expect(visibleText(container)).toMatch(/enough lessons yet/i),
    );
    expect(visibleText(container)).not.toMatch(/couldn't read/i);
  });

  it("draws the trend once three periods are in", async () => {
    outcomes.mockResolvedValue({
      schoolId: "sch1",
      outcomes: [period(1, 0.4), period(2, 0.5), period(3, 0.62)],
    });

    const { container } = render(<ReportsView />);
    await waitFor(() =>
      expect(visibleText(container)).toMatch(/How often Nevo adapted/i),
    );
    expect(visibleText(container)).not.toMatch(/enough lessons yet/i);
    expect(visibleText(container)).not.toMatch(/couldn't read/i);
  });
});
