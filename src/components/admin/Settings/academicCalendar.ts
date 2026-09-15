import type { SchoolTerm } from "@/lib/api/school";

/**
 * D12.3's term calendar: what a school may save, and what Nevo is actually
 * told when they do.
 *
 * Pure and separate from the screen because both halves of this had gone
 * wrong quietly.
 *
 * VALIDATION DID NOT EXIST. SCRUM-99: "Overlaps and gaps are surfaced as a
 * plain line under the offending row on blur, in navy not red ... Save stays
 * disabled while any row is unresolved, with a live count beside it." A school
 * could save a second term starting before the first one ended, and every
 * "this half-term" figure in the product resolves through this record.
 *
 * AND THE SAVE WROTE TO A FIELD NOTHING READS. `saveCalendar` sent
 * `yearStart`, `yearEnd` and `terms` - all three of which are OURS, invented
 * client-side and stored in a blob the backend passes through untouched. The
 * one field Nevo actually reads is `termStartDates`, whose own description
 * says: "Term start dates as ISO dates, earliest first ... fewer means Nevo
 * falls back to splitting the contract year evenly."
 *
 * So a school that carefully set three term dates in Settings had told Nevo
 * nothing at all, and every period figure in the product went on splitting
 * their year into equal thirds. `termStartDatesFrom` is what closes that.
 */

/** A term row whose dates we could not read is not evidence of anything. */
function at(iso: string | undefined): number | null {
  if (!iso) return null;
  const t = Date.parse(iso);
  return Number.isNaN(t) ? null : t;
}

export type TermProblem =
  | { kind: "reversed" }
  | { kind: "overlap"; previous: string }
  | { kind: "half-outside" }
  | { kind: "half-reversed" };

export interface TermIssue {
  /** Index into the terms array, so the line renders under its own row. */
  index: number;
  problem: TermProblem;
  /** The line to show, in the spec's own shape. Navy, never red. */
  message: string;
}

/**
 * Every problem, in row order.
 *
 * A GAP IS NOT A PROBLEM. SCRUM-99 groups "overlaps and gaps" in one phrase,
 * but a Nigerian school year has real gaps in it - the frame's own fixture
 * runs First term to 11 December and Second from 11 January. Flagging the
 * holidays between terms as something to resolve would disable Save on a
 * correctly-configured calendar, which is worse than not checking. Only an
 * ORDER that cannot be true is an issue.
 */
export function termIssues(terms: SchoolTerm[]): TermIssue[] {
  const issues: TermIssue[] = [];

  terms.forEach((term, i) => {
    const start = at(term.start);
    const end = at(term.end);

    if (start !== null && end !== null && end < start) {
      issues.push({
        index: i,
        problem: { kind: "reversed" },
        message: `${term.name} ends before it starts.`,
      });
    }

    const previous = terms[i - 1];
    const previousEnd = at(previous?.end);
    if (start !== null && previousEnd !== null && start < previousEnd) {
      issues.push({
        index: i,
        problem: { kind: "overlap", previous: previous.name },
        // SCRUM-99's copy line: "Second term starts before First term ends."
        message: `${term.name} starts before ${previous.name} ends.`,
      });
    }

    const halfStart = at(term.halfTermStart);
    const halfEnd = at(term.halfTermEnd);
    if (halfStart !== null && halfEnd !== null && halfEnd < halfStart) {
      issues.push({
        index: i,
        problem: { kind: "half-reversed" },
        message: `The half-term break in ${term.name} ends before it starts.`,
      });
    }
    if (
      start !== null &&
      end !== null &&
      ((halfStart !== null && (halfStart < start || halfStart > end)) ||
        (halfEnd !== null && (halfEnd < start || halfEnd > end)))
    ) {
      issues.push({
        index: i,
        problem: { kind: "half-outside" },
        message: `The half-term break falls outside ${term.name}.`,
      });
    }
  });

  return issues;
}

/** The live count SCRUM-99 asks for beside a disabled Save. */
export function unresolvedLine(issues: TermIssue[]): string | null {
  if (issues.length === 0) return null;
  const rows = new Set(issues.map((i) => i.index)).size;
  return `${rows} ${rows === 1 ? "term needs" : "terms need"} a date sorted out.`;
}

/**
 * The three ISO dates Nevo actually reads, earliest first.
 *
 * `AcademicConfig.termStartDates` is `format: date` with `maxItems: 3`, so
 * this emits `2026-09-14`, never a date-time, and never more than three.
 *
 * TODO(api): `maxItems: 3` cannot express a four-term year, and this screen
 * offers "Add a term" for exactly that case - SCRUM-99 calls it "a quiet
 * action for schools running four terms". A four-term school currently has its
 * fourth start silently dropped. Either the cap moves or the action should not
 * be offered; guessing which is not this file's call.
 */
export function termStartDatesFrom(terms: SchoolTerm[]): string[] {
  return terms
    .map((t) => t.start)
    .filter((s): s is string => typeof s === "string" && s.length > 0)
    .filter((s) => !Number.isNaN(Date.parse(s)))
    .sort((a, b) => Date.parse(a) - Date.parse(b))
    .map((s) => s.slice(0, 10))
    .slice(0, 3);
}
