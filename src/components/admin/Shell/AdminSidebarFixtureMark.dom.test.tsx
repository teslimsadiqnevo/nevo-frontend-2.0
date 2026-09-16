import { describe, expect, it, vi, beforeEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";

/**
 * THE FIXTURE IDENTITY WAS ONLY HALF MARKED, AND THE UNMARKED HALF WAS THE ONE
 * THE CONSOLE ACTUALLY SHIPPED.
 *
 * `SampleRegion kind="admin:sidebar-identity"` wrapped the name block — which
 * renders only when the rail is `expanded`. The avatar disc's hardcoded "AA"
 * sat outside it. The rail collapses below 1280px and EVERY admin frame is
 * drawn at 1024, so at the console's own target width the entire invented
 * identity a viewer met was an unmarked "AA", and
 * `e2e/admin-signed-in.spec.ts`'s `[data-nevo-sample]` assertion could not see
 * it.
 *
 * Second defect in the same block: the persona was gated on `useHasSession()`
 * alone. That hook's server snapshot is hardcoded false, so the server markup
 * and the first client frame of a genuinely signed-in admin rendered
 * "Mrs. Adebayo · Proprietor". Every student surface added a `useHydrated`
 * guard for exactly this; this rail had not.
 */

const { hasSession, hydrated } = vi.hoisted(() => ({
  hasSession: vi.fn(),
  hydrated: vi.fn(),
}));

vi.mock("@/hooks/useHasSession", () => ({ useHasSession: () => hasSession() }));
vi.mock("@/hooks/useHydrated", () => ({ useHydrated: () => hydrated() }));
vi.mock("@/hooks/useCurrentUser", () => ({ useCurrentUser: () => null }));
vi.mock("@/hooks/usePermissions", () => ({
  usePermissions: () => ({
    scopes: ["oversight"],
    resolved: true,
    status: "ready" as const,
    refresh: () => {},
    hasScope: () => true,
  }),
}));
vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: () => {}, replace: () => {}, refresh: () => {} }),
  usePathname: () => "/admin",
}));
vi.mock("@/lib/api/notifications", async (importOriginal) => {
  const actual =
    await importOriginal<typeof import("@/lib/api/notifications")>();
  return {
    ...actual,
    notificationsApi: {
      ...actual.notificationsApi,
      unreadCount: async () => 0,
      list: async () => ({
        notifications: [],
        unreadCount: 0,
        total: 0,
        hasMore: false,
      }),
    },
  };
});

import { AdminSidebar } from "./AdminSidebar";

/**
 * jsdom's `matchMedia` answers `matches: false` to everything, so the default
 * render here is the COLLAPSED rail — which is the state this file cares
 * about, and the state every admin frame is drawn in.
 */
function setViewport(expanded: boolean) {
  window.matchMedia = ((query: string) =>
    ({
      matches: expanded,
      media: query,
      onchange: null,
      addListener: () => {},
      removeListener: () => {},
      addEventListener: () => {},
      removeEventListener: () => {},
      dispatchEvent: () => false,
    }) as unknown as MediaQueryList) as typeof window.matchMedia;
}

beforeEach(() => {
  hasSession.mockReset();
  hydrated.mockReset();
  setViewport(false);
});

/** Everything the E2E's `[data-nevo-sample]` assertion can actually see. */
const marked = () =>
  Array.from(document.querySelectorAll("[data-nevo-sample]"))
    .map((n) => n.textContent ?? "")
    .join(" ");

describe("the collapsed rail — the width every admin frame is drawn at", () => {
  it("marks the fixture initials, which used to sit outside the region", async () => {
    hasSession.mockReturnValue(false);
    hydrated.mockReturnValue(true);
    render(<AdminSidebar />);

    await waitFor(() => expect(screen.getByText("AA")).toBeInTheDocument());
    // The defect: "AA" rendered, and nothing marked it.
    expect(marked()).toContain("AA");
  });

  it("leaves no invented identity outside the mark", async () => {
    hasSession.mockReturnValue(false);
    hydrated.mockReturnValue(true);
    render(<AdminSidebar />);

    await waitFor(() => expect(screen.getByText("AA")).toBeInTheDocument());
    const region = document.querySelector("[data-nevo-sample]");
    expect(region).not.toBeNull();
    expect(region?.textContent).toContain("AA");
  });
});

describe("the expanded rail", () => {
  it("marks the disc and the name together, as one region", async () => {
    hasSession.mockReturnValue(false);
    hydrated.mockReturnValue(true);
    setViewport(true);
    render(<AdminSidebar />);

    await waitFor(() =>
      expect(screen.getByText("Mrs. Adebayo")).toBeInTheDocument(),
    );
    const text = marked();
    expect(text).toContain("AA");
    expect(text).toContain("Mrs. Adebayo");
  });
});

describe("before hydration", () => {
  it("shows no invented person to a signed-in admin's first frame", async () => {
    // `useHasSession` answers false until the client runs. Gating on it alone
    // is what put "Mrs. Adebayo" in the server markup of a real admin's page.
    hasSession.mockReturnValue(false);
    hydrated.mockReturnValue(false);
    setViewport(true);
    render(<AdminSidebar />);

    // Anchor on the identity control itself, which exists in every state, so
    // the absences below are asserted against a rail that has fully rendered.
    await screen.findByRole("button", { name: /Account and sign out/i });
    expect(screen.queryByText("Mrs. Adebayo")).not.toBeInTheDocument();
    expect(screen.queryByText("AA")).not.toBeInTheDocument();
    expect(document.querySelector("[data-nevo-sample]")).toBeNull();
  });
});

describe("a signed-in admin", () => {
  it("meets no fixture identity and no mark at all", async () => {
    hasSession.mockReturnValue(true);
    hydrated.mockReturnValue(true);
    setViewport(true);
    render(<AdminSidebar />);

    await waitFor(() =>
      expect(screen.queryByText("Mrs. Adebayo")).not.toBeInTheDocument(),
    );
    expect(screen.queryByText("AA")).not.toBeInTheDocument();
    // The whole point of the mark: this is what the E2E asserts is empty.
    expect(document.querySelector("[data-nevo-sample]")).toBeNull();
  });
});
