/**
 * Mock SSO callback resolution (pre-backend). Mirrors the shape
 * `authApi.ssoCallback` will return once the FastAPI auth contract lands
 * (Product Arch A.2 — SSO + first-use detection), so wiring the real endpoint is
 * a data-source swap, not a UI change.
 *
 * The identity provider redirects back to `/auth/sso-callback` with its result
 * in the URL (real OAuth params: `code`/`state`, or `error`). Until that exists,
 * a `mock` param lets us exercise each branch:
 *   (default) → success, first-use  → into onboarding
 *   ?mock=returning → success, returning → into the app
 *   ?mock=error → the provider/handshake failed
 */
import { USER_ROLES } from "@/lib/constants";
import type { AuthUser } from "@/context/AuthContext";

export interface SsoResolution {
  status: "success" | "error";
  /** First-ever sign-in → route into onboarding; otherwise straight into the app. */
  isFirstUse: boolean;
  /** The established session on success. */
  user?: AuthUser;
}

/** Simulated handshake latency so the "Signing you in…" state is real. */
export const SSO_RESOLVE_MS = 900;

/**
 * Resolve an SSO callback from the identity provider's return params.
 * TODO(api): replace with `authApi.ssoCallback(query)`.
 */
export function resolveMockSso(params: {
  mock?: string;
}): SsoResolution {
  if (params.mock === "error") {
    return { status: "error", isFirstUse: false };
  }

  const isFirstUse = params.mock !== "returning";
  return {
    status: "success",
    isFirstUse,
    user: {
      id: `sso-${crypto.randomUUID()}`,
      role: USER_ROLES.STUDENT,
      schoolId: "school-demo",
      method: "sso",
    },
  };
}
