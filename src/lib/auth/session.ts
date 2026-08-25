/**
 * Client-side auth session state (Product Arch A.2, backend Bearer contract).
 *
 * The FastAPI backend issues a Bearer access token on login (no cookie); the
 * token lives here - module state, mirrored to localStorage so a reload keeps
 * the session until `expires_at`. The api client reads it per request.
 *
 * Separately, the device remembers WHO signs in here (`RememberedProfile`) -
 * the login screen is a returning-student PIN unlock (frame 00: avatar +
 * "Welcome back"), so school code and login identifier come from the device,
 * never typed at the PIN screen.
 */

const SESSION_KEY = "nevo.auth.session";
const PROFILE_KEY = "nevo.auth.profile";
/** Set when the student renames themselves and no remembered profile exists. */
const DISPLAY_NAME_KEY = "nevo.auth.displayName";

/**
 * Role mirror for the route guard (`src/proxy.ts`). localStorage is never
 * sent to the server, so a server-side guard cannot see the session at all -
 * this cookie carries the ROLE and its expiry only, never the token, so the
 * guard can cheaply tell "plausibly a signed-in teacher" before rendering a
 * single byte of console.
 *
 * It is client-written and therefore forgeable. It is an optimistic routing
 * hint, never an authorization boundary: the backend's Bearer check is the
 * only thing that actually protects data.
 */
export const ROLE_COOKIE = "nevo.role";

function writeRoleCookie(role: string, expiresAt: string): void {
  if (typeof document === "undefined") return;
  const expires = new Date(expiresAt);
  const stamp = Number.isNaN(expires.getTime())
    ? ""
    : `; Expires=${expires.toUTCString()}`;
  // Secure would drop the cookie on plain-http local dev.
  const secure = window.location.protocol === "https:" ? "; Secure" : "";
  document.cookie = `${ROLE_COOKIE}=${encodeURIComponent(role)}; Path=/; SameSite=Lax${stamp}${secure}`;
}

function deleteRoleCookie(): void {
  if (typeof document === "undefined") return;
  document.cookie = `${ROLE_COOKIE}=; Path=/; Max-Age=0; SameSite=Lax`;
}

export interface StoredSession {
  token: string;
  /** ISO timestamp from the backend's `expires_at`. */
  expiresAt: string;
  userId: string;
  role: string;
}

/** The device's remembered student - seeded at onboarding/PIN creation. */
export interface RememberedProfile {
  schoolCode: string;
  loginIdentifier: string;
  displayName: string;
  /** Avatar initials, e.g. "AK". */
  initials: string;
}

let session: StoredSession | null = null;
let hydrated = false;

function hydrate(): void {
  if (hydrated || typeof window === "undefined") return;
  hydrated = true;
  try {
    const raw = window.localStorage.getItem(SESSION_KEY);
    if (raw) session = JSON.parse(raw) as StoredSession;
  } catch {
    session = null;
  }
}

export function getSession(): StoredSession | null {
  hydrate();
  if (session && Date.parse(session.expiresAt) <= Date.now()) clearSession();
  return session;
}

export function getToken(): string | undefined {
  return getSession()?.token;
}

export function setSession(next: StoredSession): void {
  hydrated = true;
  session = next;
  writeRoleCookie(next.role, next.expiresAt);
  try {
    window.localStorage.setItem(SESSION_KEY, JSON.stringify(next));
  } catch {
    // Private mode etc. - the in-memory session still works for this tab.
  }
}

export function clearSession(): void {
  hydrated = true;
  session = null;
  deleteRoleCookie();
  try {
    window.localStorage.removeItem(SESSION_KEY);
  } catch {
    // ignore
  }
}

export function getRememberedProfile(): RememberedProfile | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.localStorage.getItem(PROFILE_KEY);
    return raw ? (JSON.parse(raw) as RememberedProfile) : null;
  } catch {
    return null;
  }
}

/** Called when a student finishes onboarding / creates a PIN on this device. */
export function rememberProfile(profile: RememberedProfile): void {
  try {
    window.localStorage.setItem(PROFILE_KEY, JSON.stringify(profile));
  } catch {
    // ignore
  }
}

/**
 * The name the student is shown as. There is no profile endpoint, so the
 * edit on the profile screen persists to the device: it updates the
 * remembered profile when the device has one, and falls back to its own key
 * otherwise. Without this the screen flashed "Saved" and forgot the name on
 * the next load.
 *
 * TODO(api): replace with the profile endpoint once it exists.
 */
export function getStoredDisplayName(): string | null {
  if (typeof window === "undefined") return null;
  const remembered = getRememberedProfile();
  if (remembered?.displayName) return remembered.displayName;
  try {
    return window.localStorage.getItem(DISPLAY_NAME_KEY);
  } catch {
    return null;
  }
}

export function setStoredDisplayName(name: string, initials: string): void {
  const trimmed = name.trim();
  if (!trimmed) return;
  const remembered = getRememberedProfile();
  if (remembered) {
    rememberProfile({ ...remembered, displayName: trimmed, initials });
    return;
  }
  try {
    window.localStorage.setItem(DISPLAY_NAME_KEY, trimmed);
  } catch {
    // Private mode - the name simply will not survive this session.
  }
}
