import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import { ConsoleSessionExpired } from "./ConsoleSessionExpired";

/**
 * The shared teacher/admin session-end screen, now carrying a reason.
 *
 * It took only `signInHref` and always said "sessions expire after a period of
 * inactivity for your security" - true of `session_expired`, and false of the
 * four other codes the backend documents on the same 401.
 */

describe("the default", () => {
  it("behaves exactly as before for a caller that passes no reason", () => {
    // Every existing call site is untouched by this change; that is deliberate.
    render(<ConsoleSessionExpired signInHref="/auth/teacher" />);

    expect(screen.getByText("Your session has ended.")).toBeInTheDocument();
    expect(screen.getByText(/inactivity/i)).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /sign in/i })).toHaveAttribute(
      "href",
      "/auth/teacher",
    );
  });
});

describe("a revoked session", () => {
  it("keeps the headline and drops the inactivity line", () => {
    // A session an administrator ended did not time out, and saying it did
    // sends someone looking for a setting to change.
    render(<ConsoleSessionExpired signInHref="/auth/teacher" reason="revoked" />);

    expect(screen.getByText("Your session has ended.")).toBeInTheDocument();
    expect(screen.queryByText(/inactivity/i)).not.toBeInTheDocument();
    expect(screen.getByRole("link", { name: /sign in/i })).toBeInTheDocument();
  });
});

describe("a session replaced on another device", () => {
  it("says so plainly", () => {
    render(<ConsoleSessionExpired signInHref="/auth/teacher" reason="replaced" />);

    expect(screen.getByText(/another device/i)).toBeInTheDocument();
    expect(screen.queryByText(/inactivity/i)).not.toBeInTheDocument();
  });

  it("tells them what to do if it was not them", () => {
    // The reason this state is drawn separately at all.
    render(<ConsoleSessionExpired signInHref="/auth/teacher" reason="replaced" />);

    expect(screen.getByText(/wasn’t you/i)).toBeInTheDocument();
    expect(screen.getByText(/school administrator/i)).toBeInTheDocument();
  });
});

describe("a paused account", () => {
  it("is not dressed as a session ending", () => {
    render(<ConsoleSessionExpired signInHref="/auth/teacher" reason="paused" />);

    expect(screen.getByText(/on pause/i)).toBeInTheDocument();
    expect(screen.queryByText("Your session has ended.")).not.toBeInTheDocument();
    expect(screen.queryByText(/inactivity/i)).not.toBeInTheDocument();
  });

  it("offers NO sign-in button, because retrying does nothing", () => {
    // Design was explicit. A control that cannot work is worse than none: it
    // invites a locked-out teacher to press the one thing guaranteed to fail.
    render(<ConsoleSessionExpired signInHref="/auth/teacher" reason="paused" />);

    expect(screen.queryByRole("link", { name: /sign in/i })).not.toBeInTheDocument();
  });

  it("points a staff member at the school administrator, never their teacher", () => {
    // The learner frame this mirrors says "talk to your teacher", which is not
    // a sentence to show a teacher. That is why the screen was blocked before.
    render(<ConsoleSessionExpired signInHref="/auth/teacher" reason="paused" />);

    expect(screen.getByText(/school administrator/i)).toBeInTheDocument();
    expect(screen.queryByText(/talk to your teacher/i)).not.toBeInTheDocument();
  });
});
