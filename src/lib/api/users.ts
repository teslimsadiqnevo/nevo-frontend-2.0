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

  /**
   * Update the teacher's own name and subjects. Shipped 1 Sep; before it,
   * `users/me` was GET-only and C11's Edit had nowhere to save to.
   *
   * MIND THE CASING, but not as previously recorded here. This said that
   * sending `first_name` was a silent no-op; it is not. `ProfilePatch` sets
   * `populate_by_name=True`, so the request accepts BOTH spellings and a
   * client sending snake_case round-trips correctly - confirmed against the
   * deployed API by backend, 2 Sep 2026.
   *
   * What is real is the asymmetry on the way back: the response has no alias
   * generator, so this endpoint returns the snake_case `CurrentUser`
   * (`user_id`, `first_name`) while the rest of the product API is camelCase.
   * The auth surface keeps snake for backward compatibility and this endpoint
   * sits on it. Send camelCase to match the rest of the client; expect snake
   * coming back.
   *
   * `email` is deliberately not writable: it is an authentication identifier
   * and needs a verification flow rather than a silent change.
   *
   * `subjects` REPLACES the explicitly chosen list, but subjects inferred
   * from a teacher's lessons are merged back into the response - so what you
   * read back can legitimately be a superset of what you sent. That is not a
   * failed write, and nothing may treat it as one.
   */
  updateMe: (payload: {
    firstName?: string | null;
    lastName?: string | null;
    subjects?: string[] | null;
  }) => api.patch<CurrentUser>("/api/v1/users/me", payload),
};
