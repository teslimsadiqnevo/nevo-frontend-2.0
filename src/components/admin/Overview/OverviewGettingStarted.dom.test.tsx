import { describe, expect, it, vi, beforeEach } from "vitest";
import { render, waitFor } from "@testing-library/react";
import { visibleText } from "@/test/visibleText";
import { OverviewView } from "./OverviewView";
import { teachersOnRoster } from "./overviewGettingStarted";

/**
 * The getting-started checklist may only tick from a signal the screen holds.
 *
 * `counts.teachers` is one. A failed or absent counts read is NOT, and must
 * leave the row open rather than either ticking it or telling a school it has
 * no teachers - the checklist's own rule, and the direction with the history
 * on this screen: it once told a school with nothing in it that six students
 * were waiting on parent consent.
 */

const audit = vi.fn();
const adaptationLog = vi.fn();
const narrative = vi.fn();
const overview = vi.fn();

vi.mock("@/lib/api/schoolIntelligence", async (importOriginal) => {
  const actual =
    await importOriginal<typeof import("@/lib/api/schoolIntelligence")>();
  return {
    ...actual,
    schoolIntelligenceApi: {
      ...actual.schoolIntelligenceApi,
      complianceAudit: () => audit(),
      adaptationLog: () => adaptationLog(),
    },
  };
});

vi.mock("@/lib/api/school", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/lib/api/school")>();
  return {
    ...actual,
    schoolApi: {
      ...actual.schoolApi,
      narrative: () => narrative(),
      overview: () => overview(),
    },
  };
});

const AUDIT = {
  schoolId: "sch1",
  schoolName: "Brightgate Academy",
  generatedAt: "2026-09-11T08:00:00Z",
  studentsProfiled: 0,
  adaptationEventsLogged: 0,
  diagnosticLabelsStored: 0,
  compliant: true,
  findings: [],
};

/** The row is the whole list item; scope assertions to it, not the page. */
function stepRow(container: HTMLElement, title: string): HTMLElement {
  const hit = Array.from(container.querySelectorAll("a, div")).find((el) => {
    const t = el.textContent ?? "";
    return t.includes(title) && t.length < 300;
  });
  if (!hit) throw new Error(`no step row for ${title}`);
  return hit as HTMLElement;
}

beforeEach(() => {
  audit.mockReset();
  adaptationLog.mockReset();
  narrative.mockReset();
  overview.mockReset();
  audit.mockResolvedValue(AUDIT);
  // total 0 keeps the screen in its early state, which is where the
  // checklist lives at all.
  adaptationLog.mockResolvedValue({ events: [], total: 0, limit: 1, offset: 0 });
  narrative.mockRejectedValue(new Error("not under test"));
  overview.mockResolvedValue({ schoolId: "sch1", counts: { teachers: 3 } });
});

describe("Overview getting-started - the teachers row", () => {
  it("ticks when the roster carries teachers", async () => {
    const { container } = render(<OverviewView />);

    await waitFor(() =>
      expect(visibleText(container)).toMatch(/Invite your teachers/),
    );
    expect(visibleText(stepRow(container, "Invite your teachers"))).toMatch(
      /\(done\)/,
    );
    // Control: a row that can settle, and one that cannot.
    expect(visibleText(stepRow(container, "Workspace created"))).toMatch(/\(done\)/);
    expect(
      visibleText(stepRow(container, "Choose how everyone signs in")),
    ).not.toMatch(/\(done\)/);
  });

  it("ticks on a single teacher - the threshold is one, not a crowd", async () => {
    overview.mockResolvedValue({ schoolId: "sch1", counts: { teachers: 1 } });
    const { container } = render(<OverviewView />);

    await waitFor(() =>
      expect(visibleText(container)).toMatch(/Invite your teachers/),
    );
    expect(visibleText(stepRow(container, "Invite your teachers"))).toMatch(
      /\(done\)/,
    );
  });

  it("stays open at zero", async () => {
    overview.mockResolvedValue({ schoolId: "sch1", counts: { teachers: 0 } });
    const { container } = render(<OverviewView />);

    await waitFor(() =>
      expect(visibleText(stepRow(container, "Workspace created"))).toMatch(/\(done\)/),
    );
    expect(visibleText(stepRow(container, "Invite your teachers"))).not.toMatch(
      /\(done\)/,
    );
  });

  it("does not tick, and makes no negative claim, when the read failed", async () => {
    overview.mockRejectedValue(new Error("500"));
    const { container } = render(<OverviewView />);

    // The page survived the failure - this is the control that proves the
    // assertion below is about the tick and not about a blank screen.
    await waitFor(() =>
      expect(visibleText(stepRow(container, "Workspace created"))).toMatch(/\(done\)/),
    );
    expect(visibleText(stepRow(container, "Invite your teachers"))).not.toMatch(
      /\(done\)/,
    );
    // Unknown is not zero. The screen must not have gained a claim it cannot
    // support in either direction.
    expect(visibleText(container)).not.toMatch(/no teachers/i);
    expect(visibleText(container)).not.toMatch(/haven't invited/i);
  });

  it("does not tick when the payload omits the count", async () => {
    overview.mockResolvedValue({ schoolId: "sch1", counts: {} });
    const { container } = render(<OverviewView />);

    await waitFor(() =>
      expect(visibleText(stepRow(container, "Workspace created"))).toMatch(/\(done\)/),
    );
    expect(visibleText(stepRow(container, "Invite your teachers"))).not.toMatch(
      /\(done\)/,
    );
  });

  it("keeps D04's copy on a ticked row", async () => {
    const { container } = render(<OverviewView />);
    await waitFor(() =>
      expect(visibleText(container)).toMatch(/Invite your teachers/),
    );
    const row = visibleText(stepRow(container, "Invite your teachers"));
    expect(row).toMatch(/They each get a link to set up their own console\./);
  });
});

/**
 * The predicate on its own. `(counts?.teachers ?? 0) > 0` passes every case
 * here except the fifth, which is exactly why the fifth exists: it is the one
 * that distinguishes "we know there are none" from "we do not know".
 */
describe("teachersOnRoster", () => {
  it("is false for every shape that means unknown", () => {
    expect(teachersOnRoster(null)).toBe(false);
    expect(teachersOnRoster(undefined)).toBe(false);
    expect(teachersOnRoster({})).toBe(false);
  });

  it("is false at zero and true above it", () => {
    expect(teachersOnRoster({ teachers: 0 })).toBe(false);
    expect(teachersOnRoster({ teachers: 1 })).toBe(true);
    expect(teachersOnRoster({ teachers: 40 })).toBe(true);
  });
});
