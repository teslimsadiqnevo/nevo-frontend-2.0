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

    // SCRUM-100's fixed copy, verbatim, with the retry it asks for. What this
    // replaced paraphrased the spec and offered no button - it told the reader
    // to close the panel they were reading and open it again.
    await waitFor(() =>
      expect(visibleText(container)).toMatch(
        /We couldn't pull these in just now\. We're on it\./,
      ),
    );
    expect(visibleText(container)).not.toMatch(/all caught up/i);
    expect(visibleText(container)).toMatch(/Try again/);
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
