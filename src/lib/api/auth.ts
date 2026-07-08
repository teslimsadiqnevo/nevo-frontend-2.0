import { api } from "./client";

/**
 * Auth endpoints (FE Architecture §1). Covers email/password, PIN, and SSO.
 *
 * TODO: align payloads/returns with the FastAPI auth contract (Product Arch A.2:
 * SSO + first-use detection, per-role session timeouts).
 */
export const authApi = {
  login: (payload: { identifier: string; password?: string; pin?: string }) =>
    api.post("/auth/login", payload),
  logout: () => api.post("/auth/logout"),
  /** Resolve the current session (user, role, school). */
  session: () => api.get("/auth/session"),
  /** Complete the OAuth redirect from Microsoft/Google. */
  ssoCallback: (query: Record<string, string>) =>
    api.get("/auth/sso/callback", { params: query }),
};
