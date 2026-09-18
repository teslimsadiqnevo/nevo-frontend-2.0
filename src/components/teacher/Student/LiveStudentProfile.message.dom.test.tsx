import { beforeEach, describe, expect, it, vi } from "vitest";
import { fireEvent, render, screen } from "@testing-library/react";

const { push, useStudentSessions, useStudentSession } = vi.hoisted(() => ({
  push: vi.fn(),
  useStudentSessions: vi.fn(),
  useStudentSession: vi.fn(),
}));
vi.mock("@/hooks/useStudentFlags", () => ({
  useStudentFlags: () => ({ noticed: [], failed: false, loading: false }),
}));
vi.mock("@/hooks/useStudentSessions", () => ({
  useStudentSessions,
  useStudentSession,
}));
vi.mock("next/navigation", () => ({
  useRouter: () => ({ push, replace: vi.fn(), prefetch: vi.fn() }),
}));

import { LiveStudentProfile } from "./LiveStudentProfile";
import type { StudentProfileState } from "@/hooks/useStudentProfile";

/**
 * "Send them a message" naming the child it is next to.
 *
 * It linked to a bare `/teacher/connect` until 18 Sep, and Connect decides
 * whether to open compose from that query - so the action on a named child's
 * profile opened the thread list and stopped there.
 */

const STATE: StudentProfileState = {
  profile: {
    student: { id: "s-42", firstName: "Amara", lastName: "Okafor", ageBand: "11 to 12" },
    profile: null,
    openFlagCount: 0,
  },
  concepts: [],
  helpSeeking: "",
  recommendations: [],
  adaptations: [],
  sessions: [],
  accommodations: null,
  observed: true,
  loading: false,
  missing: false,
  failed: false,
};

const noSessions = () => {
  useStudentSessions.mockReturnValue({
    sessions: [],
    total: 0,
    loading: false,
    failed: false,
  });
  useStudentSession.mockReturnValue({
    detail: null,
    loading: false,
    failed: false,
  });
};

beforeEach(() => {
  push.mockReset();
  noSessions();
});

describe("messaging from a profile", () => {
  it("carries the student's id to Connect", () => {
    render(<LiveStudentProfile studentId="s-42" state={STATE} />);

    expect(
      screen.getByRole("link", { name: "Send them a message" }),
    ).toHaveAttribute("href", "/teacher/connect?student=s-42");
  });

  it("carries it from inside a session too", () => {
    /*
     * The third caller, and the one a mutation run caught: the session
     * panel's Message action navigates rather than following a link, so it
     * needs the query building by hand and nothing else in this change
     * would have noticed it missing.
     */
    useStudentSessions.mockReturnValue({
      sessions: [
        {
          sessionId: "sess-1",
          lessonId: "l-1",
          lessonTitle: "Solving linear equations",
          occurredAt: "2026-07-09T09:00:00Z",
          completionStatus: "completed",
          sitting: 1,
        },
      ],
      total: 1,
      loading: false,
      failed: false,
    });
    useStudentSession.mockReturnValue({
      detail: {
        sessionId: "sess-1",
        lessonId: "l-1",
        lessonTitle: "Solving linear equations",
        occurredAt: "2026-07-09T09:00:00Z",
        sittings: 1,
        narrative: "Worked through it steadily.",
        sections: [],
      },
      loading: false,
      failed: false,
    });

    render(<LiveStudentProfile studentId="s-42" state={STATE} />);
    fireEvent.click(
      screen.getByRole("button", { name: /Solving linear equations/ }),
    );
    fireEvent.click(screen.getAllByRole("button", { name: /Message/ })[0]);

    expect(push).toHaveBeenCalledWith("/teacher/connect?student=s-42");
  });
});
