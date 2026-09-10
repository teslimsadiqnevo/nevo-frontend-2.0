import { describe, expect, it, vi } from "vitest";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { visibleText } from "@/test/visibleText";
import { AdminTeamView } from "./AdminTeamView";

/**
 * "They'll get an email to set a password and join."
 *
 * Nothing supported that. The 201 carries `invitation_id`, `user_id`, `email`,
 * `role`, `scopes`, `invitation_token` and `expires_at` - and NO delivery state
 * of any kind, unlike the student invites, which carry `deliveryStatus`
 * precisely so a screen can tell.
 *
 * Worse, the response was DISCARDED (`.then(() => ...)`) and the screen
 * navigated away 1.4 seconds later, so `invitation_token` - the only way to
 * build an activation link - was gone before anybody could act on it. The same
 * shape as the bulk import's dropped join tokens, in its sibling surface.
 */

const list = vi.fn();
const invite = vi.fn();

vi.mock("@/lib/api/team", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/lib/api/team")>();
  return {
    ...actual,
    teamApi: { ...actual.teamApi, list: () => list(), invite: (p: unknown) => invite(p) },
  };
});
vi.mock("@/lib/api/school", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/lib/api/school")>();
  return {
    ...actual,
    schoolApi: { ...actual.schoolApi, get: async () => ({ name: "Brightgate" }) },
  };
});
vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: vi.fn(), replace: vi.fn(), refresh: vi.fn() }),
}));

const CREATED = {
  invitation_id: "inv1",
  user_id: "u1",
  email: "f.adebayo@brightgate.edu.ng",
  role: "other_admin",
  scopes: ["billing"],
  invitation_token: "tok-abc123",
  expires_at: "2026-10-01T00:00:00Z",
};

/** Open the invite form, fill it, and send. */
async function sendInvite(container: HTMLElement) {
  fireEvent.click(await screen.findByRole("button", { name: /Invite an admin/i }));
  const email = (await waitFor(() => {
    const el = container.querySelector("#invite-email") as HTMLInputElement | null;
    if (!el) throw new Error("no email field yet");
    return el;
  })) as HTMLInputElement;
  const setter = Object.getOwnPropertyDescriptor(
    window.HTMLInputElement.prototype,
    "value",
  )!.set!;
  setter.call(email, "f.adebayo@brightgate.edu.ng");
  email.dispatchEvent(new Event("input", { bubbles: true }));
  // Scopes are sr-only checkboxes and some default on, so the send is already
  // valid; only turn one on if the catalogue happens to start empty.
  if (screen.queryAllByRole("checkbox", { checked: true }).length === 0) {
    const first = screen.queryAllByRole("checkbox")[0];
    if (first) fireEvent.click(first);
  }
  fireEvent.click(screen.getByRole("button", { name: "Send invitation" }));
}

describe("inviting an admin", () => {
  it("does not promise an email the response says nothing about", async () => {
    list.mockResolvedValue([]);
    invite.mockResolvedValue(CREATED);

    const { container } = render(<AdminTeamView />);
    await sendInvite(container);

    await waitFor(() => expect(invite).toHaveBeenCalled());
    expect(visibleText(container)).not.toMatch(
      /get an email to set a password/i,
    );
  });

  it("hands over the activation link it used to throw away", async () => {
    list.mockResolvedValue([]);
    invite.mockResolvedValue(CREATED);

    const { container } = render(<AdminTeamView />);
    await sendInvite(container);

    await waitFor(() =>
      expect(visibleText(container)).toMatch(/is invited/),
    );
    // The token, in a link that points at a route that exists.
    expect(visibleText(container)).toMatch(/\/auth\/admin\/activate\?token=tok-abc123/);
    expect(visibleText(container)).toMatch(/f\.adebayo@brightgate\.edu\.ng/);
    expect(screen.getByRole("button", { name: "Copy" })).toBeInTheDocument();
  });

  it("holds the link on screen instead of navigating away from it", async () => {
    /*
     * The old code called `setTimeout(onSent, 1400)`, so the only copy of the
     * token vanished a beat after it arrived. Nothing here should move until
     * the admin says Done.
     */
    list.mockResolvedValue([]);
    invite.mockResolvedValue(CREATED);

    const { container } = render(<AdminTeamView />);
    await sendInvite(container);

    await waitFor(() => expect(visibleText(container)).toMatch(/tok-abc123/));
    await new Promise((r) => setTimeout(r, 1600));
    expect(visibleText(container)).toMatch(/tok-abc123/);
    expect(screen.getByRole("button", { name: "Done" })).toBeInTheDocument();
  });

  it("says plainly that it cannot be resent or cancelled", async () => {
    // There is no resend and no revoke endpoint for an admin invitation, so
    // the screen says so rather than offering a control that cannot work.
    list.mockResolvedValue([]);
    invite.mockResolvedValue(CREATED);

    const { container } = render(<AdminTeamView />);
    await sendInvite(container);

    await waitFor(() =>
      expect(visibleText(container)).toMatch(/no way to resend or cancel/i),
    );
    expect(screen.queryByRole("button", { name: /Resend/i })).toBeNull();
    expect(screen.queryByRole("button", { name: /Revoke/i })).toBeNull();
  });
});
