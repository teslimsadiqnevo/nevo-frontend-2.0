"use client";

import { useEffect, useRef } from "react";
import { authApi } from "@/lib/api/auth";
import { getSession } from "@/lib/auth/session";

/**
 * Keeps a signed-in session alive.
 *
 * A session carried `expires_at` and nothing renewed it. When it passed,
 * `getSession()` cleared itself - so no token was sent, nothing 401'd, and the
 * redirect that would have sent someone to sign in never fired. A child came
 * back the next morning to the signed-out walkthrough wearing another child's
 * name. The route guard now catches that, but catching it is not the same as
 * not doing it: a child mid-lesson still lost their session and their place.
 *
 * `POST /auth/session/refresh` (7 Sep) is the fix, and being Bearer it decides
 * the shape of this hook: it renews a LIVE token, so the work has to happen
 * before expiry. There is no useful "refresh on 401" - at that point the token
 * this endpoint needs is exactly the thing that is gone.
 *
 * So: schedule one refresh a margin ahead of expiry, and check again whenever
 * the tab is brought back, because a sleeping laptop does not fire timers.
 *
 * ON FAILURE, BACK OFF. The first version of this said in a comment that
 * "retrying a refusal in a loop would just spend a dying token faster" - and
 * then did exactly that. `run()` only fires once `now` has reached
 * `expiresAt - MARGIN_MS`, so by the time it runs `due` is already zero; a
 * failed attempt fell through `finally` into an unconditional `schedule()`,
 * `Math.max(due, 0)` gave `0`, and it re-fired immediately. Offline, `fetch`
 * rejects at once into `ApiError(0)`, so it span as fast as the network stack
 * could refuse - for the whole two-minute margin, on a child's metered mobile
 * data, mid-lesson. The comment claiming otherwise is why nobody saw it.
 */

/**
 * How far ahead of expiry to renew. Long enough that a slow request still
 * lands inside the old token's life, short enough not to renew constantly on
 * a short session.
 */
const MARGIN_MS = 2 * 60 * 1000;

/** `setTimeout` overflows past ~24.8 days and fires immediately. */
const MAX_DELAY_MS = 20 * 24 * 60 * 60 * 1000;

/**
 * After a failed refresh, wait this long before trying again, doubling each
 * time. The token is still alive for up to `MARGIN_MS`, so a transient blip is
 * worth a few more attempts - but a backend having a bad minute is not worth
 * one attempt per millisecond.
 */
const RETRY_BASE_MS = 10 * 1000;
const RETRY_MAX_MS = 60 * 1000;

/**
 * No two attempts ever land closer together than this, whatever the arithmetic
 * says. The backoff above handles the failure case; this also covers the one
 * that has no failure to count - a server returning a token that is already
 * inside the margin, which would otherwise renew, reschedule at zero, and
 * renew again forever.
 */
const MIN_GAP_MS = 5 * 1000;

export function useSessionRefresh(): void {
  // One refresh in flight at a time. StrictMode mounts effects twice in dev,
  // and a visibility change can land on top of a scheduled run.
  const running = useRef(false);

  useEffect(() => {
    let cancelled = false;
    let timer: ReturnType<typeof setTimeout> | undefined;
    /** Consecutive failures; reset by any success. Drives the backoff. */
    let failures = 0;
    /** When the last attempt STARTED. 0 = none yet, so the first is immediate. */
    let lastAttempt = 0;

    const run = async () => {
      if (cancelled || running.current) return;
      // Reads the session fresh each time: it may have been cleared, replaced
      // by another tab, or signed out from under this one.
      const session = getSession();
      if (!session) return;
      running.current = true;
      lastAttempt = Date.now();
      let succeeded = false;
      try {
        await authApi.refresh();
        succeeded = true;
      } catch {
        // Leave the session as it is. If it has genuinely expired the existing
        // path handles it - `getSession()` clears it and the route guard sends
        // them to their door. What must NOT happen is an immediate retry; see
        // the backoff in `schedule`.
      } finally {
        running.current = false;
        failures = succeeded ? 0 : failures + 1;
        if (!cancelled) schedule();
      }
    };

    const schedule = () => {
      clearTimeout(timer);
      const session = getSession();
      if (cancelled || !session) return;

      const due = Date.parse(session.expiresAt) - MARGIN_MS - Date.now();
      // An unparseable date means we cannot know when to renew, so renew now
      // rather than never - the floors below still keep it from spinning.
      const base = Number.isNaN(due) ? 0 : Math.max(due, 0);

      const backoff =
        failures > 0
          ? Math.min(RETRY_BASE_MS * 2 ** (failures - 1), RETRY_MAX_MS)
          : 0;
      const sinceLast = lastAttempt ? Date.now() - lastAttempt : Infinity;
      const floor = Math.max(backoff, MIN_GAP_MS - sinceLast, 0);

      const delay = Math.min(Math.max(base, floor), MAX_DELAY_MS);
      timer = setTimeout(() => void run(), delay);
    };

    // A backgrounded tab's timers are throttled and a sleeping machine's do
    // not run at all, so returning to the tab re-checks rather than trusting
    // whatever was scheduled before. It goes through the same floors, so a tab
    // switched to and from repeatedly cannot be used to hammer the endpoint.
    const onVisible = () => {
      if (document.visibilityState === "visible") schedule();
    };

    schedule();
    document.addEventListener("visibilitychange", onVisible);

    return () => {
      cancelled = true;
      clearTimeout(timer);
      document.removeEventListener("visibilitychange", onVisible);
    };
  }, []);
}
