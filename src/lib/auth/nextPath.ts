/**
 * The path a signed-out child was trying to reach, if it is safe to send them
 * there afterwards.
 *
 * `proxy.ts` puts the wanted route in `?next=` when it bounces someone off a
 * student page, and both doors - the PIN unlock and the returning sign-in -
 * carry it across so a child lands where they were going rather than on Home.
 *
 * IT IS UNTRUSTED. It arrives in a URL, and a URL is something anyone can send
 * a child. Anything but a same-origin absolute path is dropped:
 *
 *   - `//evil.test/x` is protocol-relative. Browsers read it as a HOST, so it
 *     leaves the site entirely while looking like a path.
 *   - `https://evil.test` likewise, plainly.
 *   - `\evil.test` is treated as `//` by some browsers after normalisation.
 *   - a bare `dashboard` would resolve against whatever the current path is.
 *
 * Returning undefined means "no destination", and every caller falls back to
 * its own default. Losing a legitimate `next` costs a child one extra tap;
 * honouring a hostile one takes them off Nevo with a live session.
 */
export function safeNextPath(
  raw: string | null | undefined,
): string | undefined {
  if (!raw) return undefined;
  const path = raw.trim();
  if (!path.startsWith("/")) return undefined;
  // Covers `//host`, and `/\host` which normalises to the same thing.
  if (path.startsWith("//") || path.startsWith("/\\")) return undefined;
  return path;
}
