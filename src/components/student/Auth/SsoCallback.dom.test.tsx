import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { cleanup, render, screen, waitFor } from "@testing-library/react";
import { SsoCallback } from "./SsoCallback";
import { clearSession, getSession } from "@/lib/auth/session";

/**
 * The defect this pins: a REAL identity-provider handshake was signed into a
 * FABRICATED account.
 *
 * `code` and `state` were handed to `resolveMockSso`, which ignored both and
 * invented `{ id: "sso-<random>", schoolId: "school-demo" }`. `signIn()` was
 * called on that, so `AuthContext` reported `authenticated` - but no token was
 * ever stored, so `useHasSession()` stayed false and every screen the child
 * opened rendered fixtures. A school signing in through an identity provider
 * would have onboarded every one of its children into an account that did not
 * exist.
 *
 * So the assertion that matters is not "it says You're in". It is that a
 * SESSION EXISTS afterwards, with the server's own token in it - the thing the
 * old code never produced and the thing every later screen depends on.
 */

const { ssoCallback, signIn, push, replace, params } = vi.hoisted(() => ({
  ssoCallback: vi.fn(),
  signIn: vi.fn(),
  push: vi.fn(),
  replace: vi.fn(),
  params: new URLSearchParams(),
}));

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push, replace }),
  useSearchParams: () => params,
}));
vi.mock("@/lib/api/auth", () => ({ authApi: { ssoCallback } }));
vi.mock("@/hooks", () => ({
  useAuth: () => ({ signIn }),
  useSignals: () => ({ trackEvent: vi.fn() }),
}));

const setUrl = (q: string) => {
  [...params.keys()].forEach((k) => params.delete(k));
  new URLSearchParams(q).forEach((v, k) => params.set(k, v));
};

beforeEach(() => {
  vi.clearAllMocks();
  clearSession();
  setUrl("");
});

afterEach(() => {
  cleanup();
  clearSession();
});

describe("student SsoCallback", () => {
  it("stores the server's own session for a real handshake", async () => {
    setUrl("provider=microsoft&code=real-code&state=real-state");
    ssoCallback.mockResolvedValue({
      access_token: "server-token",
      token_type: "bearer",
      expires_at: new Date(Date.now() + 3600_000).toISOString(),
      user_id: "student-77",
      role: "student",
      destination: "/student/onboarding/sequence",
    });

    render(<SsoCallback />);

    await waitFor(() => expect(getSession()).not.toBeNull());
    // The token is the whole point: without it `useHasSession()` is false and
    // every screen falls back to fixtures behind an "authenticated" flag.
    expect(getSession()?.token).toBe("server-token");
    expect(getSession()?.userId).toBe("student-77");
    expect(ssoCallback).toHaveBeenCalledWith({
      provider: "microsoft",
      code: "real-code",
      state: "real-state",
    });
    // No invented school: `users/me` is what knows it, once the session exists.
    expect(signIn).toHaveBeenCalledWith(
      expect.objectContaining({
        id: "student-77",
        schoolId: "",
        method: "sso",
      }),
    );
  });

  it("signs nobody in when the provider sent no handshake", async () => {
    render(<SsoCallback />);

    await waitFor(() =>
      expect(screen.getByText(/couldn.t sign you in/i)).toBeTruthy(),
    );
    expect(ssoCallback).not.toHaveBeenCalled();
    expect(signIn).not.toHaveBeenCalled();
    expect(getSession()).toBeNull();
  });

  it("signs nobody in when the handshake is refused", async () => {
    setUrl("provider=microsoft&code=bad&state=bad");
    ssoCallback.mockRejectedValue(new Error("401"));

    render(<SsoCallback />);

    await waitFor(() =>
      expect(screen.getByText(/couldn.t sign you in/i)).toBeTruthy(),
    );
    expect(signIn).not.toHaveBeenCalled();
    expect(getSession()).toBeNull();
  });

  it("does not accept a partial handshake", async () => {
    // The contract requires all three. Two of them is not a handshake, and the
    // old default-to-success path is exactly how that became an account.
    setUrl("provider=microsoft&code=real-code");

    render(<SsoCallback />);

    await waitFor(() =>
      expect(screen.getByText(/couldn.t sign you in/i)).toBeTruthy(),
    );
    expect(ssoCallback).not.toHaveBeenCalled();
    expect(getSession()).toBeNull();
  });
});
