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
  /** When it OPENS. Shipped 31 Aug; required on the read. */
  availableFrom: string | null;
  /** When it is DUE - a different thing. */
  dueAt: string | null;
  assignedAt: string;
}

export interface CreateAssignmentsResult {
  assignmentIds: string[];
  createdCount: number;
}

export const assignmentsApi = {
  /**
   * Assign lessons. One call per class: the payload takes many `lessonIds`
   * but a single `classId`, which expands to that class's current enrolment
   * server-side.
   *
   * `availableFrom` is when the lesson OPENS; `dueAt` is when it is DUE.
   * They are separate fields and must not be mapped onto each other - a
   * lesson scheduled to open on Friday is not a lesson due on Friday.
   * `availableFrom` landed on 31 Aug 2026 and is what the wizard's step 3
   * has always been asking for.
   */
  create: (payload: {
    lessonIds: string[];
    classId?: string | null;
    studentIds?: string[];
    availableFrom?: string | null;
    dueAt?: string | null;
  }) => api.post<CreateAssignmentsResult>("/api/v1/assignments", payload),

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
