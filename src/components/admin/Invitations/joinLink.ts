import type { Invitation } from "@/lib/api/invites";

/**
 * The address an invited person opens.
 *
 * `NewInviteModal` built this inline and was the ONLY place in the whole admin
 * surface that constructed a join link - which is why an import that emailed
 * nobody had no recovery. The token arrives on the response, and it was being
 * discarded when the modal unmounted.
 *
 * Null when there is no token. `token` is nullable in the contract and is only
 * promised on CREATE, so a list read may carry none - and a "Copy link" button
 * that yields `/join/null` is worse than no button.
 */
export function joinLink(token: string | null | undefined): string | null {
  if (!token) return null;
  const origin = typeof window === "undefined" ? "" : window.location.origin;
  return `${origin}/join/${token}`;
}

/** How an invited person is named on screen when we have to pick one. */
export function inviteeName(invite: Invitation): string {
  return invite.name ?? invite.email ?? "Invited person";
}

/**
 * Every link in one block, ready to paste into whatever the school actually
 * uses to reach its staff - which on day one is usually WhatsApp.
 *
 * Rows without a token are left out rather than rendered as a broken line: the
 * caller counts them and says so separately.
 */
export function joinLinkBlock(invites: Invitation[]): string {
  return invites
    .map((i) => ({ who: inviteeName(i), link: joinLink(i.token) }))
    .filter((r) => r.link)
    .map((r) => `${r.who}: ${r.link}`)
    .join("\n");
}
