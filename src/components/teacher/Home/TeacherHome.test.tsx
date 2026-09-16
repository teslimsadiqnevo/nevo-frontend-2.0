import { beforeEach, describe, expect, it, vi } from "vitest";
import { render } from "@testing-library/react";

const { useTeacherClasses, useTeacherFlags, useTeacherHome, useCurrentUser, useHasSession } =
  vi.hoisted(() => ({
    useTeacherClasses: vi.fn(),
    useTeacherFlags: vi.fn(),
    useTeacherHome: vi.fn(),
    useCurrentUser: vi.fn(),
    useHasSession: vi.fn(),
  }));

vi.mock("@/hooks/useTeacherClasses", () => ({ useTeacherClasses }));
vi.mock("@/hooks/useTeacherFlags", () => ({ useTeacherFlags }));
vi.mock("@/hooks/useTeacherHome", () => ({ useTeacherHome }));
vi.mock("@/hooks/useCurrentUser", () => ({ useCurrentUser }));
vi.mock("@/hooks/useHasSession", () => ({ useHasSession }));

import { TeacherHome } from "./TeacherHome";

/**
 * Whether Home admits it is showing samples.
 *
 * THE DEFECT, AND WHY IT WAS INVISIBLE. Home's fallback logic was already
 * right: fixtures render only when signed out, or when the live read genuinely
 * failed. What it never did was MARK them. Every sibling surface emits
 * `data-nevo-sample`; Home emitted none, anywhere, under any condition.
 *
 * That matters because of what depends on the mark.
 * `e2e/teacher-signed-in.spec.ts` walks `/teacher/dashboard` asserting the page
 * carries zero sample marks once a teacher is signed in - the one assertion in
 * the repo aimed squarely at "the console quietly degraded to fixtures". With
 * nothing to count, it passed on Home no matter what Home was showing. An
 * assertion that cannot fail is worse than no assertion, because it is counted
 * as coverage; `docs/BUILD_STATUS.md` reported that walk as a pass.
 *
 * So these tests are about the MARK, not the rendering. Asserting that fixture
 * text appears would have passed throughout the defect.
 */

const classes = (over: Record<string, unknown> = {}) => ({
  classes: [],
  liveClasses: [{ classId: "c-1", className: "E2E Probe Class", classCode: "AB12" }],
  options: [],
  live: true,
  loading: false,
  sample: false,
  ...over,
});

beforeEach(() => {
  useTeacherClasses.mockReset();
  useTeacherFlags.mockReset();
  useTeacherHome.mockReset();
  useCurrentUser.mockReset();
  useHasSession.mockReset();

  useTeacherClasses.mockReturnValue(classes());
  useCurrentUser.mockReturnValue({ name: "Ms. Adeyemi", school: "E2E Probe School" });
  useHasSession.mockReturnValue(true);
});

describe("a signed-in teacher whose reads succeeded", () => {
  /*
   * REAL LIVE CONTENT, not empty arrays.
   *
   * The first draft of this test passed `pulse: []` and `flags: []`, so the
   * page rendered nothing that a stray mark could attach to - and a deliberate
   * mutation that wrapped the LIVE pulse in a SampleRegion passed clean. The
   * test could not fail in the direction that matters, which is the same
   * vacuity defect this whole file exists to fix. A teacher's real pulse and a
   * real flag are on screen below, so a mark on either is caught.
   */
  beforeEach(() => {
    useTeacherFlags.mockReturnValue({
      flags: [
        {
          id: "f-1",
          studentId: "s-1",
          name: "Amara Okafor",
          context: "JSS 2A",
          note: "Taking longer on written segments.",
          generatedAt: "2026-09-14T08:00:00Z",
          isSudden: false,
        },
      ],
      live: true,
      failed: false,
    });
    useTeacherHome.mockReturnValue({
      // `useTeacherHome` hands out a SHAPED pulse - tiles already banded into
      // words - not the raw `ClassPulseRow`. Mocking the wire shape here would
      // crash on `pulse.tiles.map`, which is its own small lesson: mock what
      // the hook returns, not what the endpoint sends.
      pulse: [
        {
          classId: "c-1",
          className: "E2E Probe Class",
          studentCount: 28,
          tiles: [
            { head: "Engagement", value: "Above 75%" },
            { head: "Comprehension", value: "Below 50%" },
            { head: "Focus", value: "50 to 75%" },
          ],
          quiet: false,
        },
      ],
      activity: [
        {
          id: "a-1",
          title: "Fractions 3",
          detail: "E2E Probe Class",
          when: "Today",
          href: null,
        },
      ],
      live: true,
      failed: false,
    });
  });

  it("carries no sample mark at all", () => {
    const { container } = render(<TeacherHome />);

    expect(container.querySelectorAll("[data-nevo-sample]")).toHaveLength(0);
  });

  it("really did render the live content the assertion above depends on", () => {
    // Guards the guard: if the live sections stopped rendering, the zero-marks
    // assertion would start passing for the wrong reason.
    const { getByText } = render(<TeacherHome />);

    expect(getByText("E2E Probe Class")).toBeInTheDocument();
    expect(getByText(/Taking longer on written segments/)).toBeInTheDocument();
  });
});

describe("a signed-in teacher whose reads FAILED", () => {
  beforeEach(() => {
    useTeacherFlags.mockReturnValue({ flags: [], live: false, failed: true });
    useTeacherHome.mockReturnValue({
      pulse: [],
      activity: [],
      live: false,
      failed: true,
    });
  });

  it("marks every fixture region, so the signed-in e2e can see them", () => {
    // Before this, the count here was 0 while the screen was full of another
    // school's week - which is exactly what the e2e walk was written to catch.
    const { container } = render(<TeacherHome />);

    const marks = [...container.querySelectorAll("[data-nevo-sample]")].map((n) =>
      n.getAttribute("data-nevo-sample"),
    );

    expect(marks.length).toBeGreaterThan(0);
    expect(marks).toContain("teacher:home-pulse");
    expect(marks).toContain("teacher:home-flags");
    expect(marks).toContain("teacher:home-activity");
  });

  it("names the screen in each mark, so a failure says where", () => {
    const { container } = render(<TeacherHome />);

    for (const node of container.querySelectorAll("[data-nevo-sample]")) {
      expect(node.getAttribute("data-nevo-sample")).toMatch(/^teacher:home-/);
    }
  });

  it("changes no layout - the marks are display:contents", () => {
    // A marker that moved the page is a marker someone deletes.
    const { container } = render(<TeacherHome />);

    for (const node of container.querySelectorAll("[data-nevo-sample]")) {
      expect((node as HTMLElement).style.display).toBe("contents");
    }
  });
});

describe("a signed-out visitor", () => {
  it("still sees the designed screen, and it is still marked", () => {
    // The walkthrough is the fixtures' legitimate home. Marking them costs it
    // nothing and keeps one rule rather than two.
    useHasSession.mockReturnValue(false);
    useTeacherFlags.mockReturnValue({ flags: [], live: false, failed: false });
    useTeacherHome.mockReturnValue({
      pulse: [],
      activity: [],
      live: false,
      failed: false,
    });

    const { container } = render(<TeacherHome />);

    expect(
      container.querySelectorAll("[data-nevo-sample]").length,
    ).toBeGreaterThan(0);
  });
});
