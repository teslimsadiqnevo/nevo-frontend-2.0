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
}

export const classesApi = {
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
