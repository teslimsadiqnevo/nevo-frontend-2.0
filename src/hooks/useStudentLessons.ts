"use client";

import { useMemo } from "react";

import type {
  LessonStatus,
  LessonSummary,
} from "@/components/student/Lessons/lessonCatalog";
import { useStudentDashboard } from "./useStudentDashboard";

/**
 * The lessons a student actually has, for the Lessons tab.
 *
 * SOURCE. Not `GET /api/content/lessons` - that is the school's whole parsed
 * library, which is the teacher's view of the world. A child's Lessons tab is
 * THEIR lessons, and the only endpoint that knows which those are is
 * `GET /api/v1/students/me/dashboard`. It carries the assignments with each
 * lesson summary nested, and the student's own recent progress, which is
 * exactly the two halves this screen needs. Home already reads it, so this
 * costs no extra call.
 *
 * WHAT THE CONTRACT CANNOT ANSWER. Assignments carry no subject and no
 * "what you'll do" description, so the live list is ungrouped and its preview
 * omits both rather than inventing them - the teacher library hides its own
 * subject filter for the same reason. There is no adaptive time estimate
 * either; the segment count is the honest stand-in Home already uses.
 *
 * STATUS is real, though, and that matters: it comes from the student's own
 * progress rows, so the filter chips filter on something true instead of on a
 * fixture's invented state. `exited` reads as in-progress - a child who left
 * partway has started it, whatever the backend calls that.
 */

/** Backend `LessonCompletionStatus` -> the calm indicator the cards draw. */
function statusFrom(raw: string | undefined): LessonStatus {
  if (raw === "completed") return "completed";
  if (raw === "in_progress" || raw === "exited") return "in_progress";
  return "not_started";
}

export interface StudentLessons {
  lessons: LessonSummary[];
  /** Signed in and reading live data - fixtures must not show. */
  live: boolean;
  loading: boolean;
  failed: boolean;
}

export function useStudentLessons(): StudentLessons {
  const { data, failed, loading } = useStudentDashboard();

  // Memoised so the array identity is stable between renders - callers put it
  // straight into a `useMemo`, and a fresh array every render defeats theirs.
  const lessons = useMemo<LessonSummary[]>(() => {
    if (!data) return [];

    // Newest row per lesson wins; the feed is not guaranteed to be ordered.
    const latest = new Map<string, (typeof data.recentProgress)[number]>();
    for (const row of data.recentProgress) {
      const held = latest.get(row.lessonId);
      if (!held || Date.parse(row.updatedAt) > Date.parse(held.updatedAt)) {
        latest.set(row.lessonId, row);
      }
    }

    return data.assignments.map<LessonSummary>((a) => {
      const row = latest.get(a.lesson.id);
      const status = statusFrom(row?.status);
      const count = a.lesson.segmentCount;
      // Coarse on purpose, like Home: whether segmentPosition is 0- or
      // 1-based is unstated, so this may be off by a segment. It drives a
      // bar, never a number shown to a child.
      const progress =
        status === "in_progress" && row && count > 0
          ? Math.max(0, Math.min(1, row.segmentPosition / count))
          : undefined;

      return {
        id: a.lesson.id,
        lessonId: a.lesson.id,
        title: a.lesson.title,
        timeEstimate: `${count} ${count === 1 ? "section" : "sections"}`,
        status,
        ...(progress !== undefined ? { progress } : {}),
      };
    });
  }, [data]);

  if (!data) return { lessons, live: false, loading, failed };
  return { lessons, live: true, loading: false, failed: false };
}
