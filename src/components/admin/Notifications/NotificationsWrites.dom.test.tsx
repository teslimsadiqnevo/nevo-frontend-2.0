import { describe, expect, it, vi } from "vitest";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { visibleText } from "@/test/visibleText";
import type { Notification } from "@/lib/api/notifications";
import { NotificationsView } from "./NotificationsView";

/**
 * A refused "Mark all read" used to clear every unread dot anyway.
 *
 * The rows were painted read optimistically and the catch reverted only the
 * BUTTON, so the failure left the list looking exactly like a success. Press
 * "Unread only" afterwards and the screen said "You're up to date." - a failed
 * WRITE manufacturing the same false absence that PR #269 spent five fixes
 * removing from failed READS.
 */

const list = vi.fn();
const markAllRead = vi.fn();

vi.mock("@/lib/api/notifications", async (importOriginal) => {
  const actual =
    await importOriginal<typeof import("@/lib/api/notifications")>();
  return {
    ...actual,
    notificationsApi: {
      ...actual.notificationsApi,
      list: () => list(),
      markAllRead: () => markAllRead(),
      markRead: async () => undefined,
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
  read: false,
  createdAt: new Date().toISOString(),
  navigatesTo: null,
  archived: false,
  archivedAt: null,
});

const feed = { notifications: [row(1), row(2)], unreadCount: 2, hasMore: false };

describe("NotificationsView mark all read", () => {
  it("does not report an empty inbox when the write was refused", async () => {
    list.mockResolvedValue(feed);
    markAllRead.mockRejectedValue(new Error("500"));

    const { container } = render(<NotificationsView />);
    fireEvent.click(await screen.findByRole("button", { name: "Mark all read" }));

    await waitFor(() =>
      expect(visibleText(container)).toMatch(/couldn't mark everything as read/i),
    );
    expect(visibleText(container)).toMatch(/nothing has changed/i);

    // The button must be pressable again - the admin's intent is unserved.
    expect(
      screen.getByRole("button", { name: "Mark all read" }),
    ).toBeInTheDocument();

    /*
     * And the decisive one: filtering to unread must still show the two
     * unread rows. Before, the rows stayed painted read and this said
     * "You're up to date."
     */
    fireEvent.click(screen.getByRole("button", { name: "Unread only" }));
    await waitFor(() => expect(visibleText(container)).toMatch(/Notice 1/));
    expect(visibleText(container)).toMatch(/Notice 2/);
    expect(visibleText(container)).not.toMatch(/up to date/i);
  });

  it("clears the unread rows when the write actually succeeded", async () => {
    list.mockResolvedValue(feed);
    markAllRead.mockResolvedValue(undefined);

    const { container } = render(<NotificationsView />);
    fireEvent.click(await screen.findByRole("button", { name: "Mark all read" }));

    await waitFor(() =>
      expect(screen.getByRole("button", { name: "All read" })).toBeInTheDocument(),
    );
    expect(visibleText(container)).not.toMatch(/couldn't mark/i);

    fireEvent.click(screen.getByRole("button", { name: "Unread only" }));
    await waitFor(() => expect(visibleText(container)).toMatch(/up to date/i));
  });
});
