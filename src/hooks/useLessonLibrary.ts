"use client";

import { useEffect, useState } from "react";
import { lessonsApi, type LessonSummary, type LessonSourceType } from "@/lib/api/lessons";
import { getToken } from "@/lib/auth/session";
import { useHasSession } from "./useHasSession";
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
 * TODO(design): the frame has no state for a lesson that is still parsing or
 * that failed to parse, and no treatment for "needs review" on a library card.
 * TODO(api): a subject on the lesson, and assignment counts in the summary.
 */

const LIVE_TIMEOUT_MS = 6000;

export type CardStatus =
  | "Assigned"
  | "Ready"
  | "Draft"
  | "Needs review"
  | "Preparing"
  | "Didn’t parse";

export interface LibraryCard {
  id: string;
  title: string;
  status: CardStatus;
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

function statusOf(lesson: LessonSummary): CardStatus {
  switch (lesson.status) {
    case "completed":
      return "Ready";
    case "completed_with_review":
      return lesson.reviewSegmentCount > 0 ? "Needs review" : "Ready";
    case "pending":
    case "processing":
      return "Preparing";
    case "failed":
      return "Didn’t parse";
  }
}

function footerOf(lesson: LessonSummary): string {
  if (lesson.status === "failed") return "We couldn’t read this file";
  if (lesson.status === "pending" || lesson.status === "processing") {
    return "Nevo is reading it now";
  }
  if (lesson.reviewSegmentCount > 0) {
    const n = lesson.reviewSegmentCount;
    return `${n} ${n === 1 ? "section wants" : "sections want"} a look`;
  }
  return `Added ${new Date(lesson.createdAt).toLocaleDateString("en-GB", {
    day: "numeric",
    month: "long",
  })}`;
}

function toCard(lesson: LessonSummary): LibraryCard {
  const n = lesson.segmentCount;
  return {
    id: lesson.id,
    title: lesson.title,
    status: statusOf(lesson),
    meta: `${n} ${n === 1 ? "section" : "sections"} · ${SOURCE_LABEL[lesson.sourceType] ?? lesson.sourceType}`,
    footer: footerOf(lesson),
  };
}

const FIXTURE_CARDS: LibraryCard[] = LIBRARY_LESSONS.map((l) => ({
  id: l.id,
  title: l.title,
  status: l.status,
  meta: l.meta,
  footer: l.assigned,
  subject: l.subject,
}));

export interface LessonLibraryState {
  cards: LibraryCard[];
  /** Real lessons are in hand - subject pills do not apply. */
  live: boolean;
  /** A session exists but the call never landed, so fixtures stand in. */
  sample: boolean;
  loading: boolean;
}

export function useLessonLibrary(): LessonLibraryState {
  const [live, setLive] = useState<LessonSummary[] | null>(null);
  const [failed, setFailed] = useState(false);
  // Derived, not stored: reading localStorage into initial state renders one
  // thing on the server and another on the client, which is a hydration
  // mismatch. `useHasSession` reports false until hydration settles.
  const signedIn = useHasSession();
  const loading = signedIn && live === null && !failed;

  useEffect(() => {
    if (!getToken()) return;
    let cancelled = false;
    const timers: ReturnType<typeof setTimeout>[] = [];
    const timeout = new Promise<null>((resolve) => {
      timers.push(setTimeout(() => resolve(null), LIVE_TIMEOUT_MS));
    });
    void Promise.race([lessonsApi.list().catch(() => null), timeout]).then(
      (res) => {
        if (cancelled) return;
        if (res) setLive(res);
        else setFailed(true);
      },
    );
    return () => {
      cancelled = true;
      timers.forEach(clearTimeout);
    };
  }, []);

  if (live === null) {
    return { cards: FIXTURE_CARDS, live: false, sample: failed, loading };
  }
  return { cards: live.map(toCard), live: true, sample: false, loading: false };
}
