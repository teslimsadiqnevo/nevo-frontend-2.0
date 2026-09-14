import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { act, fireEvent, render, screen } from "@testing-library/react";
import { ReturningSignInScreen } from "./ReturningSignInScreen";
import { ApiError } from "@/lib/api/client";
import { clearSession, getRememberedProfile } from "@/lib/auth/session";

/**
 * The door that was not there.
 *
 * A device remembers exactly one child. When it remembered nobody - a cleared
 * browser, a new tablet, a reimaged school laptop, or a shared tablet where
 * another child onboarded after them - `/auth/login` sent the child into
 * ONBOARDING, which creates a second account: new identifier, no history, and a
 * class they may not be able to rejoin. Nothing told them or their teacher.
 *
 * So the load-bearing assertions here are not "the form submits". They are:
 * the device is REMEMBERED afterwards (or the child is back here tomorrow), the
 * fields are KEPT on a failure (or a child retypes a username they were read
 * out), and a paused account is never rendered as a typing mistake.
 */

/*
 * The default 5s timeout is not enough for this file, and the reason is worth
 * writing down rather than being rediscovered as a flake.
 *
 * The mock below spreads the REAL `@/lib/api` barrel, which imports every api
 * module in the app. That costs several seconds on a cold worker - fine in
 * isolation, where it happens before the first test is timed, but in a full-suite
 * run the worker is contended and the FIRST test wears it. It timed out at
 * 6.0s against a 5s limit, and every later test in the file then failed with
 * "Unable to find an accessible element" because cleanup never ran.
 *
 * Spreading the real barrel is still right - a hand-written one leaves every
 * other export undefined and kills the worker outright with SIGABRT. So the
 * cost is paid deliberately, not designed away.
 */
vi.setConfig({ testTimeout: 30_000 });

const { loginPin, signIn } = vi.hoisted(() => ({
  loginPin: vi.fn(),
  signIn: vi.fn(),
}));
vi.mock("@/lib/api", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/lib/api")>();
  return { ...actual, authApi: { ...actual.authApi, loginPin } };
});
vi.mock("@/hooks", () => ({ useAuth: () => ({ signIn }) }));

const push = vi.hoisted(() => vi.fn());
vi.mock("next/navigation", () => ({
  useRouter: () => ({ push, replace: vi.fn(), back: vi.fn() }),
}));

const SESSION = {
  access_token: "tok",
  expires_at: new Date(Date.now() + 3600_000).toISOString(),
  user_id: "student-1",
  role: "student",
};

/** The 401 body FastAPI actually sends. */
const refusal = (code: string) =>
  new ApiError(401, "Unauthorized", { detail: { code, message: "no" } });

function fill({ school = "751A1136", user = "amara.k" } = {}) {
  const [schoolField, userField] = screen.getAllByRole("textbox");
  fireEvent.change(schoolField, { target: { value: school } });
  fireEvent.change(userField, { target: { value: user } });
  for (const d of ["1", "2", "3", "4", "5", "6"]) {
    fireEvent.click(screen.getByRole("button", { name: d }));
  }
}

const signInNow = async () => {
  fireEvent.click(screen.getByRole("button", { name: "Sign in" }));
  await act(async () => {
    await vi.advanceTimersByTimeAsync(50);
  });
};

beforeEach(() => {
  vi.useFakeTimers();
  loginPin.mockReset();
  signIn.mockReset();
  push.mockReset();
  clearSession();
  window.localStorage.clear();
});

afterEach(() => {
  vi.useRealTimers();
  window.localStorage.clear();
});

describe("ReturningSignInScreen — signing back in", () => {
  it("sends exactly what the contract takes", async () => {
    loginPin.mockResolvedValue(SESSION);
    render(<ReturningSignInScreen />);
    fill();

    await signInNow();

    expect(loginPin).toHaveBeenCalledWith({
      school_code: "751A1136",
      login_identifier: "amara.k",
      pin: "123456",
    });
  });

  it("remembers the device, so tomorrow is one tap", async () => {
    // THE WHOLE POINT. Without this the child is back on this form every
    // morning, and the PIN unlock screen never has a profile to unlock.
    loginPin.mockResolvedValue(SESSION);
    render(<ReturningSignInScreen />);
    fill();

    await signInNow();

    expect(getRememberedProfile()).toMatchObject({
      schoolCode: "751A1136",
      loginIdentifier: "amara.k",
    });
  });

  it("does not stay on the form once it has worked", async () => {
    loginPin.mockResolvedValue(SESSION);
    render(<ReturningSignInScreen />);
    fill();

    await signInNow();

    expect(screen.getByText(/Welcome back/)).toBeVisible();
  });

  it("goes where the child was headed, not always to the dashboard", async () => {
    // The proxy bounces a signed-out child off the route they wanted; losing it
    // drops them on Home having asked for a lesson.
    loginPin.mockResolvedValue(SESSION);
    render(<ReturningSignInScreen next="/student/lessons/frac-3" />);
    fill();
    await signInNow();

    await act(async () => {
      await vi.advanceTimersByTimeAsync(1500);
    });

    expect(push).toHaveBeenCalledWith("/student/lessons/frac-3");
  });

  it("will not submit until all three are there", () => {
    render(<ReturningSignInScreen />);
    const [schoolField] = screen.getAllByRole("textbox");
    fireEvent.change(schoolField, { target: { value: "751A1136" } });

    fireEvent.click(screen.getByRole("button", { name: "Sign in" }));

    expect(loginPin).not.toHaveBeenCalled();
  });
});

describe("ReturningSignInScreen — when it does not work", () => {
  it("keeps the code and username, and clears only the PIN", async () => {
    // From the frame: "fields stay filled". A child has just been read a school
    // code and a username by their teacher; making them ask again is how you
    // lose them at the last step.
    loginPin.mockRejectedValue(refusal("authentication_failed"));
    render(<ReturningSignInScreen />);
    fill();

    await signInNow();

    const [schoolField, userField] = screen.getAllByRole("textbox");
    expect(schoolField).toHaveValue("751A1136");
    expect(userField).toHaveValue("amara.k");
    expect(screen.getByText(/didn't match/)).toBeVisible();
  });

  it("tells a paused child their account is on pause", async () => {
    // Same distinction as the PIN unlock. Here it matters more: this child has
    // just typed three things correctly.
    loginPin.mockRejectedValue(refusal("account_paused"));
    render(<ReturningSignInScreen />);
    fill();

    await signInNow();

    expect(screen.getByText(/Your Nevo account is on pause/)).toBeVisible();
    expect(screen.queryByText(/didn't match/)).toBeNull();
  });

  it("does not remember a device it failed to sign into", async () => {
    // Remembering here would send the child to a PIN unlock for an account they
    // never proved was theirs.
    loginPin.mockRejectedValue(refusal("authentication_failed"));
    render(<ReturningSignInScreen />);
    fill();

    await signInNow();

    expect(getRememberedProfile()).toBeNull();
  });

  it("blames itself for a server fault", async () => {
    loginPin.mockRejectedValue(new ApiError(500, "Server Error"));
    render(<ReturningSignInScreen />);
    fill();

    await signInNow();

    expect(screen.getByText(/that's on us, not you/)).toBeVisible();
  });

  it("does not tell a rate-limited child they typed it wrong", async () => {
    loginPin.mockRejectedValue(refusal("too_many_attempts"));
    render(<ReturningSignInScreen />);
    fill();

    await signInNow();

    expect(screen.getByText(/a lot of tries in a row/)).toBeVisible();
  });
});

describe("ReturningSignInScreen — the child who really is new", () => {
  it("still has a way to create an account", async () => {
    // `/auth/login` used to send everyone with no remembered profile into
    // onboarding. Now it comes here, so this is the only remaining route to
    // onboarding - the landing page has no student door at all.
    render(<ReturningSignInScreen />);

    fireEvent.click(screen.getByRole("button", { name: /new to Nevo/i }));

    expect(push).toHaveBeenCalledWith("/student/onboarding");
  });
});
