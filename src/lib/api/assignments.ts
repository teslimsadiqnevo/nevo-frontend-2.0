import { api } from "./client";
import type { LessonSummary } from "./lessons";

/**
 * Lesson assignments - which students have been given which lesson.
 *
 * Assignments are per-student even when created for a whole class: sending a
 * `classId` expands to the current enrolment server-side, and each returned
 * row still names a `studentId`. The `classId` on a row is therefore the class
 * it was created from, not a class-level assignment, and it comes back null
 * for anything assigned to individuals.
 *
 * The list cannot be filtered by lesson, only by student or class, so a
 * lesson's own assignments are found by reading the teacher's list and
 * matching on `lesson.id`.
 */

export interface Assignment {
  id: string;
  lesson: LessonSummary;
  studentId: string;
  classId: string | null;
  status: string;
  dueAt: string | null;
  assignedAt: string;
}

export const assignmentsApi = {
  /** Every assignment the teacher can see, optionally narrowed. */
  list: (filter?: { studentId?: string; classId?: string }) =>
    api.get<Assignment[]>("/api/v1/assignments", {
      params: filter?.studentId
        ? { studentId: filter.studentId }
        : filter?.classId
          ? { classId: filter.classId }
          : undefined,
    }),
};
