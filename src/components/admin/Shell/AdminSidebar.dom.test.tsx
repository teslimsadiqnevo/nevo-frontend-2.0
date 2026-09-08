import { beforeEach, describe, expect, it, vi } from "vitest";
import { render } from "@testing-library/react";
import { AdminSidebar } from "./AdminSidebar";
import { SAMPLE_ATTR } from "@/lib/sampleData";
import { clearSession, setSession } from "@/lib/auth/session";

/**
 * The sidebar's signed-out persona is a FIXTURE - "Mrs. Adebayo" is nobody -
 * and this is the identity block, so a fallback here means the console is
 * showing an invented person to a real one.
 *
 * The end-to-end suite's whole value is one assertion: no sample mark anywhere
 * once signed in. An UNMARKED fallback is invisible to it, so the test walks
 * past reporting success. That is worse than having no test, which is why the
 * mark is asserted here at the component level too rather than trusted to a
 * suite that does not exist yet.
 */

vi.mock("next/navigation", () => ({ usePathname: () => "/admin/dashboard" }));
vi.mock("@/hooks/usePermissions", () => ({
  usePermissions: () => ({
    scopes: ["oversight"],
    resolved: true,
    status: "ready",
    refresh: vi.fn(),
    hasScope: () => true,
  }),
}));
vi.mock("@/lib/api", () => ({
  notificationsApi: { unreadExists: async () => ({ unreadExists: false }) },
}));

const marks = (c: HTMLElement) =>
  Array.from(c.querySelectorAll(`[${SAMPLE_ATTR}]`)).map((el) =>
    el.getAttribute(SAMPLE_ATTR),
  );

beforeEach(() => clearSession());

describe("AdminSidebar sample marking", () => {
  it("marks the fixture persona when nobody is signed in", () => {
    const { container } = render(<AdminSidebar />);
    expect(container.textContent).toMatch(/Mrs\. Adebayo/);
    expect(marks(container)).toContain("admin:sidebar-identity");
  });

  it("shows no fixture, and no mark, once signed in", () => {
    setSession({
      token: "tok",
      expiresAt: new Date(Date.now() + 3600_000).toISOString(),
      userId: "a1",
      role: "senco_admin",
    });
    const { container } = render(<AdminSidebar />);
    expect(container.textContent).not.toMatch(/Mrs\. Adebayo/);
    // The assertion the E2E will make across the whole page.
    expect(marks(container)).toHaveLength(0);
    // The signed-in branch was restructured to lift the fixture out; it must
    // still say what the real admin's scopes are rather than nothing at all.
    expect(container.textContent).toMatch(/oversight|General oversight/i);
  });
});
