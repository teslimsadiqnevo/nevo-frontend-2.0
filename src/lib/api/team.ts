import { api } from "./client";

/**
 * School team endpoints (`/api/v1/admin/team/*`), typed against the deployed
 * backend. Only invitation acceptance is wired: it is unauthenticated by
 * design, because the invitation token is the credential and the teacher has
 * no session yet.
 *
 * Note what the response does NOT carry: there is no access token, so
 * accepting an invitation activates the account without signing anyone in.
 * The activation screen chains a password login to land the teacher in the
 * console. It also carries no email, which is why the invite link has to.
 *
 * TODO(api): the rest of the team surface - GET /admin/team,
 * POST /admin/team/invitations, PUT /admin/team/{id}/scopes - belongs here
 * when the admin console is built.
 */

export interface AcceptInvitationRequest {
  invitation_token: string;
  password: string;
}

export interface AcceptInvitationResponse {
  user_id: string;
  school_id: string;
  role: string;
}

export const teamApi = {
  /** POST /api/v1/admin/team/invitations/accept - activates the account. */
  acceptInvitation: (payload: AcceptInvitationRequest) =>
    api.post<AcceptInvitationResponse>(
      "/api/v1/admin/team/invitations/accept",
      payload,
    ),
};
