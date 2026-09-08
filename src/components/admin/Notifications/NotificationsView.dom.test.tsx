import { describe, expect, it, vi } from "vitest";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { visibleText } from "@/test/visibleText";
import type { Notification } from "@/lib/api/notifications";
import { NotificationsView } from "./NotificationsView";

/**
 * "That's everything." is a claim about the record, and a failed page-read is
 * not one.
 *
 * `showOlder` used to `setHasMore(false)` in its catch, so a page that did not
 * load removed the control AND printed the sentence that says there is nothing
 * more - the admin was told they had seen the lot, with no way back. Fixed in
 * #269; pinned here.
 */

const list = vi.fn();
vi.mock("@/lib/api/notifications", async (importOriginal) => {
  const actual =
    await importOriginal<typeof import("@/lib/api/notifications")>();
  return {
    ...actual,
    notificationsApi: {
      ...actual.notificationsApi,
      list: (o: { offset?: number } = {}) => list(o),
    },
  };
});

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: () => {}, replace: () => {}, refresh: () => {} }),
  usePathname: () => "/admin/notifications",
}));

vi.mock("@/hooks", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/hooks")>();
  return {
    ...actual,
    usePermissions: () => ({
      scopes: [],
      resolved: true,
      status: "ready" as const,
      refresh: () => {},
      hasScope: () => false,
    }),
  };
});

const row = (i: number): Notification => ({
  notificationId: `n${i}`,
  recipientId: "a1",
  recipientRole: "admin",
  type: "admin_welcome",
  title: `Notice ${i}`,
  description: "Something happened.",
  read: true,
  createdAt: new Date().toISOString(),
  navigatesTo: null,
  archived: false,
  archivedAt: null,
});

const firstPage = {
  notifications: [row(1), row(2)],
  unreadCount: 0,
  hasMore: true,
};

describe("NotificationsView show older", () => {
  it("does not say that's everything when the older page failed to load", async () => {
    list.mockImplementation((o: { offset?: number }) =>
      o.offset ? Promise.reject(new Error("500")) : Promise.resolve(firstPage),
    );

    const { container } = render(<NotificationsView />);
    const older = await screen.findByRole("button", { name: "Show older" });
    fireEvent.click(older);

    await waitFor(() =>
      expect(visibleText(container)).toMatch(/there are still older ones/i),
    );
    // The control must survive, and the sentence that ends the list must not
    // appear - a failed read is not the bottom of the record.
    expect(visibleText(container)).not.toMatch(/That's everything/i);
    expect(
      screen.getByRole("button", { name: "Try again" }),
    ).toBeInTheDocument();
  });

  it("says that's everything only when the feed reports no more", async () => {
    list.mockResolvedValue({
      notifications: [row(1)],
      unreadCount: 0,
      hasMore: false,
    });

    const { container } = render(<NotificationsView />);
    await waitFor(() =>
      expect(visibleText(container)).toMatch(/That's everything/i),
    );
    expect(screen.queryByRole("button", { name: "Show older" })).toBeNull();
  });

  it("appends the older page and keeps the control when it succeeds", async () => {
    list.mockImplementation((o: { offset?: number }) =>
      o.offset
        ? Promise.resolve({
            notifications: [row(3)],
            unreadCount: 0,
            hasMore: false,
          })
        : Promise.resolve(firstPage),
    );

    const { container } = render(<NotificationsView />);
    fireEvent.click(await screen.findByRole("button", { name: "Show older" }));

    await waitFor(() => expect(visibleText(container)).toMatch(/Notice 3/));
    // Appended, not replaced - "Show older" must never move what they were
    // already reading.
    expect(visibleText(container)).toMatch(/Notice 1/);
    expect(visibleText(container)).toMatch(/That's everything/i);
  });
});
