import { api } from "./client";
import { clearSession, setSession } from "@/lib/auth/session";

/**
 * Auth endpoints - wired to the live FastAPI contract (Bearer tokens).
 *
 * Both logins return an access token which is stored client-side and attached
 * to every subsequent request by the api client. `logout` clears the local
 * session even if the server call fails - the device must always be able to
 * sign out.
 */

/** 200 body of both login endpoints. */
export interface LoginResponse {
  access_token: string;
  token_type: string;
  expires_at: string;
  user_id: string;
  role: string;
  replaced_session: boolean;
}

/** GET /auth/session - the authenticated principal. */
export interface SessionInfo {
  user_id: string;
  role: string;
  session_id: string;
}

function store(login: LoginResponse): LoginResponse {
  setSession({
    token: login.access_token,
    expiresAt: login.expires_at,
    userId: login.user_id,
    role: login.role,
  });
  return login;
}

export const authApi = {
  /** Staff sign-in (teacher/admin) - email + password. */
  loginPassword: (payload: { email: string; password: string }) =>
    api
      .post<LoginResponse>("/api/v1/auth/login/password", payload)
      .then(store),

  /** Student sign-in - school code + identifier from the remembered device
   *  profile, plus the PIN they just entered (frame 00). */
  loginPin: (payload: {
    school_code: string;
    login_identifier: string;
    pin: string;
  }) => api.post<LoginResponse>("/api/v1/auth/login/pin", payload).then(store),

  /** Resolve the current session (requires a stored token). */
  session: () => api.get<SessionInfo>("/api/v1/auth/session"),

  /** End the session server-side and locally - local clear always happens. */
  logout: async (): Promise<void> => {
    try {
      await api.post("/api/v1/auth/logout");
    } finally {
      clearSession();
    }
  },

  /**
   * Ask for a reset link. Always resolves the same way for any address:
   * the backend returns a generic receipt so the screen cannot be used to
   * discover whether an account exists.
   *
   * Email delivery is a deployment concern on the backend's side - a 200
   * here means the request was accepted, not that a message has landed.
   */
  requestPasswordReset: (email: string) =>
    api.post<{ status: string; message: string }>(
      "/api/v1/auth/forgot-password",
      { email },
    ),

  /** Set the new password, using the token from the emailed link. */
  completePasswordReset: (payload: { token: string; password: string }) =>
    api.post<unknown>("/api/v1/auth/password-reset/complete", payload),

  /** Complete the OAuth redirect from Microsoft/Google.
   *  TODO(api): the backend's SSO callback is a browser redirect flow
   *  (`GET /api/v1/auth/sso/{provider}/callback`) - align once the school SSO
   *  slugs exist; the mock session path still drives onboarding today. */
  ssoCallback: (query: Record<string, string>) =>
    api.get("/auth/sso/callback", { params: query }),
};
