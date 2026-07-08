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

const BASE_URL =
  process.env.NEXT_PUBLIC_API_URL?.replace(/\/$/, "") ?? "http://localhost:8000";

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

// TODO(auth): source the token from the real session mechanism (httpOnly cookie
// / JWT) once the FastAPI auth contract is defined — see proxy.ts. Cookie-based
// auth already works via `credentials: "include"` below.
async function getAuthToken(): Promise<string | undefined> {
  return undefined;
}

type QueryValue = string | number | boolean | null | undefined;

export interface RequestOptions extends Omit<RequestInit, "body"> {
  /** JSON-serializable request body. */
  body?: unknown;
  /** Query-string params. */
  params?: Record<string, QueryValue>;
}

function buildUrl(path: string, params?: Record<string, QueryValue>): string {
  const url = new URL(`${BASE_URL}${path.startsWith("/") ? path : `/${path}`}`);
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
  const { body, params, headers, ...rest } = options;
  const url = buildUrl(path, params);
  const token = await getAuthToken();

  const init: RequestInit = {
    ...rest,
    credentials: "include",
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
