import { describe, expect, it } from "vitest";
import type { RosterSyncHistory, RosterSyncRun } from "@/lib/api/sso";
import { hasTechnicalDetail, latestRun, runIssues } from "./rosterSync";

/**
 * Three rules about a school's sync, each of which this console has a way of
 * getting wrong:
 *
 * 1. "Latest" must be derived, not assumed. The contract documents no ordering
 *    on `runs`, so taking `runs[0]` would describe an old run as the current
 *    one - and the panel's lead line stamps it with a time.
 * 2. An empty `issues[]` is the ABSENCE of a report, not evidence of a clean
 *    sync. It must open no disclosure at all rather than say "no issues".
 * 3. `api.get<T>` is a cast, not a validation. A typed array is an assertion
 *    the compiler never checks, so the boundary re-checks it.
 */

const run = (over: Partial<RosterSyncRun> = {}): RosterSyncRun => ({
  id: "r1",
  provider: "microsoft",
  status: "completed",
  importedStudents: 10,
  importedTeachers: 2,
  missingTeacherClassMappings: 0,
  failureReason: null,
  triggeredManually: false,
  startedAt: "2026-09-10T09:00:00Z",
  completedAt: "2026-09-10T09:04:00Z",
  issues: [],
  ...over,
});

const history = (runs: RosterSyncRun[]): RosterSyncHistory => ({
  windowDays: 30,
  successfulRuns: runs.length,
  failedRuns: 0,
  runs,
});

const issue = (id: string) => ({
  id,
  externalReference: "a.okonkwo@brightgate.edu.ng",
  description: "Could not match this record to a student.",
  resolutionHint: null,
});

describe("latestRun", () => {
  it("picks the most recently started run, not the first in the array", () => {
    const older = run({ id: "old", startedAt: "2026-09-01T09:00:00Z" });
    const newer = run({ id: "new", startedAt: "2026-09-10T09:00:00Z" });
    // Deliberately out of order: the contract promises no ordering.
    expect(latestRun(history([older, newer]))?.id).toBe("new");
    expect(latestRun(history([newer, older]))?.id).toBe("new");
  });

  it("does not mutate the history it was handed", () => {
    const older = run({ id: "old", startedAt: "2026-09-01T09:00:00Z" });
    const newer = run({ id: "new", startedAt: "2026-09-10T09:00:00Z" });
    const h = history([older, newer]);
    latestRun(h);
    expect(h.runs.map((r) => r.id)).toEqual(["old", "new"]);
  });

  it("is null for every shape that means no run", () => {
    expect(latestRun(null)).toBeNull();
    expect(latestRun(undefined)).toBeNull();
    expect(latestRun(history([]))).toBeNull();
  });
});

describe("hasTechnicalDetail", () => {
  it("is false for a clean run, so the disclosure does not exist", () => {
    // Not "No issues found" - an empty array is not a clean bill of health.
    expect(hasTechnicalDetail(run())).toBe(false);
  });

  it("is true when there are issues", () => {
    expect(hasTechnicalDetail(run({ issues: [issue("i1")] }))).toBe(true);
  });

  it("is true for a failure reason with no issues", () => {
    expect(
      hasTechnicalDetail(run({ failureReason: "Token expired.", status: "failed" })),
    ).toBe(true);
  });

  it("treats an empty failure reason as nothing to report", () => {
    expect(hasTechnicalDetail(run({ failureReason: "" }))).toBe(false);
  });

  it("survives a response whose issues are not an array", () => {
    // The declared type says they are. The cast says nothing.
    const bad = { ...run(), issues: undefined } as unknown as RosterSyncRun;
    expect(hasTechnicalDetail(bad)).toBe(false);
    expect(runIssues(bad)).toEqual([]);
  });

  it("is false for no run at all", () => {
    expect(hasTechnicalDetail(null)).toBe(false);
  });
});
