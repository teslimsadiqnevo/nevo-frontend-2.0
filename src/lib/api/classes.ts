import { api } from "./client";

/**
 * Teacher-class assignment endpoints, typed against the deployed backend
 * (openapi 2.0.0, snake_case bodies). `myClasses` is the teacher console's
 * own class list - live today; the assignment CRUD calls are admin-surface
 * seams for the admin campaign.
 */

export type TeacherAssignmentRole = "primary" | "co_teacher";

export interface AssignedClass {
  assignment_id: string;
  class_id: string;
  class_name: string;
  class_code: string | null;
  role: TeacherAssignmentRole;
  assigned_at: string;
}

export interface AssignedTeacher {
  assignment_id: string;
  teacher_id: string;
  first_name: string | null;
  last_name: string | null;
  email: string | null;
  role: TeacherAssignmentRole;
  assigned_at: string;
}

/**
 * A student on a class roster.
 *
 * camelCase, and deliberately so: this route was the API's one mixed-case
 * object until backend settled the convention on 30 Aug. camelCase is
 * canonical for the v2 product surface; the snake_case above is the auth and
 * assignment surface, which stays as it is. Do not "tidy" either into the
 * other.
 *
 * `profileStatus` is the learner profile, not the account: `observed` once
 * Nevo has watched enough to adapt, `not_observed_yet` before that.
 */
export type ProfileStatus = "observed" | "not_observed_yet";

/**
 * The closed set of patterns the roster may report. Derived server-side from
 * lesson sessions and signal events - never free text, never model output,
 * never anything the learner wrote, which is what lets it pass Zero-Tag on
 * contents and not merely on field names.
 */
export type ObservationPattern =
  | "completed_lessons"
  | "revisited_content"
  | "steadier_pace"
  | "tried_another_format"
  | "no_recent_pattern";

export interface LearnerObservation {
  pattern: ObservationPattern;
  /** How many times, over the window the pattern was derived from. */
  count: number;
}

export interface ClassStudent {
  studentId: string;
  firstName: string | null;
  lastName: string | null;
  /** Always present - the backend's own fallback for a missing name. */
  displayName: string;
  loginIdentifier: string | null;
  /** Account state. No enum in the spec; "active" is the only value seen. */
  status: string;
  profileStatus: ProfileStatus | (string & {});
  latestSessionAt: string | null;
  /**
   * What Nevo has noticed about this learner recently - now BOUNDED, and a
   * breaking change from the `string[]` this used to be (backend, 3 Sep).
   *
   * The old shape handed the client pre-phrased sentences and asked it to
   * trust the contents; nothing rendered them, because an untyped string is
   * exactly what the Zero-Tag rulings say must not reach a teacher sight
   * unseen. It is now a closed enum plus a count, so the WORDING is ours to
   * compose and the guarantee lives in the schema rather than in an
   * assurance. At most three, over a 30-day window.
   */
  observations?: LearnerObservation[];
  /** Which seat the student occupies against the school's allowance. */
  seatContext: string;
}

/**
 * A class as the admin console reads it (D5 / D5b). camelCase, like the roster
 * route above and unlike the snake_case assignment surface.
 *
 * `source` is what forks every manual-versus-SSO branch in D5: where it is
 * "sso" the provider owns the class list, so Create is ABSENT rather than
 * disabled and archive does not appear at all.
 *
 * `subjects` backs the detail header's third clause. It is optional in the
 * schema and often empty, so the header composes only the clauses it has.
 */
export interface AdminClass {
  id: string;
  name: string;
  code: string | null;
  /** A `YearGroup` enum value. Typed as string: the backend does not narrow it. */
  yearGroup: string | null;
  source: string | null;
  subjects: string[];
  studentCount: number;
  /** Non-null means archived. Archive is reversible and never deletes. */
  archivedAt: string | null;
}

export const classesApi = {
  /**
   * Every class in the school. Archived rows are excluded by default and a
   * filter reveals them, which is exactly what `includeArchived` does.
   */
  list: (includeArchived = false) =>
    api.get<AdminClass[]>("/api/v1/classes", {
      params: includeArchived ? { includeArchived: true } : undefined,
    }),

  /** One class. GET /api/v1/classes/{class_id} */
  get: (classId: string) => api.get<AdminClass>(`/api/v1/classes/${classId}`),

  /**
   * Create a class.
   *
   * D5's create sheet offers an OPTIONAL PRIMARY TEACHER, and SCRUM-40's data
   * note asks for `primary_teacher_id` on this body - but the deployed schema
   * takes `{ name, yearGroup }` and nothing else. So the sheet creates, then
   * assigns with the id this returns. Two calls, not one, and not atomic: if
   * the assignment fails the class still exists, which the sheet says plainly
   * rather than pretending the whole thing failed.
   */
  create: (payload: { name: string; yearGroup: string | null }) =>
    api.post<{ id: string; code: string | null }>("/api/v1/classes", payload),

  /** Rename or re-year a class. Does not rewrite assignment history. */
  update: (classId: string, payload: { name: string; yearGroup: string | null }) =>
    api.patch<{ id: string; name: string }>(`/api/v1/classes/${classId}`, payload),

  /** Archive: reversible, keeps records, never touches student progress. */
  archive: (classId: string) =>
    api.post<void>(`/api/v1/classes/${classId}/archive`),

  /** Undo an archive. */
  restore: (classId: string) =>
    api.post<void>(`/api/v1/classes/${classId}/restore`),
  /** The signed-in teacher's classes. GET /api/v1/teachers/me/classes */
  myClasses: () => api.get<AssignedClass[]>("/api/v1/teachers/me/classes"),

  /** A specific teacher's classes (admin). */
  teacherClasses: (teacherId: string) =>
    api.get<AssignedClass[]>(`/api/v1/teachers/${teacherId}/classes`),

  /** Teachers assigned to a class (admin read). */
  classTeachers: (classId: string) =>
    api.get<AssignedTeacher[]>(`/api/v1/classes/${classId}/teachers`),

  /** The class roster. GET /api/v1/classes/{class_id}/students */
  classStudents: (classId: string) =>
    api.get<ClassStudent[]>(`/api/v1/classes/${classId}/students`),

  /** Assign a teacher to a class (admin seam). */
  createAssignment: (payload: {
    teacher_id: string;
    class_id: string;
    role: TeacherAssignmentRole;
  }) => api.post("/api/v1/teacher-class-assignments", payload),

  /** Hand a class to another teacher (admin seam). */
  reassign: (
    assignmentId: string,
    payload: { new_teacher_id: string; role?: TeacherAssignmentRole | null },
  ) =>
    api.post(
      `/api/v1/teacher-class-assignments/${assignmentId}/reassign`,
      payload,
    ),

  /** Remove an assignment (admin seam). */
  removeAssignment: (assignmentId: string) =>
    api.del(`/api/v1/teacher-class-assignments/${assignmentId}`),
};
