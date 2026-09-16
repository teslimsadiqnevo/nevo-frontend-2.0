import { beforeEach, describe, expect, it, vi } from "vitest";
import { fireEvent, render, screen } from "@testing-library/react";
import { ApiError } from "@/lib/api/client";

const { push, loginPassword, signIn } = vi.hoisted(() => ({
  push: vi.fn(),
  loginPassword: vi.fn(),
  signIn: vi.fn(),
}));

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push, replace: push, prefetch: vi.fn() }),
  useSearchParams: () => new URLSearchParams(),
}));
vi.mock("@/lib/api", () => ({ authApi: { loginPassword } }));
// The screen reads `signIn` off the auth context; mocking the hook is lighter
// than wrapping every render in a provider, and nothing here exercises it.
vi.mock("@/hooks", () => ({
  useAuth: () => ({ signIn, status: "guest", user: null, signOut: vi.fn() }),
}));

import { AdminSignIn } from "./AdminSignIn";

/**
 * What a failed sign-in TELLS an administrator.
 *
 * Until now this door mapped every 401 and 403 to "We couldn't sign you in
 * with those details. Check them and try again" - and then relabelled the
 * primary button "Try again". So a proprietor whose account had been paused,
 * typing the CORRECT password, was told to check it and handed a control that
 * would refuse them again for as long as they kept pressing it. A rate-limited
 * admin was told the same, which is the one instruction that extends a
 * lockout.
 *
 * `classifyLoginFailure` already parsed the three documented cases, was
 * already tested, and was already role-neutral. Both student doors and the
 * teacher door used it; this was the last one that did not.
 *
 * These assert on the MESSAGE and the BUTTON, because those are the defect.
 * Asserting that sign-in failed would have passed throughout.
 */

beforeEach(() => {
  push.mockReset();
  loginPassword.mockReset();
  signIn.mockReset();
});

const submit = () => {
  render(<AdminSignIn />);
  fireEvent.change(screen.getByLabelText("Email"), {
    target: { value: "head@brightgate.edu.ng" },
  });
  fireEvent.change(screen.getByLabelText("Password"), {
    target: { value: "a-password" },
  });
  fireEvent.click(screen.getByRole("button", { name: /^Sign in$/i }));
};

const fail = (status: number, code?: string) =>
  loginPassword.mockRejectedValueOnce(
    new ApiError(status, "no", code ? { detail: { code } } : {}),
  );

const primary = () =>
  screen.getByRole("button", { name: /^(Sign in|Try again)$/i });

describe("a paused account", () => {
  it("is not told the password was wrong", async () => {
    fail(401, "account_paused");
    submit();

    expect(await screen.findByText(/isn.t open at the moment/i)).toBeInTheDocument();
    expect(screen.queryByText(/Check them and try again/i)).not.toBeInTheDocument();
  });

  it("is not invited to retry, by the message or by the button", async () => {
    // The retry is the thing that cannot work. The button is the more
    // dangerous half: the copy can say one thing while the control says "Try
    // again" directly beneath it.
    fail(401, "account_paused");
    submit();

    await screen.findByText(/isn.t open at the moment/i);
    expect(primary()).toHaveTextContent(/^Sign in$/);
  });

  it("names a colleague first, then a route that exists for a sole proprietor", async () => {
    // "Your school admin can tell you more" is the teacher line and it is a
    // circle here - a proprietor IS the school admin. The refusal does not say
    // which kind of admin this is, so the line has to serve both.
    fail(401, "account_paused");
    submit();

    const msg = await screen.findByText(/isn.t open at the moment/i);
    expect(msg).toHaveTextContent(/Another administrator at your school/i);
    expect(
      screen.getByRole("link", { name: /support@nevolearning\.com/i }),
    ).toHaveAttribute("href", "mailto:support@nevolearning.com");
  });

  it("is reached by a 403 as well as a 401", async () => {
    // Backend enforces withdrawal with a 403 on some routes and a 401 here;
    // the old branch already treated the pair alike and that part was right.
    fail(403, "account_paused");
    submit();

    expect(await screen.findByText(/isn.t open at the moment/i)).toBeInTheDocument();
  });
});

describe("a rate-limited account", () => {
  it("is told to wait, and the button stops saying Try again", async () => {
    fail(401, "too_many_attempts");
    submit();

    expect(await screen.findByText(/too many attempts/i)).toHaveTextContent(
      /wait a few minutes/i,
    );
    expect(primary()).toHaveTextContent(/^Sign in$/);
  });
});

describe("an ordinary wrong password", () => {
  it("still says D02's line, and still offers the retry", async () => {
    // The fix must not cost the case the screen was designed around.
    fail(401);
    submit();

    expect(
      await screen.findByText(/We couldn't sign you in with those details/i),
    ).toBeInTheDocument();
    expect(primary()).toHaveTextContent(/^Try again$/);
  });

  it("covers an unrecognised code too, rather than guessing", async () => {
    fail(401, "some_future_code");
    submit();

    expect(
      await screen.findByText(/We couldn't sign you in with those details/i),
    ).toBeInTheDocument();
  });
});

describe("a failure that is ours", () => {
  it("blames neither the administrator nor their account", async () => {
    fail(500);
    submit();

    expect(
      await screen.findByText(/Nothing on your end/i),
    ).toBeInTheDocument();
    expect(screen.queryByText(/isn.t open at the moment/i)).not.toBeInTheDocument();
    expect(
      screen.queryByText(/Check them and try again/i),
    ).not.toBeInTheDocument();
  });

  it("keeps the retry, because a retry is exactly what a 500 deserves", async () => {
    fail(500);
    submit();

    await screen.findByText(/Nothing on your end/i);
    expect(primary()).toHaveTextContent(/^Try again$/);
  });
});
