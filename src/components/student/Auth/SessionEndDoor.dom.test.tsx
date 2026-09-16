import { describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import SessionExpiredPage from "@/app/auth/session-expired/page";

vi.mock("next/navigation", () => ({ useRouter: () => ({ push: vi.fn() }) }));

/**
 * The child's half of the five 401 codes.
 *
 * #422 made the reason survive the redirect as `?reason=`; this door ignored
 * it and rendered "You've been away for a while" for all five. That is a
 * statement about the child's behaviour and it is untrue for four of them -
 * worst for `account_paused`, where a child whose school closed their account
 * mid-lesson was told they had been idle and went back to try again.
 */

const doorFor = async (reason?: string) =>
  render(
    await SessionExpiredPage({
      searchParams: Promise.resolve(reason ? { reason } : {}),
    }),
  );

describe("the child's session-end door", () => {
  it("says the account is on pause, and offers no way to retry", async () => {
    await doorFor("account_paused");

    expect(screen.getByText(/on pause/i)).toBeInTheDocument();
    // The whole point: retrying is the one action that cannot work, so the
    // screen must not invite it.
    expect(screen.queryByRole("button", { name: /log back in/i })).toBeNull();
  });

  it("does not tell a child their session timed out when it was ended for them", async () => {
    await doorFor("session_revoked");

    expect(screen.getByText("Your session has ended.")).toBeInTheDocument();
    expect(screen.queryByText(/away for a while/i)).toBeNull();
  });

  it("tells a child they signed in somewhere else", async () => {
    await doorFor("session_replaced");

    expect(screen.getByText(/another device/i)).toBeInTheDocument();
    expect(screen.getByText(/progress is saved/i)).toBeInTheDocument();
  });

  it("keeps board 28's gentler wording for an ordinary timeout", async () => {
    await doorFor("session_expired");

    // Not the console's "sessions expire after a period of inactivity for your
    // security" - a child gets the screen design drew for them.
    expect(screen.getByText(/away for a while/i)).toBeInTheDocument();
  });

  it("under-claims on an unknown code, an absent one, and a hand-typed one", async () => {
    for (const reason of [undefined, "invalid_session", "something_new", ""]) {
      const { unmount } = await doorFor(reason);
      // "You've been away" is true of every 401 that reaches this point.
      // Guessing `paused` would tell a child something false about their own
      // account, so absence and nonsense both land here.
      expect(screen.getByText(/away for a while/i)).toBeInTheDocument();
      unmount();
    }
  });
});
