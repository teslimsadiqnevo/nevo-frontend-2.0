/**
 * How far this device's clock is from the server's.
 *
 * `expiresAt` is a SERVER timestamp and `Date.now()` is a DEVICE one, so a
 * tablet with a wrong clock cannot hold a session at all unless the two are
 * reconciled - see `hasExpired` in `lib/auth/session.ts`.
 *
 * Every HTTP response carries a `Date` header, so the server's notion of "now"
 * costs nothing to observe. This lives in its OWN module rather than in
 * `client.ts` because `client.ts` already imports from `lib/auth/session.ts`,
 * and having the session import back would close an import cycle.
 */

/** Positive when this device is AHEAD of the server. Null until a response. */
let skewMs: number | null = null;

/**
 * Zero until a response has been seen - "no reason to think the clock is
 * wrong", which is the safe default and the behaviour that shipped.
 */
export function deviceClockSkewMs(): number {
  return skewMs ?? 0;
}

/**
 * Record the server's clock from a response.
 *
 * Called for EVERY response, success or failure: a 401 tells us the time as
 * reliably as a 200, and a device with a bad clock is likelier to be seeing
 * failures than successes.
 */
export function noteServerClock(response: Response): void {
  const header = response.headers.get("Date");
  if (!header) return;
  const serverNow = Date.parse(header);
  if (Number.isNaN(serverNow)) return;
  skewMs = Date.now() - serverNow;
}

/** Test seam. */
export function resetServerClock(): void {
  skewMs = null;
}
