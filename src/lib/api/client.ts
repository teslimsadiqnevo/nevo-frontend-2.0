/**
 * Base API client for the Nevo FastAPI backend (FE Architecture §9).
 *
 * All backend calls go through here:
 * - Base URL per environment (`NEXT_PUBLIC_API_URL`)
 * - Auth token attached automatically (once the auth contract exists)
 * - Standardized, user-friendly error handling — never surface raw technical
 *   errors (Design System error-state patterns)
 * - Request/response logging in development
 *
 * Gemini is NEVER called from here — all AI goes through the backend gateway.
 */

import { clearSession, getSession, getToken } from "@/lib/auth/session";
import { isAdminRole } from "@/lib/constants/permissions";

// Default: the same-origin catch-all proxy (`app/api/backend/[...path]`),
// which forwards to the FastAPI backend - the backend has no CORS headers, so
// browsers cannot call it directly. Set `NEXT_PUBLIC_API_DIRECT=1` alongside
// `NEXT_PUBLIC_API_URL` to bypass the proxy once CORS lands.
const BASE_URL =
  process.env.NEXT_PUBLIC_API_DIRECT === "1"
    ? (process.env.NEXT_PUBLIC_API_URL?.replace(/\/$/, "") ??
      "https://api.nevolearning.com")
    : "/api/backend";

const isDev = process.env.NODE_ENV === "development";

/** Thrown for any non-2xx response or network failure. `message` is user-safe. */
export class ApiError extends Error {
  constructor(
    public readonly status: number,
    message: string,
    public readonly detail?: unknown,
  ) {
    super(message);
    this.name = "ApiError";
  }
}

/** User-friendly message per the Design System — never raw technical errors. */
function friendlyMessage(status: number): string {
  if (status === 0)
    return "Something went wrong. Please check your connection and try again.";
  if (status === 401 || status === 403)
    return "You need to sign in again to continue.";
  if (status === 404) return "We couldn't find what you were looking for.";
  if (status >= 500)
    return "Something went wrong on our end. Please try again shortly.";
  return "Something went wrong. Please try again.";
}

// The backend issues Bearer access tokens on login (no cookies); the token
// lives in the client session store and rides every request from here.
async function getAuthToken(): Promise<string | undefined> {
  return getToken();
}

/**
 * A 401/403 on a request we DID send a token with means the session died
 * mid-use. Clear it and send the person to their door - otherwise the
 * console quietly degrades to sample data while they still believe they're
 * signed in.
 *
 * Two exemptions matter. Sign-in and sign-out own their failures: a wrong
 * password must surface the sign-in screen's own message, never bounce the
 * visitor. And a request sent WITHOUT a token was never authenticated, so
 * its 401 is expected, not a death.
 */
function handleAuthFailure(path: string, sentToken: boolean): void {
  if (typeof window === "undefined" || !sentToken) return;
  // Only the sign-in and sign-out calls own their failures. The session
  // check must NOT be exempt: it is the one call that discovers a dead
  // token, and exempting it left the student browsing an app that still
  // looked signed in.
  if (path.includes("/auth/login") || path.includes("/auth/logout")) return;
  const role = getSession()?.role;
  clearSession();
  // No teacher- or admin-side "session expired" screen is designed (flagged);
  // each door carries the same reassurance. The backend's admin roles are
  // `senco_admin` and `other_admin`, never a plain "admin".
  const door = role === "teacher"
    ? "/auth/teacher"
    : isAdminRole(role)
      ? "/auth/admin"
      : "/auth/session-expired";
  window.location.assign(door);
}

type QueryValue = string | number | boolean | null | undefined;

export interface RequestOptions extends Omit<RequestInit, "body"> {
  /** JSON-serializable request body. */
  body?: unknown;
  /** Query-string params. */
  params?: Record<string, QueryValue>;
  /** Override the environment base URL (e.g. a public endpoint on a different host). */
  baseUrl?: string;
}

function buildUrl(
  path: string,
  params?: Record<string, QueryValue>,
  baseUrl: string = BASE_URL,
): string {
  const joined = `${baseUrl}${path.startsWith("/") ? path : `/${path}`}`;
  // A relative base (the same-origin proxy) resolves against the current
  // origin in the browser; seams only run client-side, localhost is the
  // SSR-safety fallback.
  const origin =
    typeof window !== "undefined"
      ? window.location.origin
      : "http://localhost:3000";
  const url = new URL(joined, origin);
  if (params) {
    for (const [key, value] of Object.entries(params)) {
      if (value !== undefined && value !== null) {
        url.searchParams.set(key, String(value));
      }
    }
  }
  return url.toString();
}

export async function request<T>(
  path: string,
  options: RequestOptions = {},
): Promise<T> {
  const { body, params, headers, baseUrl, ...rest } = options;
  const url = buildUrl(path, params, baseUrl);
  const token = await getAuthToken();

  const init: RequestInit = {
    ...rest,
    // Cookie auth by default; overridable for public cross-origin endpoints
    // (credentialed requests break under a wildcard CORS policy).
    credentials: rest.credentials ?? "include",
    headers: {
      Accept: "application/json",
      ...(body !== undefined ? { "Content-Type": "application/json" } : {}),
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...headers,
    },
    ...(body !== undefined ? { body: JSON.stringify(body) } : {}),
  };

  if (isDev) console.debug(`[api] ${rest.method ?? "GET"} ${url}`);

  let response: Response;
  try {
    response = await fetch(url, init);
  } catch (cause) {
    if (isDev) console.error(`[api] network error ${url}`, cause);
    throw new ApiError(0, friendlyMessage(0), cause);
  }

  if (!response.ok) {
    let detail: unknown;
    try {
      detail = await response.json();
    } catch {
      detail = await response.text().catch(() => undefined);
    }
    if (isDev) console.error(`[api] ${response.status} ${url}`, detail);
    if (response.status === 401 || response.status === 403) {
      handleAuthFailure(path, Boolean(token));
    }
    throw new ApiError(response.status, friendlyMessage(response.status), detail);
  }

  if (response.status === 204) return undefined as T;
  return (await response.json()) as T;
}

/** Convenience verbs over `request`. */
export const api = {
  get: <T>(path: string, options?: RequestOptions) =>
    request<T>(path, { ...options, method: "GET" }),
  post: <T>(path: string, body?: unknown, options?: RequestOptions) =>
    request<T>(path, { ...options, method: "POST", body }),
  put: <T>(path: string, body?: unknown, options?: RequestOptions) =>
    request<T>(path, { ...options, method: "PUT", body }),
  patch: <T>(path: string, body?: unknown, options?: RequestOptions) =>
    request<T>(path, { ...options, method: "PATCH", body }),
  del: <T>(path: string, options?: RequestOptions) =>
    request<T>(path, { ...options, method: "DELETE" }),
};

export { BASE_URL };
