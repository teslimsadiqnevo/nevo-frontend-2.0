import { beforeEach, describe, expect, it, vi } from "vitest";
import { fireEvent, render, screen } from "@testing-library/react";

const { push, loginPassword, signIn } = vi.hoisted(() => ({
  push: vi.fn(),
  loginPassword: vi.fn(),
  signIn: vi.fn(),
}));

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push, replace: push, prefetch: vi.fn() }),
  useSearchParams: () => new URLSearchParams(),
}));
vi.mock("@/lib/api/auth", () => ({ authApi: { loginPassword } }));
// The screen reads `signIn` off the auth context. Mocking the hook is lighter
// than wrapping every render in a provider, and nothing here exercises it.
vi.mock("@/hooks", () => ({ useAuth: () => ({ signIn, status: "guest", user: null, signOut: vi.fn() }) }));

import { TeacherSignIn } from "./TeacherSignIn";

/**
 * The "Continue with school SSO" control.
 *
 * It used to hold a spinner reading "Taking you to Microsoft…" for 1.4 seconds
 * and then push to `/auth/teacher/sso-callback` with no provider, code or
 * state - precisely the shape that callback renders its ERROR phase for. So the
 * most prominent secondary control on the first screen a school sees mimed a
 * handoff to a named provider and then failed, every time.
 *
 * It cannot be wired from here: `POST /auth/sso/start` needs a `schoolSlug`
 * that nothing pre-auth yields, and nothing in the API creates an SSO
 * connection at all. So the property worth pinning is that this button NEVER
 * claims to be doing something it cannot do.
 */

beforeEach(() => {
  push.mockReset();
  loginPassword.mockReset();
  signIn.mockReset();
});

const clickSso = () =>
  fireEvent.click(screen.getByRole("button", { name: /Continue with school SSO/i }));

describe("the school SSO button", () => {
  it("navigates nowhere, even after the delay the old hop used", () => {
    // FAKE TIMERS MATTER HERE. The bug deferred its push by 1.4s, so a
    // synchronous "push not called" assertion passes against the bug - it was
    // true, just not yet. Checked by reintroducing the real thing: without
    // advancing the clock this test stayed green while the hop was back.
    vi.useFakeTimers();
    try {
      render(<TeacherSignIn />);
      clickSso();
      expect(push).not.toHaveBeenCalled();

      vi.advanceTimersByTime(5000);
      expect(push).not.toHaveBeenCalled();
    } finally {
      vi.useRealTimers();
    }
  });

  it("names no provider it has not actually reached", () => {
    // "Taking you to Microsoft…" was invented copy for a handoff that never
    // happened, on a screen where the school knows which provider they use.
    render(<TeacherSignIn />);
    clickSso();

    expect(screen.queryByText(/Microsoft/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/Taking you to/i)).not.toBeInTheDocument();
  });

  it("says plainly that school sign-in is not set up", () => {
    render(<TeacherSignIn />);
    clickSso();

    expect(screen.getByText(/School sign-in isn't set up for Nevo yet/i)).toBeInTheDocument();
  });

  it("is never a dead end - it points at the route that works", () => {
    // A teacher who taps this still has to get into their console today.
    render(<TeacherSignIn />);
    clickSso();

    expect(screen.getByText(/Use your email and password for now/i)).toBeInTheDocument();
    expect(screen.getByText(/school admin can tell you when that changes/i)).toBeInTheDocument();
  });

  it("leaves the password form usable underneath", () => {
    // The notice must not replace the screen: the thing it tells you to do
    // has to still be there when you have read it.
    render(<TeacherSignIn />);
    clickSso();

    expect(screen.getByRole("button", { name: /^Sign in$/i })).toBeInTheDocument();
  });

  it("does not attempt a sign-in", () => {
    render(<TeacherSignIn />);
    clickSso();

    expect(loginPassword).not.toHaveBeenCalled();
  });
});
