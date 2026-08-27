import type { PermissionScope } from "@/lib/constants/permissions";
import { api } from "./client";

/**
 * School team endpoints (`/api/v1/admin/team/*`), typed against the deployed
 * backend. The whole surface is live: list, invite, accept, and change scopes.
 *
 * Invitation acceptance is unauthenticated by design - the invitation token is
 * the credential and the invitee has no session yet. Note what its response
 * does NOT carry: no access token, so accepting activates the account without
 * signing anyone in, and no email, which is why the invite link has to carry
 * one.
 */

/**
 * The backend's own `UserRole` enum, which is NOT the same vocabulary as our
 * `USER_ROLES` constant: it has no plain "admin", splitting it into
 * `senco_admin` and `other_admin`, and calls a parent `parent_guardian`.
 * Typed separately here so an invite cannot be sent with a role the API will
 * reject.
 *
 * TODO(api): reconcile the two vocabularies - our constants say `admin` and
 * `parent`, which the backend would refuse.
 */
export type BackendUserRole =
  | "student"
  | "teacher"
  | "senco_admin"
  | "other_admin"
  | "parent_guardian";

export interface TeamMember {
  user_id: string;
  admin_id: string;
  email: string | null;
  first_name: string | null;
  last_name: string | null;
  role: string;
  status: string;
  scopes: PermissionScope[];
}

export interface InviteTeamMemberRequest {
  email: string;
  role: BackendUserRole;
  scopes: PermissionScope[];
}

export interface InvitedTeamMember {
  invitation_id: string;
  user_id: string;
  email: string;
  role: string;
  scopes: PermissionScope[];
  /** What the activation link carries as `?token=`. */
  invitation_token: string;
  expires_at: string;
}

export interface AcceptInvitationRequest {
  invitation_token: string;
  password: string;
}

export interface AcceptInvitationResponse {
  user_id: string;
  school_id: string;
  role: string;
}

/**
 * D03's invite panel asks only which scopes a person gets - there is no role
 * picker anywhere in the frame - but the API requires a role. SENCo is the one
 * scope the enum names on its own, so it decides; everything else is an
 * ordinary admin.
 *
 * TODO(api): confirm this is the intended derivation, or give the invite
 * endpoint a default so the client does not have to guess.
 */
export function roleForScopes(scopes: PermissionScope[]): BackendUserRole {
  return scopes.includes("senco") ? "senco_admin" : "other_admin";
}

export const teamApi = {
  /** GET /api/v1/admin/team - everyone who can administer the school. */
  list: () => api.get<TeamMember[]>("/api/v1/admin/team"),

  /** POST /api/v1/admin/team/invitations - returns the activation token. */
  invite: (payload: InviteTeamMemberRequest) =>
    api.post<InvitedTeamMember>("/api/v1/admin/team/invitations", payload),

  /** POST /api/v1/admin/team/invitations/accept - activates the account. */
  acceptInvitation: (payload: AcceptInvitationRequest) =>
    api.post<AcceptInvitationResponse>(
      "/api/v1/admin/team/invitations/accept",
      payload,
    ),

  /** PUT /api/v1/admin/team/{id}/scopes - D03 draws no UI for this yet. */
  updateScopes: (targetUserId: string, scopes: PermissionScope[]) =>
    api.put<TeamMember>(`/api/v1/admin/team/${targetUserId}/scopes`, {
      scopes,
    }),
};
