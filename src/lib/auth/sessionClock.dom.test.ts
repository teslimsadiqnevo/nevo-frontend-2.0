import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { clearSession, getSession, setSession } from "./session";
import { noteServerClock, resetServerClock } from "@/lib/api/serverClock";

/**
 * A tablet with a wrong clock could not stay signed in at all.
 *
 * `expiresAt` comes from the SERVER; `Date.now()` comes from the DEVICE. The
 * expiry check compared them directly, so a clock that was wrong did not give a
 * child a degraded session — it gave them none:
 *
 *   - CLOCK AHEAD by more than a session's length: every session is expired the
 *     instant it is issued. The child types the correct PIN, receives a real
 *     token, and `getSession()` discards it before the next read. Back to the
 *     PIN screen, forever, with nothing on screen to explain it. A school
 *     tablet that lost its battery and came back on a default date is exactly
 *     this.
 *   - CLOCK BEHIND: quieter and worse to debug. The session looks alive long
 *     after it died, so the child is thrown out mid-lesson by a 401, and
 *     `useLessonProgress.report()` silently drops everything after that moment.
 *
 * The question is now "how long has this device had this session?" rather than
 * "what time does this device think it is?" — a constant offset cancels,
 * because the clock is wrong by the same amount at both readings.
 */

const HOUR = 60 * 60 * 1000;

/** A session the server says is good for an hour. */
const issue = (lifeMs = HOUR) => ({
  token: "tok",
  expiresAt: new Date(Date.now() + lifeMs).toISOString(),
  userId: "student-1",
  role: "student",
});

/** Move the device clock, exactly as a wrong tablet would have it. */
const setClock = (ms: number) => vi.setSystemTime(ms);

/**
 * Let the app see one server response, which is where the correction comes
 * from. `Date` is on every HTTP response; this is the same thing the api client
 * does for real.
 */
const serverSays = (whenMs: number) =>
  noteServerClock({
    headers: { get: () => new Date(whenMs).toUTCString() },
  } as unknown as Response);

beforeEach(() => {
  vi.useFakeTimers();
  resetServerClock();
  clearSession();
  window.localStorage.clear();
});

afterEach(() => {
  vi.useRealTimers();
  resetServerClock();
  clearSession();
  window.localStorage.clear();
});

describe("a session's life is measured in elapsed time", () => {
  it("keeps a fresh session", () => {
    setSession(issue());

    expect(getSession()).not.toBeNull();
  });

  it("expires it once its life has actually elapsed", () => {
    setSession(issue());

    vi.advanceTimersByTime(HOUR + 1000);

    expect(getSession()).toBeNull();
  });

  it("does not expire it a minute early", () => {
    setSession(issue());

    vi.advanceTimersByTime(HOUR - 60_000);

    expect(getSession()).not.toBeNull();
  });

  it("survives a device clock running a day fast", () => {
    /*
     * THE ONE THAT LOCKED CHILDREN OUT. The server issues an hour. The device
     * believes it is tomorrow, so `expiresAt` sits 23 hours in its past, and
     * the old comparison discarded the token on arrival - the child could never
     * get past the PIN screen, with nothing on screen to explain it.
     */
    const serverNow = Date.now();
    const expiresAt = new Date(serverNow + HOUR).toISOString();
    setClock(serverNow + 24 * HOUR);
    serverSays(serverNow);

    setSession({
      token: "tok",
      expiresAt,
      userId: "student-1",
      role: "student",
    });

    expect(getSession()).not.toBeNull();
  });

  it("still ends that session when its hour is actually up", () => {
    // The correction locates "now"; it does not extend a life. A session the
    // server considers expired is still expired.
    const serverNow = Date.now();
    const expiresAt = new Date(serverNow + HOUR).toISOString();
    setClock(serverNow + 24 * HOUR);
    serverSays(serverNow);
    setSession({
      token: "tok",
      expiresAt,
      userId: "student-1",
      role: "student",
    });

    vi.advanceTimersByTime(HOUR + 60_000);

    expect(getSession()).toBeNull();
  });

  it("survives a device clock running a day slow", () => {
    const serverNow = Date.now();
    const expiresAt = new Date(serverNow + HOUR).toISOString();
    setClock(serverNow - 24 * HOUR);
    serverSays(serverNow);
    setSession({
      token: "tok",
      expiresAt,
      userId: "student-1",
      role: "student",
    });

    expect(getSession()).not.toBeNull();
  });

  it("does not let a slow clock keep a dead session alive", () => {
    // The mirror failure, and the quieter one: the child gets thrown out
    // mid-lesson by a 401 instead, and every position after that is dropped.
    const serverNow = Date.now();
    const expiresAt = new Date(serverNow - HOUR).toISOString();
    setClock(serverNow - 24 * HOUR);
    serverSays(serverNow);
    setSession({
      token: "tok",
      expiresAt,
      userId: "student-1",
      role: "student",
    });

    expect(getSession()).toBeNull();
  });

  it("behaves exactly as before when no response has been seen", () => {
    // Skew is 0 until the app has spoken to the server once, which is the
    // behaviour that shipped. Nothing about a first paint changes.
    setSession({
      token: "tok",
      expiresAt: new Date(Date.now() - 1000).toISOString(),
      userId: "student-1",
      role: "student",
    });

    expect(getSession()).toBeNull();
  });

  /*
   * The two below write straight to storage, as an older build would have left
   * it - no `storedAt`. That needs a FRESH MODULE: `session.ts` hydrates from
   * storage exactly once, and `clearSession()` in `beforeEach` has already
   * marked it hydrated, so a later write is never read.
   *
   * Worth spelling out because the first version of these tests did not do it,
   * and the "expired" one PASSED - not because expiry was evaluated, but
   * because nothing was ever loaded. It asserted null against null.
   */
  const freshSession = async (stored: Record<string, unknown>) => {
    window.localStorage.setItem("nevo.auth.session", JSON.stringify(stored));
    vi.resetModules();
    return await import("./session");
  };

  it("falls back to the old rule for a session stored before this existed", async () => {
    const mod = await freshSession({
      token: "tok",
      expiresAt: new Date(Date.now() - HOUR).toISOString(),
      userId: "student-1",
      role: "student",
    });

    expect(mod.getSession()).toBeNull();
  });

  it("keeps an unexpired session that predates this change", async () => {
    const mod = await freshSession({
      token: "tok",
      expiresAt: new Date(Date.now() + HOUR).toISOString(),
      userId: "student-1",
      role: "student",
    });

    expect(mod.getSession()).not.toBeNull();
  });

  it("does not throw away a session whose expiry it cannot read", () => {
    // A malformed date is our problem or the server's, not the child's, and
    // discarding the token would sign them out for it.
    setSession({
      token: "tok",
      expiresAt: "not-a-date",
      userId: "student-1",
      role: "student",
    });

    expect(getSession()).not.toBeNull();
  });
});
