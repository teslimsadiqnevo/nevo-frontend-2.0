"use client";

/**
 * Ephemeral behavioural-signal storage (SCRUM-76, NDPA 2023 §30/§37).
 *
 * High-frequency behavioural signals (keystroke rhythm, cursor patterns, click
 * streams, timing) power the affective inference layer (SCRUM-70). The safest
 * architecture is ephemeral: signals live on the device in IndexedDB, are
 * processed locally, and are deleted at session end. **No behavioural signal
 * ever leaves the device** - only inferred state or aggregated indicators are
 * transmitted, and never from this module.
 *
 * Lifecycle:
 * - session id persists page refreshes (sessionStorage) so mid-session
 *   reloads keep their signals;
 * - a session-boundary crossing purges the prior session's records;
 * - cleanup fires on explicit sign-out (`endEphemeralSession`), on
 *   `beforeunload`, and after 30 minutes of no interaction.
 *
 * No localStorage or cookie fallback, by design: if IndexedDB is unavailable
 * the signals are simply not stored.
 */

export type EphemeralSignalType = "keystroke" | "cursor" | "click" | "timing";

export interface EphemeralSignal {
  session_id: string;
  student_id: string;
  signal_type: EphemeralSignalType;
  timestamp: number;
  payload: Record<string, unknown>;
}

const DB_NAME = "nevo-ephemeral-signals";
const STORE = "nevo_session_signals";
const SESSION_KEY = "nevo-signal-session";
const IDLE_TIMEOUT_MS = 30 * 60 * 1_000;

let db: Promise<IDBDatabase | null> | null = null;
let listenersInstalled = false;
let idleTimer: ReturnType<typeof setTimeout> | null = null;
let studentId = "anonymous";

function openDb(): Promise<IDBDatabase | null> {
  db ??= new Promise((resolve) => {
    if (typeof indexedDB === "undefined") return resolve(null);
    const req = indexedDB.open(DB_NAME, 1);
    req.onupgradeneeded = () => {
      if (!req.result.objectStoreNames.contains(STORE))
        req.result.createObjectStore(STORE, { autoIncrement: true });
    };
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => resolve(null);
  });
  return db;
}

function resetIdleTimer() {
  if (idleTimer) clearTimeout(idleTimer);
  idleTimer = setTimeout(() => void clearSession(), IDLE_TIMEOUT_MS);
}

function installLifecycle() {
  if (listenersInstalled || typeof window === "undefined") return;
  listenersInstalled = true;
  // Best-effort purge when the tab goes away; the session-boundary purge on
  // next start covers the cases the browser cuts short.
  window.addEventListener("beforeunload", () => void clearSession());
  for (const ev of ["pointerdown", "keydown", "scroll"] as const)
    window.addEventListener(ev, resetIdleTimer, { passive: true });
  resetIdleTimer();
}

async function purgeOtherSessions(current: string) {
  const d = await openDb();
  if (!d) return;
  try {
    const tx = d.transaction(STORE, "readwrite");
    const store = tx.objectStore(STORE);
    const req = store.openCursor();
    req.onsuccess = () => {
      const cursor = req.result;
      if (!cursor) return;
      if ((cursor.value as EphemeralSignal).session_id !== current)
        cursor.delete();
      cursor.continue();
    };
  } catch {
    // Best-effort; ephemerality still holds via the other triggers.
  }
}

/** Who the signals belong to (set at sign-in; never transmitted from here). */
export function setEphemeralStudent(id: string) {
  studentId = id || "anonymous";
}

/** The current signal session id; created (and prior sessions purged) on first use. */
export function getSessionId(): string {
  if (typeof window === "undefined") return "ssr";
  installLifecycle();
  let id = sessionStorage.getItem(SESSION_KEY);
  if (!id) {
    id = `signals-${crypto.randomUUID?.() ?? Math.random().toString(36).slice(2)}`;
    sessionStorage.setItem(SESSION_KEY, id);
    void purgeOtherSessions(id);
  }
  return id;
}

/** Write one behavioural signal (device-local only). */
export async function writeSignal(
  type: EphemeralSignalType,
  payload: Record<string, unknown>,
): Promise<void> {
  const session = getSessionId();
  const d = await openDb();
  if (!d) return;
  try {
    const record: EphemeralSignal = {
      session_id: session,
      student_id: studentId,
      signal_type: type,
      timestamp: performance.now(),
      payload,
    };
    d.transaction(STORE, "readwrite").objectStore(STORE).add(record);
  } catch {
    // Storage is best-effort by design.
  }
}

/** Signals of a type within the last `secondsAgo` seconds, oldest first. */
export async function readRecentSignals(
  type: EphemeralSignalType,
  secondsAgo: number,
): Promise<EphemeralSignal[]> {
  const session = getSessionId();
  const d = await openDb();
  if (!d) return [];
  const cutoff = performance.now() - secondsAgo * 1_000;
  return new Promise((resolve) => {
    try {
      const req = d.transaction(STORE, "readonly").objectStore(STORE).getAll();
      req.onsuccess = () =>
        resolve(
          (req.result as EphemeralSignal[]).filter(
            (s) =>
              s.session_id === session &&
              s.signal_type === type &&
              s.timestamp >= cutoff,
          ),
        );
      req.onerror = () => resolve([]);
    } catch {
      resolve([]);
    }
  });
}

/** Delete every signal for the current session (id kept - same login session). */
export async function clearSession(): Promise<void> {
  const d = await openDb();
  if (!d) return;
  const session =
    typeof window === "undefined"
      ? null
      : sessionStorage.getItem(SESSION_KEY);
  if (!session) return;
  await new Promise<void>((resolve) => {
    try {
      const tx = d.transaction(STORE, "readwrite");
      const req = tx.objectStore(STORE).openCursor();
      req.onsuccess = () => {
        const cursor = req.result;
        if (!cursor) return resolve();
        if ((cursor.value as EphemeralSignal).session_id === session)
          cursor.delete();
        cursor.continue();
      };
      req.onerror = () => resolve();
    } catch {
      resolve();
    }
  });
}

/** Sign-out: purge the data AND retire the session id entirely. */
export async function endEphemeralSession(): Promise<void> {
  await clearSession();
  if (typeof window !== "undefined") sessionStorage.removeItem(SESSION_KEY);
  studentId = "anonymous";
}
