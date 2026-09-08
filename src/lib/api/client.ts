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
  if (status === 401) return "You need to sign in again to continue.";
  if (status === 403)
    return "You don't have access to this. Ask an admin who manages permissions for your school.";
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
/**
 * Which session-expired screen a role belongs on.
 *
 * Exported and pure so it can be tested directly: jsdom makes
 * `window.location.assign` non-configurable, so neither a stub nor a spy can
 * observe where `handleAuthFailure` actually sent someone. Extracting the
 * choice moves the half that can be wrong somewhere it can be checked.
 *
 * The backend's admin roles are `senco_admin` and `other_admin`, never a plain
 * "admin" - which is why this asks `isAdminRole` rather than comparing.
 */
export function sessionExpiredDoor(role: string | undefined): string {
  if (role === "teacher") return "/auth/teacher/session-expired";
  if (isAdminRole(role)) return "/auth/admin/session-expired";
  return "/auth/session-expired";
}

/**
 * One dead token, one redirect.
 *
 * A console screen has several reads in flight at once, so a token that has
 * expired comes back 401 on all of them together. Without this latch the
 * first call read the role and left for the right door, and every later one
 * found the session ALREADY CLEARED, resolved no role, and re-assigned to the
 * student screen - last write winning. A teacher was reliably sent to the
 * child's session screen by a race, not by anything about their session.
 */
let redirecting = false;

function handleAuthFailure(path: string, sentToken: boolean): void {
  if (typeof window === "undefined" || !sentToken || redirecting) return;
  // Only the sign-in and sign-out calls own their failures. The session
  // check must NOT be exempt: it is the one call that discovers a dead
  // token, and exempting it left the student browsing an app that still
  // looked signed in.
  if (path.includes("/auth/login") || path.includes("/auth/logout")) return;
  const role = getSession()?.role;
  clearSession();
  // Every console now lands on a screen that SAYS the session ended, rather
  // than reappearing as a sign-in form with no explanation - design shipped
  // the shared teacher/admin frame on 31 Aug. The role is read before
  // `clearSession` above, which is the only moment it is still known, and it
  // picks the door the screen offers. The backend's admin roles are
  // `senco_admin` and `other_admin`, never a plain "admin".
  redirecting = true;
  window.location.assign(sessionExpiredDoor(role));
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

  // FormData carries its own multipart boundary, which only the browser can
  // generate - so it must be passed through untouched and its Content-Type
  // left unset. Everything else is JSON.
  const multipart = body instanceof FormData;

  const init: RequestInit = {
    ...rest,
    // Cookie auth by default; overridable for public cross-origin endpoints
    // (credentialed requests break under a wildcard CORS policy).
    credentials: rest.credentials ?? "include",
    headers: {
      Accept: "application/json",
      ...(body !== undefined && !multipart
        ? { "Content-Type": "application/json" }
        : {}),
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...headers,
    },
    ...(body !== undefined
      ? { body: multipart ? (body as FormData) : JSON.stringify(body) }
      : {}),
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
    // 401 ONLY. A 403 means the token was accepted as identity and the ACTION
    // was refused - a scope this admin does not hold. Treating it as a dead
    // session cleared the token and sent them to a door reading "your session
    // has ended ... for your security", which is a false explanation and loses
    // whatever they were doing. Scope filtering is client-side only
    // (`proxy.ts` checks role, never scope), so a bookmarked or deep-linked
    // route reaches a 403-able endpoint routinely, and a school with more than
    // one admin hits this on day one.
    if (response.status === 401) {
      handleAuthFailure(path, Boolean(token));
    }
    throw new ApiError(response.status, friendlyMessage(response.status), detail);
  }

  if (response.status === 204) return undefined as T;
  return (await response.json()) as T;
}

/**
 * The same request, kept as BYTES.
 *
 * `request` ends in `response.json()`, so a PDF could not go through it - and
 * the invoice list therefore rendered `<a href={pdfUrl}>`, a top-level
 * navigation that carries no Authorization header to a Bearer-protected route.
 * Every invoice PDF in the console answered 401 (or, for a backend-relative
 * `pdfUrl`, resolved against the Next origin and 404'd), with no other route to
 * the document anywhere on the screen.
 *
 * Auth, the proxy and the 401 latch are all shared with `request` deliberately:
 * a second hand-rolled fetch with its own `Authorization` header is how the
 * session handling drifts apart.
 */
export async function requestBlob(
  path: string,
  // A GET has no body, and `RequestOptions.body` is `unknown` - which is not a
  // `BodyInit` - so it is typed out rather than discarded at the call site.
  options: Omit<RequestOptions, "body"> = {},
): Promise<Blob> {
  const { params, headers, baseUrl, ...rest } = options;
  const url = buildUrl(path, params, baseUrl);
  const token = await getAuthToken();

  let response: Response;
  try {
    response = await fetch(url, {
      ...rest,
      method: "GET",
      credentials: rest.credentials ?? "include",
      headers: { ...(token ? { Authorization: `Bearer ${token}` } : {}), ...headers },
    });
  } catch (cause) {
    throw new ApiError(0, friendlyMessage(0), cause);
  }

  if (!response.ok) {
    if (response.status === 401) handleAuthFailure(path, Boolean(token));
    throw new ApiError(response.status, friendlyMessage(response.status));
  }
  return response.blob();
}

/** Convenience verbs over `request`. */
export const api = {
  /** A GET that keeps the bytes - see `requestBlob`. */
  blob: (path: string, options?: Omit<RequestOptions, "body">) =>
    requestBlob(path, options),
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
