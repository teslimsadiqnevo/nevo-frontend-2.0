/**
 * "2 hours ago", or "never".
 *
 * Extracted verbatim from `SsoView`, where it was private, so the IT home and
 * the IT screen cannot drift into describing the same sync differently. A
 * second copy is how two screens end up disagreeing about one school.
 *
 * "never" for null AND for an unparseable string: both mean we have no instant
 * to report, and neither is an error worth its own wording here.
 */
export function timeAgo(iso: string | null): string {
  if (!iso) return "never";
  const then = Date.parse(iso);
  if (Number.isNaN(then)) return "never";
  const mins = Math.round((Date.now() - then) / 60000);
  if (mins < 2) return "just now";
  if (mins < 60) return `${mins} minutes ago`;
  const hrs = Math.round(mins / 60);
  if (hrs < 24) return `${hrs} hour${hrs === 1 ? "" : "s"} ago`;
  const days = Math.round(hrs / 24);
  return `${days} day${days === 1 ? "" : "s"} ago`;
}
