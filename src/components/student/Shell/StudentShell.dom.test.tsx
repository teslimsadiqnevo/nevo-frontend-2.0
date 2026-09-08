import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { cleanup, render, screen } from "@testing-library/react";
import { StudentShell } from "./StudentShell";
import { clearSession, setSession } from "@/lib/auth/session";
import { AccessibilityProvider } from "@/context/AccessibilityContext";

/**
 * WHICH SURFACES CAN A CHILD ASK FOR HELP FROM.
 *
 * Frame 26 governs Ask Nevo: "always reachable, never interruptive". It was
 * mounted below the shell's full-screen early return, so it appeared on every
 * tab and was absent from the lesson player - the one screen where a child gets
 * stuck. This pins both halves, because the exclusions are as deliberate as the
 * inclusion and a later reader would otherwise be right to "fix" them:
 *
 * - the daily warm-up is a CALIBRATED baseline activity, and offering help
 *   inside it would contaminate what it measures
 * - onboarding has no lesson to ask about and no session to ask with
 */

vi.mock("next/navigation", () => ({
  usePathname: () => pathname,
  useRouter: () => ({ push: vi.fn(), replace: vi.fn(), back: vi.fn() }),
}));
// Ask Nevo itself is heavy (sheet, keyboard, signals); this is about WHERE the
// shell mounts it, not what it renders.
vi.mock("@/components/student/AskNevo/AskNevo", () => ({
  AskNevo: () => <div data-testid="ask-nevo" />,
}));
vi.mock("@/hooks", () => ({
  useBehaviouralCapture: vi.fn(),
  // The in-shell tabs render the notification bell; it reads the network and
  // decides nothing about where Ask Nevo goes.
  useNotifications: () => ({
    notifications: [],
    unreadCount: 0,
    failed: false,
  }),
}));
vi.mock("@/hooks/useSessionRefresh", () => ({ useSessionRefresh: vi.fn() }));

let pathname = "/student/dashboard";

const signIn = () =>
  setSession({
    token: "tok-test",
    expiresAt: new Date(Date.now() + 60 * 60 * 1000).toISOString(),
    userId: "student-1",
    role: "student",
  });

const at = (path: string) => {
  pathname = path;
  return render(
    <AccessibilityProvider>
      <StudentShell>
        <p>lesson body</p>
      </StudentShell>
    </AccessibilityProvider>,
  );
};

beforeEach(() => {
  clearSession();
  signIn();
});

afterEach(() => {
  cleanup();
  clearSession();
});

describe("StudentShell — where Ask Nevo is reachable", () => {
  it("is reachable inside the lesson player", () => {
    at("/student/lessons/abc-123");
    expect(screen.getByTestId("ask-nevo")).toBeTruthy();
  });

  it("is reachable inside a review session, which reuses the player", () => {
    at("/student/lessons/abc-123/review-session");
    expect(screen.getByTestId("ask-nevo")).toBeTruthy();
  });

  it("is reachable from the ordinary tabs", () => {
    at("/student/dashboard");
    expect(screen.getByTestId("ask-nevo")).toBeTruthy();
  });

  it("stays out of the daily warm-up, which is a measurement", () => {
    at("/student/warm-up");
    expect(screen.queryByTestId("ask-nevo")).toBeNull();
  });

  it("stays out of onboarding, where there is no lesson and no session", () => {
    at("/student/onboarding/sequence");
    expect(screen.queryByTestId("ask-nevo")).toBeNull();
  });

  it("keeps the lesson player free of the sidebar and bottom nav", () => {
    at("/student/lessons/abc-123");
    // The player is immersive: Ask Nevo joins it, chrome does not.
    expect(screen.queryByRole("navigation")).toBeNull();
    expect(screen.getByText("lesson body")).toBeTruthy();
  });
});
