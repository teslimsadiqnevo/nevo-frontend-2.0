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
 */

/**
 * How far ahead of expiry to renew. Long enough that a slow request still
 * lands inside the old token's life, short enough not to renew constantly on
 * a short session.
 */
const MARGIN_MS = 2 * 60 * 1000;

/** `setTimeout` overflows past ~24.8 days and fires immediately. */
const MAX_DELAY_MS = 20 * 24 * 60 * 60 * 1000;

export function useSessionRefresh(): void {
  // One refresh in flight at a time. StrictMode mounts effects twice in dev,
  // and a visibility change can land on top of a scheduled run.
  const running = useRef(false);

  useEffect(() => {
    let cancelled = false;
    let timer: ReturnType<typeof setTimeout> | undefined;

    const run = async () => {
      if (cancelled || running.current) return;
      // Reads the session fresh each time: it may have been cleared, replaced
      // by another tab, or signed out from under this one.
      const session = getSession();
      if (!session) return;
      running.current = true;
      try {
        await authApi.refresh();
      } catch {
        // Leave it. The session is still whatever it was, and if that has
        // genuinely expired the existing path handles it - `getSession()`
        // clears it and the route guard sends them to their door. Retrying a
        // refusal in a loop would just spend a dying token faster.
      } finally {
        running.current = false;
        if (!cancelled) schedule();
      }
    };

    const schedule = () => {
      clearTimeout(timer);
      const session = getSession();
      if (cancelled || !session) return;
      const due = Date.parse(session.expiresAt) - MARGIN_MS - Date.now();
      // Already inside the margin (or an unparseable date): go now rather than
      // scheduling something in the past.
      const delay = Number.isNaN(due) ? 0 : Math.min(Math.max(due, 0), MAX_DELAY_MS);
      timer = setTimeout(() => void run(), delay);
    };

    // A backgrounded tab's timers are throttled and a sleeping machine's do
    // not run at all, so returning to the tab re-checks rather than trusting
    // whatever was scheduled before.
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
