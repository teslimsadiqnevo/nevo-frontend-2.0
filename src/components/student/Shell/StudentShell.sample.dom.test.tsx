import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import { StudentShell } from "./StudentShell";
import { AccessibilityProvider } from "@/context/AccessibilityContext";
import { clearSession, setSession } from "@/lib/auth/session";
import { SAMPLE_ATTR } from "@/lib/sampleData";

/**
 * The mark exists so an end-to-end test can catch the console degrading to
 * fixtures — the failure this architecture actually has.
 *
 * A flow test sails past it: when a live read fails, the fallback renders
 * exactly what "the child sees their lessons" asserts. So the suite goes green
 * while a real child is shown invented data. The mark is the only thing that
 * distinguishes the two, which makes an UNMARKED fallback worse than no test at
 * all — it converts a silent bug into a passing build.
 *
 * Both directions matter and both are pinned here. A mark that never appears
 * catches nothing; a mark that always appears makes the assertion meaningless.
 */

vi.mock("next/navigation", () => ({ usePathname: () => "/student/dashboard" }));
vi.mock("@/hooks", () => ({ useBehaviouralCapture: vi.fn() }));
vi.mock("@/hooks/useSessionRefresh", () => ({ useSessionRefresh: vi.fn() }));
vi.mock("@/hooks/useSessionLapse", () => ({ useSessionLapse: vi.fn() }));
vi.mock("@/lib/lessons/pendingProgress", () => ({
  flushPendingProgress: vi.fn().mockResolvedValue(undefined),
}));
vi.mock("./NotificationBell", () => ({ NotificationBell: () => null }));
vi.mock("@/components/student/AskNevo/AskNevo", () => ({
  AskNevo: () => null,
}));
vi.mock("./useDisplayName", () => ({
  useDisplayName: () => ({ name: "", initials: "" }),
}));

/** The shell reads the accessibility context for its Text Size zoom. */
const renderShell = () =>
  render(
    <AccessibilityProvider>
      <StudentShell>
        <p>content</p>
      </StudentShell>
    </AccessibilityProvider>,
  );

const marks = () =>
  Array.from(document.querySelectorAll(`[${SAMPLE_ATTR}]`)).map((el) =>
    el.getAttribute(SAMPLE_ATTR),
  );

const signIn = () =>
  setSession({
    token: "tok",
    expiresAt: new Date(Date.now() + 3600_000).toISOString(),
    userId: "student-1",
    role: "student",
  });

beforeEach(() => {
  clearSession();
  window.localStorage.clear();
});

afterEach(() => {
  clearSession();
  window.localStorage.clear();
});

describe("StudentShell — the sample mark", () => {
  it("marks the chrome while it is showing the fixture's identity", async () => {
    // Signed out: the sidebar really is showing "Ada" and "Year 4". Saying so
    // is what lets the E2E tell this page from a signed-in one.
    renderShell();

    await screen.findByText("content");
    expect(marks()).toContain("student:identity");
  });

  it("does not mark the chrome for a signed-in child", async () => {
    // THE ASSERTION THE E2E RESTS ON. If this ever fails, the suite can no
    // longer tell a real child's console from the walkthrough.
    signIn();
    renderShell();

    await screen.findByText("content");
    expect(marks()).not.toContain("student:identity");
  });

  it("names the surface, so a failure says which screen fell back", async () => {
    renderShell();

    await screen.findByText("content");
    expect(marks().every((m) => Boolean(m && m.trim()))).toBe(true);
  });

  it("changes no layout — the wrapper takes part in none", async () => {
    // A marker that shifted the page is a marker people delete.
    renderShell();

    await screen.findByText("content");
    for (const el of document.querySelectorAll(`[${SAMPLE_ATTR}]`)) {
      expect((el as HTMLElement).style.display).toBe("contents");
    }
  });
});
