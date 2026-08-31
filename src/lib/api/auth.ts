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

/** 200 of POST /auth/school-code/verify - the school, and its classes. */
export interface SchoolVerification {
  schoolId: string;
  schoolName: string;
  /** How this school's students sign in; no enum in the spec. */
  authMethod: string;
  classes: { id: string; name: string; yearGroup: string | null }[];
}

export const authApi = {
  /**
   * Resolve a school code during onboarding. Pre-auth by design - the child
   * has no session yet - and the response carries the school's class list,
   * which is exactly what the class-confirmation step needs.
   */
  verifySchoolCode: (schoolCode: string) =>
    api.post<SchoolVerification>("/api/v1/auth/school-code/verify", {
      schoolCode,
    }),

  /**
   * Store the chosen PIN server-side. Requires a Bearer session - which pure
   * pre-auth onboarding does not have, so the PIN screen only calls this when
   * a token exists (the SSO path, or any future flow that signs in first).
   * Flagged to backend: a child who onboards with no session cannot store
   * their PIN, and their next sign-in checks it server-side.
   */
  setPin: (pin: string) => api.post<Record<string, string>>("/api/v1/auth/pin", { pin }),

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

  /**
   * Complete the OAuth redirect from Microsoft/Google.
   *
   * All three params are REQUIRED by the contract (`code` minLength 1,
   * `state` minLength 3), and the response is a real session - the same shape
   * password sign-in returns. The path was previously `/auth/sso/callback`,
   * missing the `/api/v1` prefix, so it could never have reached the backend.
   *
   * Starting the flow is still blocked: both start endpoints need a
   * `schoolSlug`, and the only thing that returns one is `sso/status`, which
   * 404s until a school is already connected. So this completes a handshake
   * nothing can yet begin - see `sso.ts`.
   */
  ssoCallback: (query: { provider: string; code: string; state: string }) =>
    api.get<{
      access_token: string;
      token_type: string;
      expires_at: string;
      role: string;
      user_id: string;
      destination?: string | null;
      replaced_session?: boolean | null;
    }>("/api/v1/auth/sso/callback", { params: query }),
};
