import { api } from "./client";

/**
 * School invitations (D19 · SCRUM-79) - the single home for inviting teachers
 * and students. D6 Teachers and D7 Students both defer here rather than
 * carrying their own invite forms.
 *
 * The join half of this module is PUBLIC: `lookupJoin` and `acceptJoin` are
 * what the invite link lands on, with no session at all. They are the only
 * calls in the admin surface a parent or child will ever make.
 */

export type InviteRole = "teacher" | "student";

/**
 * One invitation, as every list and mutation returns it.
 *
 * WHAT IS NOT ON IT, and what that costs D19:
 * - no `classId`, so the frame's CLASS COLUMN and class filter have nothing to
 *   read. Both are absent rather than blank-filled.
 * - no created-at, so the frame's "Invited 9 Jul" column has no source.
 *   `expiresAt` is the only date here, and back-computing a send date from it
 *   would be inventing a TTL we were never told.
 * Both are flagged on `InvitationsView` and raised with backend.
 */
export interface Invitation {
  id: string;
  /** The join token. Present on create, which is what makes copy-link work. */
  token: string | null;
  role: string | null;
  email: string | null;
  name: string | null;
  /** "pending" | "joined" | "expired" in the frame's vocabulary. */
  status: string | null;
  expiresAt: string;
  deliveryStatus: string | null;
}

/**
 * One row of an invite request.
 *
 * `parentContact` is a SINGLE string, which is why D19's separate
 * "Parent / guardian name" and "Parent / guardian email" fields collapse into
 * one on the way out - see `NewInviteModal`.
 *
 * There is no date-of-birth field anywhere on this body, so D19's student DOB
 * input and its under-18 check have nowhere to go.
 */
export interface InviteDraft {
  role: InviteRole;
  firstName?: string | null;
  lastName?: string | null;
  email?: string | null;
  parentContact?: string | null;
  classId?: string | null;
}

/** A row the backend refused, by position in the submitted array. */
export interface RejectedInvitation {
  row: number;
  reason: string;
}

export interface BulkInviteResult {
  created: Invitation[];
  rejected: RejectedInvitation[];
}

/** What the join link resolves to, before anyone has an account. */
export interface JoinLookup {
  /** "valid" | "expired" | "revoked" - drives which of D19's three states shows. */
  status: string;
  role: string;
  schoolName: string | null;
  expiresAt: string;
}

export const invitesApi = {
  /** Every invitation, newest handling first. `status` narrows server-side. */
  list: (status?: string) =>
    api.get<Invitation[]>("/api/v1/invites", {
      params: status ? { status } : undefined,
    }),

  /**
   * Send one invitation.
   *
   * TODO(api): D19 asks the sender to choose "Copy link to share manually" or
   * "Send via email from Nevo", and this body carries no delivery field. The
   * choice cannot be transmitted, so the modal offers copy-link (which works,
   * because `token` comes back) and reports what the backend actually did
   * through `deliveryStatus` rather than claiming an email was sent.
   */
  create: (draft: InviteDraft) => api.post<Invitation>("/api/v1/invites", draft),

  /**
   * Send many.
   *
   * PARTIAL COMMIT IS THE REAL BEHAVIOUR, and the frame agrees: D19 draws
   * "3 invites sent · 3 rows skipped due to errors" and a footer offering to
   * send the valid rows now. SCRUM-40 claims the opposite - that one bad row
   * blocks the whole upload "matching SCRUM-79" - but D19 IS the SCRUM-79
   * surface and it does no such thing. Frame and API agree against the
   * secondhand summary, so partial send is what ships.
   */
  bulk: (drafts: InviteDraft[]) =>
    api.post<BulkInviteResult>("/api/v1/invites/bulk", drafts),

  /** Re-deliver an invitation. Returns the refreshed row. */
  resend: (invitationId: string) =>
    api.patch<Invitation>(`/api/v1/invites/${invitationId}/resend`),

  /** Revoke: the link stops working immediately. */
  revoke: (invitationId: string) =>
    api.del<void>(`/api/v1/invites/${invitationId}`),

  /**
   * PUBLIC. What a join link resolves to. No session, and none required -
   * this is how a session comes to exist.
   */
  lookupJoin: (token: string) =>
    api.get<JoinLookup>(`/api/v1/join/${token}`),

  /** PUBLIC. Redeem the invitation and become an account. */
  acceptJoin: (
    token: string,
    payload: {
      password?: string | null;
      pin?: string | null;
      firstName?: string | null;
      lastName?: string | null;
    },
  ) =>
    api.post<{ userId: string; role: string; loginIdentifier: string | null }>(
      `/api/v1/join/${token}/accept`,
      payload,
    ),
};
