import { describe, expect, it, vi } from "vitest";
import { render, waitFor } from "@testing-library/react";
import { visibleText } from "@/test/visibleText";
import { NotificationsPanel } from "./NotificationsPanel";

/**
 * "You're all caught up" is a claim. A failed read is not one.
 *
 * Fixed in #269 and shipped untested on a belief about mocked rejections that
 * turned out to be wrong; pinned here retrospectively.
 */

const feed = vi.fn();
vi.mock("@/lib/api/notifications", async (importOriginal) => {
  const actual =
    await importOriginal<typeof import("@/lib/api/notifications")>();
  return {
    ...actual,
    notificationsApi: { ...actual.notificationsApi, list: () => feed() },
  };
});


describe("NotificationsPanel", () => {
  it("does not say you are all caught up when the read failed", async () => {
    feed.mockRejectedValue(new Error("500"));
    const { container } = render(<NotificationsPanel onClose={() => {}} onReadStateChanged={() => {}} />);

    await waitFor(() =>
      expect(visibleText(container)).toMatch(/couldn't load your notifications/i),
    );
    expect(visibleText(container)).toMatch(/isn't a record that there are none/i);
    expect(visibleText(container)).not.toMatch(/all caught up/i);
  });

  it("still says caught up on a real, successful empty", async () => {
    feed.mockResolvedValue({
      notifications: [],
      unreadCount: 0,
      total: 0,
      hasMore: false,
    });
    const { container } = render(<NotificationsPanel onClose={() => {}} onReadStateChanged={() => {}} />);

    await waitFor(() => expect(visibleText(container)).toMatch(/all caught up/i));
    expect(visibleText(container)).not.toMatch(/couldn't load/i);
  });
});
