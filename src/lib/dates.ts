/**
 * "14 July 2026", or null when the string is not a date we can read.
 *
 * NULL, not a dash and not "Invalid Date". A date we cannot parse is a fact we
 * do not have, and this console does not print a placeholder for a fact it does
 * not have - the caller drops the line instead.
 *
 * en-GB with a full month and an EXPLICIT YEAR. The year is not optional: a
 * teacher-class assignment can easily predate the current school year, and
 * "14 July" beside a role would read as this one.
 */
export function longDate(iso: string | null | undefined): string | null {
  if (!iso) return null;
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return null;
  return d.toLocaleDateString("en-GB", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}
