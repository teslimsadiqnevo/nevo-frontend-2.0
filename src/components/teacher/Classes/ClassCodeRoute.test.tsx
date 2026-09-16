import { beforeEach, describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import type { TeacherClasses } from "@/hooks/useTeacherClasses";

const { useTeacherClasses, getToken, notFound, push } = vi.hoisted(() => ({
  useTeacherClasses: vi.fn(),
  getToken: vi.fn(),
  notFound: vi.fn(() => {
    throw new Error("NEXT_NOT_FOUND");
  }),
  push: vi.fn(),
}));

vi.mock("@/hooks/useTeacherClasses", () => ({ useTeacherClasses }));
vi.mock("@/hooks/useHydrated", () => ({ useHydrated: () => true }));
vi.mock("@/lib/auth/session", () => ({ getToken }));
vi.mock("next/navigation", () => ({
  useRouter: () => ({ push, replace: push, prefetch: vi.fn() }),
  notFound,
}));
// The QR itself is not under test: it renders asynchronously off the `qrcode`
// library, and what matters here is WHICH class the route resolved.
vi.mock("./ClassQr", () => ({
  ClassQrScreen: ({ className, code }: { className: string; code: string }) => (
    <div data-testid="qr-screen">{`PROJECTING ${className} / ${code}`}</div>
  ),
}));

import { ClassCodeRoute } from "./ClassCodeRoute";

/**
 * C12 as a route (design, 15 Sep).
 *
 * The screen already existed and was mounted from class detail's dialog; this
 * only gives it a URL. So the tests are about RESOLUTION, which is where the
 * sibling route (`ClassRoute`) has historically gone wrong: it 404'd a signed-in
 * teacher's own class because `getToken()` is false on the server, and again
 * whenever the class list read failed.
 *
 * The extra rule here, which ClassRoute does not have: NO FIXTURE FALLBACK. A
 * projected join code is the one thing on this console a room full of children
 * physically acts on, so a sample code would send all of them into a join flow
 * for a class that does not exist.
 */

const state = (over: Partial<TeacherClasses> = {}): TeacherClasses => ({
  classes: [],
  liveClasses: [],
  options: [],
  live: false,
  loading: false,
  sample: false,
  ...over,
});

const mine = (over: Record<string, unknown> = {}) =>
  state({
    live: true,
    liveClasses: [
      {
        assignmentId: "a-1",
        classId: "c-1",
        className: "JSS 2A",
        classCode: "NEVO-2A",
        role: "primary",
        assignedAt: "2026-09-01T09:00:00Z",
        ...over,
      },
    ],
  });

beforeEach(() => {
  useTeacherClasses.mockReset();
  getToken.mockReset();
  notFound.mockClear();
  push.mockReset();
  getToken.mockReturnValue("a-token");
});

describe("resolving the class", () => {
  it("projects the teacher's own class code", () => {
    useTeacherClasses.mockReturnValue(mine());

    render(<ClassCodeRoute classId="c-1" />);

    expect(screen.getByTestId("qr-screen")).toHaveTextContent(
      "PROJECTING JSS 2A / NEVO-2A",
    );
  });

  it("holds the screen while the class list is still in flight", () => {
    // 404-ing here would greet a teacher mid-lesson with "this page doesn't
    // exist" for their own class, which is exactly how ClassRoute broke.
    useTeacherClasses.mockReturnValue(state({ loading: true }));

    render(<ClassCodeRoute classId="c-1" />);

    expect(notFound).not.toHaveBeenCalled();
    expect(screen.queryByTestId("qr-screen")).not.toBeInTheDocument();
  });

  it("does not 404 when the class list could not be read", () => {
    // `sample` is not resolution: a failed read is not evidence the class is
    // absent. The teacher is told we could not reach the school instead.
    useTeacherClasses.mockReturnValue(state({ sample: true, live: false }));

    render(<ClassCodeRoute classId="c-1" />);

    expect(notFound).not.toHaveBeenCalled();
    expect(screen.getByText(/couldn’t reach your school/i)).toBeInTheDocument();
    expect(screen.queryByTestId("qr-screen")).not.toBeInTheDocument();
  });

  it("404s a class that is resolved and genuinely not this teacher's", () => {
    useTeacherClasses.mockReturnValue(mine());

    expect(() => render(<ClassCodeRoute classId="someone-elses" />)).toThrow(
      /NEXT_NOT_FOUND/,
    );
  });

  it("404s a signed-out visitor rather than showing a sample code", () => {
    // The rule this route adds over ClassRoute. A projected sample code sends
    // a whole room of children into a join flow for a class that is not real.
    getToken.mockReturnValue(null);
    useTeacherClasses.mockReturnValue(state({ live: false }));

    expect(() => render(<ClassCodeRoute classId="c-1" />)).toThrow(
      /NEXT_NOT_FOUND/,
    );
  });
});

describe("a class with no join code", () => {
  it("says so instead of projecting a QR for an empty code", () => {
    useTeacherClasses.mockReturnValue(mine({ classCode: null }));

    render(<ClassCodeRoute classId="c-1" />);

    expect(screen.queryByTestId("qr-screen")).not.toBeInTheDocument();
    expect(screen.getByText(/doesn’t have a join code yet/i)).toBeInTheDocument();
    expect(screen.getByText(/JSS 2A/)).toBeInTheDocument();
  });

  it("offers the way back to the class", () => {
    useTeacherClasses.mockReturnValue(mine({ classCode: null }));

    render(<ClassCodeRoute classId="c-1" />);

    expect(screen.getByRole("link", { name: /Back to the class/i })).toHaveAttribute(
      "href",
      "/teacher/classes/c-1",
    );
  });
});
