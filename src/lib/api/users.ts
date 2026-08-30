import { api } from "./client";

/**
 * The authenticated user, whatever their role.
 *
 * `GET /api/v1/users/me` is the profile endpoint this console went without:
 * the session payload carries a `user_id` and a role and nothing else, so
 * every screen wanting a name either invented one or showed none. This
 * returns name, email, school and subjects in a single call, for teachers and
 * admins alike.
 *
 * snake_case, like the rest of the deployed contract.
 */

export interface SchoolSummary {
  id: string;
  name: string;
  slug: string;
  code: string;
}

export interface CurrentUser {
  user_id: string;
  role: string;
  first_name: string | null;
  last_name: string | null;
  /** Required by the contract - the backend always sends something renderable. */
  display_name: string;
  email: string | null;
  school: SchoolSummary | null;
  /** Optional in the contract, so absent rather than empty is possible. */
  subjects?: string[];
}

export const usersApi = {
  /** The signed-in user's own profile. GET /api/v1/users/me */
  me: () => api.get<CurrentUser>("/api/v1/users/me"),
};
