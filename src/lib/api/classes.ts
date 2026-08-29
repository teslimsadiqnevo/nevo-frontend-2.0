import { api, type RequestOptions } from "./client";

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

export const classesApi = {
  /** The signed-in teacher's classes. GET /api/v1/teachers/me/classes */
  myClasses: () => api.get<AssignedClass[]>("/api/v1/teachers/me/classes"),

  /** A specific teacher's classes (admin). */
  teacherClasses: (teacherId: string) =>
    api.get<AssignedClass[]>(`/api/v1/teachers/${teacherId}/classes`),

  /**
   * Teachers assigned to a class. Documented as an admin read, so a teacher
   * calling it speculatively should pass `tolerateAuthFailure` - otherwise a
   * scope-related 403 would clear their session.
   */
  classTeachers: (classId: string, options?: RequestOptions) =>
    api.get<AssignedTeacher[]>(`/api/v1/classes/${classId}/teachers`, options),

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
