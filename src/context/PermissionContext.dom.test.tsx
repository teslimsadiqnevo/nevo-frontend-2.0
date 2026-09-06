import { describe, expect, it, vi, beforeEach, afterEach } from "vitest";
import { act, render, screen, waitFor } from "@testing-library/react";
import { useContext } from "react";
import { PermissionContext, PermissionProvider } from "./PermissionContext";
import { clearSession, setSession } from "@/lib/auth/session";

/**
 * The provider used to run once on `[]` and swallow every failure into an
 * empty scope list, which produced two things a real admin hit on day one:
 * a founding admin whose wizard mounted this layout before login had a rail
 * reading "No access yet" forever, and any 500 or cold-start 502 looked
 * identical to genuinely holding no scopes.
 *
 * So the distinction under test is ANSWER vs ABSENCE. A successful read is
 * final even when it returns nothing; `skipped` and `failed` are re-asked.
 *
 * The trap here is the same shape as `useLiveQuery`'s: the effect starts with
 * `if (!getToken())`, so a test that forgets to sign in exercises the skip
 * path and proves nothing about the fetch. Every test that means to reach the
 * network signs in first, and the skip path is asserted deliberately.
 */

const mockMe = vi.fn();
vi.mock("@/lib/api", () => ({
  permissionsApi: { me: () => mockMe() },
}));

let pathname = "/admin/dashboard";
vi.mock("next/navigation", () => ({
  usePathname: () => pathname,
}));

function Probe() {
  const ctx = useContext(PermissionContext);
  return (
    <>
      <span data-testid="status">{ctx?.status}</span>
      <span data-testid="scopes">{(ctx?.scopes ?? []).join(",")}</span>
      <button type="button" onClick={() => ctx?.refresh()}>
        refresh
      </button>
    </>
  );
}

const signIn = () =>
  setSession({
    token: "tok-test",
    expiresAt: new Date(Date.now() + 3600_000).toISOString(),
    userId: "admin-1",
    role: "senco_admin",
  });

const renderProvider = () =>
  render(
    <PermissionProvider>
      <Probe />
    </PermissionProvider>,
  );

beforeEach(() => {
  pathname = "/admin/dashboard";
  mockMe.mockReset();
  clearSession();
});
afterEach(() => clearSession());

describe("PermissionProvider", () => {
  it("a failed read is 'failed', never an empty scope list", async () => {
    signIn();
    mockMe.mockRejectedValue(new Error("500"));
    renderProvider();

    await waitFor(() =>
      expect(screen.getByTestId("status").textContent).toBe("failed"),
    );
    // The distinction the rail depends on: this must NOT look like an answer.
    expect(screen.getByTestId("status").textContent).not.toBe("ready");
    expect(screen.getByTestId("scopes").textContent).toBe("");
  });

  it("re-asks after a failure when refresh() is called", async () => {
    signIn();
    mockMe.mockRejectedValueOnce(new Error("502 cold start"));
    renderProvider();
    await waitFor(() =>
      expect(screen.getByTestId("status").textContent).toBe("failed"),
    );

    mockMe.mockResolvedValueOnce({ scopes: ["oversight", "roster"] });
    await act(async () => {
      screen.getByText("refresh").click();
    });

    await waitFor(() =>
      expect(screen.getByTestId("status").textContent).toBe("ready"),
    );
    expect(screen.getByTestId("scopes").textContent).toBe("oversight,roster");
  });

  it("mounted without a session, then re-asks once one exists and the route changes", async () => {
    // The founding admin: the onboarding wizard mounts the admin layout before
    // login has completed, so the first pass finds no token.
    mockMe.mockResolvedValue({ scopes: ["oversight"] });
    const view = renderProvider();

    await waitFor(() =>
      expect(screen.getByTestId("status").textContent).toBe("skipped"),
    );
    expect(mockMe).not.toHaveBeenCalled();

    // They finish the wizard and click through to their dashboard.
    signIn();
    pathname = "/admin/dashboard?welcome=1";
    view.rerender(
      <PermissionProvider>
        <Probe />
      </PermissionProvider>,
    );

    await waitFor(() =>
      expect(screen.getByTestId("status").textContent).toBe("ready"),
    );
    expect(screen.getByTestId("scopes").textContent).toBe("oversight");
  });

  it("a successful empty answer is final and navigation does not re-ask it", async () => {
    signIn();
    mockMe.mockResolvedValue({ scopes: [] });
    const view = renderProvider();

    await waitFor(() =>
      expect(screen.getByTestId("status").textContent).toBe("ready"),
    );
    expect(mockMe).toHaveBeenCalledTimes(1);

    pathname = "/admin/classes";
    view.rerender(
      <PermissionProvider>
        <Probe />
      </PermissionProvider>,
    );
    await waitFor(() =>
      expect(screen.getByTestId("status").textContent).toBe("ready"),
    );
    // An answer of "no scopes" is a real answer - re-asking on every
    // navigation would be a request per route change for that admin.
    expect(mockMe).toHaveBeenCalledTimes(1);
  });

  it("a failure costs exactly one request, not two", async () => {
    // Regression: `status` was in the effect's dependency array, so settling to
    // "failed" changed a dep, re-ran the effect and fired a SECOND request for
    // every failure - doubling load on a backend that was already struggling.
    // The guard is a ref now precisely so it cannot wake the effect.
    signIn();
    mockMe.mockRejectedValue(new Error("500"));
    renderProvider();

    await waitFor(() =>
      expect(screen.getByTestId("status").textContent).toBe("failed"),
    );
    await new Promise((r) => setTimeout(r, 50));
    expect(mockMe).toHaveBeenCalledTimes(1);
  });

  it("drops scope strings the frontend does not know", async () => {
    signIn();
    mockMe.mockResolvedValue({ scopes: ["oversight", "not_a_real_scope"] });
    renderProvider();

    await waitFor(() =>
      expect(screen.getByTestId("status").textContent).toBe("ready"),
    );
    expect(screen.getByTestId("scopes").textContent).toBe("oversight");
  });
});
