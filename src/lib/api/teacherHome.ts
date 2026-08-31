import { api } from "./client";

/**
 * The teacher Home intelligence read - `GET /api/v1/teachers/me/home`.
 *
 * Shipped 30 Aug in response to the frontend blockers list; it is the source
 * C16a's class pulse and Home's activity list had been waiting on.
 *
 * The pulse arrives as NUMBERS, per class. C16a is explicit that the tiles
 * show "plain-language labels, never numerical scores", so the banding from
 * number to word happens in `useTeacherHome` - and those thresholds are ours,
 * not the API's or the frame's. Flagged to design.
 */

export interface ClassPulseRow {
  classId: string;
  className: string;
  studentCount: number;
  /** 0-1, or null where there is not enough yet to say. */
  engagement: number | null;
  comprehension: number | null;
  focus: number | null;
}

export interface ActivityRow {
  id: string;
  /** No enum in the spec; treated as an opaque label. */
  activityType: string;
  occurredAt: string;
  title: string;
  detail: string;
  classId: string | null;
  studentId: string | null;
  lessonId: string | null;
  /** Where the row leads. Only followed when it is an in-app path. */
  actionTarget: string;
}

export interface TeacherHomeIntelligence {
  classLearningPulse: ClassPulseRow[];
  recentActivity: ActivityRow[];
}

export const teacherHomeApi = {
  read: () => api.get<TeacherHomeIntelligence>("/api/v1/teachers/me/home"),
};
