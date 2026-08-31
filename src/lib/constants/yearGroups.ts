/**
 * The canonical year-group taxonomy (SCRUM-40, "Two axes: year group and class").
 *
 * Two axes, and they are not the same thing. A YEAR GROUP is one of the fixed
 * Nigerian levels below. A CLASS is named freely by the school - "JSS 2A",
 * "SSS 1 Sciences". A student holds exactly one of each; a teacher may teach
 * across any number of year groups.
 *
 * THE ENUM IS PERMANENT, ONLY ITS LABELS VARY. A British school's "Year 1" and
 * an IB school's own naming are both the same underlying `p1`. The spec is
 * blunt about what follows from that, and it is worth repeating here because
 * every one of these is easy to break by accident:
 *
 *   - never store a display label
 *   - never branch logic on one
 *   - never compare or sort year groups by their text
 *
 * Sorting and comparison go through `yearGroupOrder`, which is the index in
 * `YEAR_GROUPS`. That is what keeps cross-school comparisons meaningful.
 *
 * TODO(api): SCRUM-40 calls for `GET year_group_labels`, a per-school display
 * map owned by SCRUM-99 Settings. No such endpoint exists - `GET /api/v1/school`
 * returns `academicConfig` as an untyped `object`, so there is nothing to read
 * a label map out of yet. `yearGroupLabel` is the single lookup every surface
 * calls, so when the map lands it changes here and nowhere else. Until then it
 * returns the default Nigerian label.
 *
 * SPEC DEFECT, raised not guessed: SCRUM-40 says "17 canonical Nigerian levels"
 * in two places, then enumerates sixteen (n1, n2, kg1, kg2, p1-p6, jss1-jss3,
 * ss1-ss3). Sixteen is what is written down, so sixteen is what is here. The
 * missing seventeenth - most likely a creche or pre-nursery level below n1 - is
 * a question for design rather than something to invent.
 */

export const YEAR_GROUPS = [
  "n1",
  "n2",
  "kg1",
  "kg2",
  "p1",
  "p2",
  "p3",
  "p4",
  "p5",
  "p6",
  "jss1",
  "jss2",
  "jss3",
  "ss1",
  "ss2",
  "ss3",
] as const;

export type YearGroup = (typeof YEAR_GROUPS)[number];

/**
 * Default Nigerian display labels. Per-school overrides replace these once the
 * SCRUM-99 label map exists; the keys never change.
 */
const DEFAULT_LABELS: Record<YearGroup, string> = {
  n1: "Nursery 1",
  n2: "Nursery 2",
  kg1: "KG 1",
  kg2: "KG 2",
  p1: "Primary 1",
  p2: "Primary 2",
  p3: "Primary 3",
  p4: "Primary 4",
  p5: "Primary 5",
  p6: "Primary 6",
  jss1: "JSS 1",
  jss2: "JSS 2",
  jss3: "JSS 3",
  ss1: "SS 1",
  ss2: "SS 2",
  ss3: "SS 3",
};

function isYearGroup(value: string): value is YearGroup {
  return (YEAR_GROUPS as readonly string[]).includes(value);
}

/**
 * The one lookup every surface reads a year-group label through - this screen,
 * the create sheet, class detail, student detail, and the SCRUM-98/100 surfaces
 * that name a year group. One lookup, not per-screen strings, so a school
 * changing its taxonomy changes every screen at once.
 *
 * A value the enum does not know is passed straight back rather than blanked:
 * the backend types `yearGroup` as a free `string|null`, and showing what it
 * actually said beats showing nothing.
 */
export function yearGroupLabel(value: string | null | undefined): string | null {
  if (!value) return null;
  return isYearGroup(value) ? DEFAULT_LABELS[value] : value;
}

/** Sort key. Unknown values sort after every known level, in their own order. */
export function yearGroupOrder(value: string | null | undefined): number {
  if (!value || !isYearGroup(value)) return YEAR_GROUPS.length;
  return YEAR_GROUPS.indexOf(value);
}

/** The select's options, in the enum's own order. */
export const YEAR_GROUP_OPTIONS: ReadonlyArray<{ value: YearGroup; label: string }> =
  YEAR_GROUPS.map((value) => ({ value, label: DEFAULT_LABELS[value] }));
