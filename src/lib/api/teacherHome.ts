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
  /**
   * How far the class got. BOTH NULLABLE, and both were missing from this type
   * until 17 Sep - so the poll dropped them before any screen could read them,
   * and Home's LIVE activity list was strictly poorer than the SAMPLE one
   * beside it, which draws a progress bar and "{done} of {total} done".
   *
   * This is the third instance of the same shape: a delivered field absent from
   * a client type, silently discarded. `note` on `Assignment` and
   * `completedCount` here were both found the same way, and `failedPages` on
   * `UploadStatusResponse` is still outstanding.
   */
  completedCount: number | null;
  totalCount: number | null;
}

export interface TeacherHomeIntelligence {
  classLearningPulse: ClassPulseRow[];
  recentActivity: ActivityRow[];
}

export const teacherHomeApi = {
  read: () => api.get<TeacherHomeIntelligence>("/api/v1/teachers/me/home"),
};
