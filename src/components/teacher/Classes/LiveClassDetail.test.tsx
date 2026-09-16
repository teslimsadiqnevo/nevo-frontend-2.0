import { beforeEach, describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import type { ClassStudent } from "@/lib/api/classes";

const { useClassRoster, useTeacherFlags } = vi.hoisted(() => ({
  useClassRoster: vi.fn(),
  useTeacherFlags: vi.fn(),
}));

vi.mock("@/hooks/useClassRoster", async (importOriginal) => ({
  // `studentName` and `lastSeenLine` are real: they are the row's own logic and
  // stubbing them would test a row that does not exist.
  ...(await importOriginal<typeof import("@/hooks/useClassRoster")>()),
  useClassRoster,
}));
vi.mock("@/hooks/useTeacherFlags", () => ({ useTeacherFlags }));

import { LiveClassDetail } from "./LiveClassDetail";

/**
 * C16b Student Observations, on the class detail roster.
 *
 * WHAT WAS THROWN AWAY. `observations` and `seatContext` have arrived on every
 * roster row since 3 Sep, and nothing rendered either. The frame was drawn the
 * whole time. `observations` is `{pattern, count}` over a closed five-value
 * enum, and the wording for those five already existed in
 * `lib/constants/observations.ts` - written, Zero-Tag reviewed and tested - for
 * the SENCo view. So this screen was one import away from the drawn design and
 * nobody had made it.
 *
 * THE COPY IS IMPORTED, NEVER RESTATED. That file says so itself: it is the
 * only copy of these five strings, "so a second screen that grows an
 * observations row imports from here rather than writing a set that drifts from
 * this one." These assertions read the constants rather than hardcoding the
 * words, so a Zero-Tag revision there cannot leave this screen behind.
 */

const seg = (over: Partial<ClassStudent> = {}): ClassStudent =>
  ({
    studentId: "s-1",
    firstName: "Amara",
    lastName: "Okafor",
    displayName: "Amara Okafor",
    loginIdentifier: "amara.o",
    status: "active",
    profileStatus: "observed",
    latestSessionAt: "2026-09-14T08:00:00Z",
    observations: [],
    seatContext: "Seat 12",
    consent: null,
    ...over,
  }) as unknown as ClassStudent;

const klass = {
  classId: "c-1",
  className: "JSS 2B",
  classCode: "AB12",
  role: "primary_teacher",
} as never;

beforeEach(() => {
  useClassRoster.mockReset();
  useTeacherFlags.mockReset();
  useTeacherFlags.mockReturnValue({ flags: [], live: true, failed: false });
  useClassRoster.mockReturnValue({ students: [seg()], loading: false, failed: false });
});

describe("observation chips", () => {
  it("renders the approved wording for a pattern, not the raw enum token", async () => {
    const { OBSERVATION_COPY } = await import("@/lib/constants/observations");
    useClassRoster.mockReturnValue({
      students: [seg({ observations: [{ pattern: "revisited_content", count: 3 }] })],
      loading: false,
      failed: false,
    });

    render(<LiveClassDetail klass={klass} />);

    expect(
      screen.getByText(new RegExp(OBSERVATION_COPY.revisited_content.title, "i")),
    ).toBeInTheDocument();
    expect(screen.queryByText(/revisited_content/)).not.toBeInTheDocument();
  });

  it("says how many times, when it was told", async () => {
    useClassRoster.mockReturnValue({
      students: [seg({ observations: [{ pattern: "completed_lessons", count: 3 }] })],
      loading: false,
      failed: false,
    });

    render(<LiveClassDetail klass={klass} />);

    expect(screen.getByText(/3 times/)).toBeInTheDocument();
  });

  it("says nothing about a count it was not given", () => {
    // `count` is nullable on the contract. An earlier card printed "null
    // times"; absent means we were not told how many, which is not zero.
    useClassRoster.mockReturnValue({
      students: [seg({ observations: [{ pattern: "completed_lessons", count: null }] })],
      loading: false,
      failed: false,
    });

    const { container } = render(<LiveClassDetail klass={klass} />);

    expect(container.textContent).not.toMatch(/null|undefined|0 times|NaN/);
  });

  it("falls back to the profile line when there are no observations", () => {
    render(<LiveClassDetail klass={klass} />);

    expect(screen.getByText(/Learning profile building/)).toBeInTheDocument();
  });

  it("ignores a pattern added to the enum after this shipped", () => {
    // The set is closed today; a sixth value must not render as `undefined`.
    useClassRoster.mockReturnValue({
      students: [
        seg({
          observations: [{ pattern: "some_future_pattern", count: 1 }] as never,
        }),
      ],
      loading: false,
      failed: false,
    });

    const { container } = render(<LiveClassDetail klass={klass} />);

    expect(container.textContent).not.toMatch(/undefined|some_future_pattern/);
  });
});

describe("seat context", () => {
  it("shows the seat rather than the login identifier", () => {
    // A teacher looking at their class wants the seat; the login identifier is
    // an account detail that belongs on the admin roster.
    render(<LiveClassDetail klass={klass} />);

    expect(screen.getByText("Seat 12")).toBeInTheDocument();
    expect(screen.queryByText("amara.o")).not.toBeInTheDocument();
  });

  it("falls back to the login identifier when there is no seat", () => {
    useClassRoster.mockReturnValue({
      students: [seg({ seatContext: "" })],
      loading: false,
      failed: false,
    });

    render(<LiveClassDetail klass={klass} />);

    expect(screen.getByText("amara.o")).toBeInTheDocument();
  });
});

describe("the two markers", () => {
  it("says the words rather than relying on a colour", () => {
    // Violet already means "has a learning profile" on this row, and colour
    // alone excludes anyone who cannot separate the two.
    useTeacherFlags.mockReturnValue({
      flags: [{ id: "f-1", studentId: "s-1", name: "Amara", context: null, note: "", generatedAt: "", isSudden: false }],
      live: true,
      failed: false,
    });

    render(<LiveClassDetail klass={klass} />);

    expect(screen.getByText("Worth a glance")).toBeInTheDocument();
  });

  it("distinguishes a sudden change from an ordinary glance", () => {
    useTeacherFlags.mockReturnValue({
      flags: [{ id: "f-1", studentId: "s-1", name: "Amara", context: null, note: "", generatedAt: "", isSudden: true }],
      live: true,
      failed: false,
    });

    render(<LiveClassDetail klass={klass} />);

    expect(screen.getByText("Sudden change")).toBeInTheDocument();
    expect(screen.queryByText("Worth a glance")).not.toBeInTheDocument();
  });

  it("marks nobody when a flag belongs to a student in another class", () => {
    useTeacherFlags.mockReturnValue({
      flags: [{ id: "f-9", studentId: "SOMEONE-ELSE", name: "Chidi", context: null, note: "", generatedAt: "", isSudden: true }],
      live: true,
      failed: false,
    });

    render(<LiveClassDetail klass={klass} />);

    expect(screen.queryByText("Sudden change")).not.toBeInTheDocument();
    expect(screen.queryByText("Worth a glance")).not.toBeInTheDocument();
  });
});

describe("the section copy", () => {
  it("dates nothing, because the route declares no window", () => {
    // C16b says "this week". The roster route declares no window and no cap, so
    // that is a claim the API has not made about a named child.
    const { container } = render(<LiveClassDetail klass={klass} />);

    expect(container.textContent).toMatch(/What Nevo has noticed about each student/);
    expect(container.textContent).not.toMatch(/this week|last 30 days|this month/i);
  });
});

describe("whether the child can get in", () => {
  /**
   * `status` arrived on every roster row from the start and was discarded at
   * render, so two rows looked identical whether or not the child could use
   * Nevo at all. Design's no-consent-column ruling rests on this being shown.
   */
  const roster = (...students: ReturnType<typeof seg>[]) =>
    useClassRoster.mockReturnValue({ students, loading: false, failed: false });

  it("marks a child whose account has been switched off", () => {
    roster(seg({ status: "deactivated" }));
    render(<LiveClassDetail klass={klass} />);

    expect(screen.getByText("Deactivated")).toBeInTheDocument();
  });

  it("marks a child who has never opened their account", () => {
    roster(seg({ status: "invited" }));
    render(<LiveClassDetail klass={klass} />);

    expect(screen.getByText("Invited")).toBeInTheDocument();
  });

  it("marks nothing at all for an ordinary active child", () => {
    // The teacher is looking for the exception. A marker on every row is
    // decoration, and this row already carries four other signals.
    //
    // Asserting only that "Deactivated" and "Invited" are absent was too weak:
    // a mutation marking active rows "Active" passed, because neither of those
    // two words appears. The first fix was weak for a subtler reason - it read
    // `container.textContent` against /\bActive\b/, and textContent concatenates
    // adjacent elements with no separator, so the row renders as
    // "...profile buildingActiveHere yesterday" and the word boundary never
    // matches. An assertion that cannot fail is worse than none.
    //
    // `queryByText` matches per element, so it sees the marker's own span.
    roster(seg({ status: "active" }));
    render(<LiveClassDetail klass={klass} />);

    expect(screen.queryByText("Deactivated")).not.toBeInTheDocument();
    expect(screen.queryByText("Invited")).not.toBeInTheDocument();
    expect(screen.queryByText("Active")).not.toBeInTheDocument();
  });

  it("does not call an unrecognised status deactivated", () => {
    // The whole row is rendered from an unvalidated payload. Saying a real
    // child has been switched off, because we did not recognise a value, is
    // the failure that matters here.
    roster(seg({ status: "pending" as never }));
    render(<LiveClassDetail klass={klass} />);

    expect(screen.queryByText("Deactivated")).not.toBeInTheDocument();
    expect(screen.getByText("Invited")).toBeInTheDocument();
  });

  it("marks only the child it belongs to", () => {
    roster(
      seg({ studentId: "s-1", firstName: "Amara", status: "deactivated" }),
      seg({ studentId: "s-2", firstName: "Tunde", status: "active" }),
    );
    render(<LiveClassDetail klass={klass} />);

    expect(screen.getAllByText("Deactivated")).toHaveLength(1);
  });

  it("gives no reason and never mentions consent", () => {
    // "No consent, no reason, just whether the child is active" is the ruling
    // this screen exists to satisfy. The consent payload IS on this response,
    // so its absence has to be asserted rather than assumed.
    roster(seg({ status: "deactivated" }));
    const { container } = render(<LiveClassDetail klass={klass} />);

    expect(container.textContent).not.toMatch(/consent|permission|guardian/i);
    expect(container.textContent).not.toMatch(/because|restore|reactivate/i);
  });

  it("says the word rather than relying on a colour", () => {
    // Violet already means "has a learning profile" on this row and navy means
    // "Sudden change". Admin draws this pill violet; here that would be a third
    // meaning on a colour carrying two.
    roster(seg({ status: "deactivated" }));
    render(<LiveClassDetail klass={klass} />);

    const mark = screen.getByText("Deactivated");
    expect(mark.className).not.toMatch(/violet|navy/);
  });
});
