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
  try {
    window.localStorage.setItem(SESSION_KEY, JSON.stringify(next));
  } catch {
    // Private mode etc. - the in-memory session still works for this tab.
  }
}

export function clearSession(): void {
  hydrated = true;
  session = null;
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
