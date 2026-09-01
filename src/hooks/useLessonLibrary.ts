"use client";

import { useCallback } from "react";
import { lessonsApi, type LessonSummary, type LessonSourceType } from "@/lib/api/lessons";
import { useLiveQuery } from "./useLiveQuery";
import {
  LIBRARY_LESSONS,
  type LibrarySubject,
} from "@/lib/mocks/teacherLibrary";

/**
 * The lesson library, live-first: GET /api/content/lessons when a session
 * exists, the design fixtures otherwise.
 *
 * WHAT THE ENDPOINT GIVES US, and what it does not. A lesson row carries its
 * title, how it was uploaded, how many segments came out, how many of those
 * want a human eye, and when it was created. It carries no subject and no
 * assignment, which is why two things the frame draws cannot be live:
 *
 *   - the subject pills have nothing to filter on, so they are hidden rather
 *     than left inert over real lessons;
 *   - "Assigned to JSS 2A" has no source here. `/api/v1/assignments` holds
 *     that, but it is one of the 55 endpoints the backend ships without a
 *     response model, so it is not typed yet.
 *
 * The status pill also changes meaning. The frame's Assigned/Ready/Draft is
 * about where a lesson is in the teacher's workflow; the API's status is
 * about where it is in the PARSER. A live library reports the parse honestly
 * instead of dressing it up as the other thing.
 *
 * Design drew all three card states on 31 Aug (needs-review badge, still
 * parsing, couldn't process) and they are built. `subject` and
 * `assignmentCount` shipped the same day; the footer uses the count, and
 * treats ABSENT as different from zero because it is not a required field.
 *
 * `subject` is read but not filtered on: `POST /api/content/upload` takes
 * only a file, so no lesson this console creates carries one and the pill row
 * would be a single dead "All". Only the staged routes accept a subject.
 */

export type CardStatus =
  | "Assigned"
  | "Ready"
  | "Draft"
  | "Needs review"
  | "Preparing"
  | "Didn’t parse";

/**
 * Which of C06's three card treatments this row gets. A lesson that is still
 * parsing, or that failed to parse, is NOT a link: there is nothing on the
 * other side of it yet, and the frame marks both `cursor:default`.
 */
export type CardKind = "normal" | "parsing" | "failed";

export interface LibraryCard {
  id: string;
  title: string;
  status: CardStatus;
  kind: CardKind;
  /** Draws C06's eye badge in place of the status pill. */
  needsReview: boolean;
  /** Segment count and origin, or the fixture's subject line. */
  meta: string;
  /** The quiet third line. */
  footer: string;
  /** Fixtures only - a live lesson has no subject to filter on. */
  subject?: LibrarySubject;
}

const SOURCE_LABEL: Record<LessonSourceType, string> = {
  pdf: "PDF",
  word: "Word",
  powerpoint: "Slides",
  google_drive: "Drive",
  onedrive: "OneDrive",
  text: "Text",
};

/**
 * `needsReview` is the parser's own flag and is independent of `status`:
 * `reviewSegmentCount` is a required integer on every summary row, and
 * nothing in the contract ties the two together.
 *
 * This used to be read only under `completed_with_review`, while the FOOTER
 * tested `reviewSegmentCount` with no status guard at all - so a lesson that
 * came back `completed` with segments flagged drew a grey "Ready" pill above
 * "3 sections want a look". The card contradicted itself, and the pill won
 * the glance.
 */
function needsReviewOf(lesson: LessonSummary): boolean {
  return (
    lesson.reviewSegmentCount > 0 &&
    lesson.status !== "failed" &&
    lesson.status !== "pending" &&
    lesson.status !== "processing"
  );
}

function statusOf(lesson: LessonSummary): CardStatus {
  switch (lesson.status) {
    case "completed":
      return lesson.reviewSegmentCount > 0 ? "Needs review" : "Ready";
    case "completed_with_review":
      return lesson.reviewSegmentCount > 0 ? "Needs review" : "Ready";
    case "pending":
    case "processing":
      return "Preparing";
    case "failed":
      return "Didn’t parse";
  }
}

function addedLine(lesson: LessonSummary): string {
  return `Added ${new Date(lesson.createdAt).toLocaleDateString("en-GB", {
    day: "numeric",
    month: "long",
  })}`;
}

/**
 * The frame's third line is the assignment story. `assignmentCount` shipped on
 * the summary on 31 Aug - but it is NOT in the schema's `required` list, so a
 * spec-legal response can omit it.
 *
 * Absent and zero are therefore different things, and only zero may be
 * rendered as "Not yet assigned". An absent count falls through to the added
 * date rather than asserting a lesson is unassigned when it may be assigned
 * to a whole class.
 *
 * The review signal moved to the badge, so it no longer competes for this
 * line - which is what let the card contradict itself before.
 */
function footerOf(lesson: LessonSummary): string {
  if (lesson.status === "failed") return "We couldn’t read this file";
  if (lesson.status === "pending" || lesson.status === "processing") {
    return "Nevo is reading it now";
  }
  const n = lesson.assignmentCount;
  if (typeof n !== "number") return addedLine(lesson);
  if (n === 0) return "Not yet assigned";
  return `Assigned to ${n} ${n === 1 ? "student" : "students"}`;
}

function toCard(lesson: LessonSummary): LibraryCard {
  const n = lesson.segmentCount;
  const kind: CardKind =
    lesson.status === "failed"
      ? "failed"
      : lesson.status === "pending" || lesson.status === "processing"
        ? "parsing"
        : "normal";
  return {
    id: lesson.id,
    title: lesson.title,
    status: statusOf(lesson),
    kind,
    needsReview: needsReviewOf(lesson),
    // C06's meta line gained a duration on 1 Sep. 0 and absent both mean "no
    // estimate" - the figure is floored per content type server-side, so a
    // real lesson is never 0 minutes and "0 min" would be a claim.
    meta: [
      `${n} ${n === 1 ? "section" : "sections"}`,
      SOURCE_LABEL[lesson.sourceType] ?? lesson.sourceType,
      lesson.estimatedMinutes ? `${lesson.estimatedMinutes} min` : null,
    ]
      .filter(Boolean)
      .join(" · "),
    footer: footerOf(lesson),
  };
}

const FIXTURE_CARDS: LibraryCard[] = LIBRARY_LESSONS.map((l) => ({
  id: l.id,
  title: l.title,
  status: l.status,
  kind: "normal",
  // The designed fixtures only carry Assigned/Ready/Draft - none is a
  // review state, so no fixture card draws the badge.
  needsReview: false,
  meta: l.meta,
  footer: l.assigned,
  subject: l.subject,
}));

export interface LessonLibraryState {
  cards: LibraryCard[];
  /** Real lessons are in hand - subject pills do not apply. */
  live: boolean;
  /** The call failed, so fixtures stand in. */
  sample: boolean;
  loading: boolean;
  /** Still waiting, long enough to say so. */
  slow: boolean;
}

export function useLessonLibrary(): LessonLibraryState {
  const run = useCallback(() => lessonsApi.list(), []);
  const { data, failed, slow, loading } = useLiveQuery<LessonSummary[]>(run, []);

  if (data === null) {
    return { cards: FIXTURE_CARDS, live: false, sample: failed, loading, slow };
  }
  return {
    cards: data.map(toCard),
    live: true,
    sample: false,
    loading: false,
    slow: false,
  };
}
