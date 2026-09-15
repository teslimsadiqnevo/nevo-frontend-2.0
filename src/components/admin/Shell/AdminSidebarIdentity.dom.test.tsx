import { describe, expect, it, vi, beforeEach } from "vitest";
import { render, waitFor } from "@testing-library/react";
import { visibleText } from "@/test/visibleText";
import { AdminSidebar } from "./AdminSidebar";

/**
 * THE ONE PLACE THAT SAYS WHO YOU ARE SAID ONLY WHAT YOU MAY DO.
 *
 * The identity block rendered a generic person glyph over a scope summary, on
 * a justification this file recorded and which had already been corrected
 * elsewhere: the teacher console reads the same hook and has shown a name and
 * initials since 1 September.
 */

const identity = vi.fn();

vi.mock("@/hooks/useCurrentUser", () => ({
  useCurrentUser: () => identity(),
}));

vi.mock("@/hooks/usePermissions", () => ({
  usePermissions: () => ({
    scopes: ["oversight"],
    resolved: true,
    status: "ready" as const,
    refresh: () => {},
    hasScope: () => true,
  }),
}));

vi.mock("@/hooks/useHasSession", () => ({ useHasSession: () => true }));

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

/**
 * jsdom ships a `matchMedia` that answers `matches: false` to everything, so
 * without this every test here renders the COLLAPSED rail - where the identity
 * block is initials alone and no name is drawn at all. The viewport has to be
 * stated rather than inherited.
 */
beforeEach(() => {
  window.matchMedia = ((query: string) =>
    ({
      matches: true,
      media: query,
      onchange: null,
      addEventListener: () => {},
      removeEventListener: () => {},
      addListener: () => {},
      removeListener: () => {},
      dispatchEvent: () => false,
    }) as unknown as MediaQueryList) as typeof window.matchMedia;
  identity.mockReset();
  identity.mockReturnValue({ name: "Folake Adebayo", initials: "FA" });
});

describe("the admin identity block", () => {
  it("names the signed-in admin and shows their initials", async () => {
    const { container } = render(<AdminSidebar />);
    await waitFor(() =>
      expect(visibleText(container)).toMatch(/Folake Adebayo/),
    );
    expect(visibleText(container)).toMatch(/\bFA\b/);
  });

  it("keeps the scope line underneath rather than instead", async () => {
    // It is the second thing an admin checks here, and it is what tells two
    // admins at the same school apart.
    const { container } = render(<AdminSidebar />);
    await waitFor(() =>
      expect(visibleText(container)).toMatch(/Folake Adebayo/),
    );
    expect(visibleText(container)).toMatch(/oversight/i);
  });

  it("falls back to the scope line when we have no name", async () => {
    // No name means no initials; the block must not go blank, and it must not
    // put an invented person in front of a real one.
    identity.mockReturnValue(null);
    const { container } = render(<AdminSidebar />);
    await waitFor(() => expect(visibleText(container)).toMatch(/oversight/i));
    expect(visibleText(container)).not.toMatch(/Mrs\. Adebayo/);
  });
});

describe("the rail", () => {
  it("scrolls its nav list, not itself", async () => {
    // With the overflow on the aside, a rail taller than the viewport pushed
    // Notifications, Collapse and the account block below the fold at
    // 1024x768 - every persistent control in the console.
    const { container } = render(<AdminSidebar />);
    await waitFor(() => expect(container.querySelector("aside")).toBeTruthy());
    const aside = container.querySelector("aside")!;
    const nav = container.querySelector("nav")!;
    expect(aside.className).toContain("overflow-hidden");
    expect(aside.className).not.toContain("overflow-y-auto");
    expect(nav.className).toContain("overflow-y-auto");
    expect(nav.className).toContain("min-h-0");
  });

  it("says which console this is", async () => {
    const { container } = render(<AdminSidebar />);
    await waitFor(() => expect(visibleText(container)).toMatch(/Admin/));
  });
});
