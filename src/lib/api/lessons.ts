import { api } from "./client";

/**
 * Parsed lesson content - the library and one lesson's segments.
 *
 * camelCase, which is the convention across the whole content/messaging
 * surface; the auth routes (`users/me`, `auth/login`) are the snake_case
 * holdouts. Enum values below are the spec's own, not our invention.
 *
 * `status` is a PARSE status, not an assignment status. A lesson that is
 * `completed` has been read and segmented; whether it has been given to a
 * class is a different question that this endpoint does not answer - see the
 * note in `useLessonLibrary`.
 */

export type LessonSourceType =
  | "pdf"
  | "word"
  | "powerpoint"
  | "google_drive"
  | "onedrive"
  | "text";

export type LessonParseStatus =
  | "pending"
  | "processing"
  | "completed"
  | "completed_with_review"
  | "failed";

export type LessonContentType =
  | "explanatory_text"
  | "visual_diagram"
  | "worked_example"
  | "practice_question"
  | "definition"
  | "summary"
  | "calculation";

export type ContentModality = "visual" | "audio" | "text" | "interactive";

export interface LessonSummary {
  id: string;
  title: string;
  sourceType: LessonSourceType;
  status: LessonParseStatus;
  segmentCount: number;
  /** Segments the parser wants a human to confirm. */
  reviewSegmentCount: number;
  createdAt: string;
}

export interface LessonSegment {
  id: string;
  segmentKey: string;
  contentType: LessonContentType;
  sequenceOrder: number;
  title: string | null;
  body: string;
  availableModalities: ContentModality[];
  /** Untyped in the spec - shape unknown, so it is not read yet. */
  comprehensionCheckpoints: unknown[];
  needsReview: boolean;
  reviewReasons: string[];
}

export interface LessonDetailResponse extends LessonSummary {
  confirmationSummary: string | null;
  segments: LessonSegment[];
}

/**
 * How the parser grouped the segments. Only `/api/v1/lessons/{id}` carries
 * these - and that endpoint's segments, confusingly, DROP `needsReview` and
 * `reviewReasons`. So the two are not interchangeable and neither is a
 * superset: the content route has the review flags, the v1 route has the
 * modules, and a screen wanting both has to ask twice.
 *
 * TODO(api): one lesson-detail response carrying both.
 */
export interface LessonModule {
  id: string;
  title: string;
  /** Shown after the module; null when the parser wrote none. */
  recap: string | null;
  /** Shown before it. */
  preview: string | null;
  sequenceOrder: number;
  /** Which segments belong to it, by segment id. */
  segmentIds: string[];
}

/**
 * How one class is moving through one lesson - `GET /api/v1/lessons/{id}/class-progress`.
 *
 * Shipped 30 Aug against the frontend blockers list; it is the source C06b's
 * progress rows and its "where the class slowed" note had been waiting on.
 *
 * `classId` is REQUIRED, and a lesson does not know which class is being
 * asked about - so the caller derives it from the lesson's own assignments.
 * A lesson assigned only to individuals has no class to report on.
 */
export interface SegmentProgress {
  segmentId: string;
  segmentKey: string;
  title: string | null;
  sequenceOrder: number;
  assignedStudentCount: number;
  completionCount: number;
  /** 0-1. */
  completionRate: number;
  averageTimeSeconds: number | null;
  slowdownCount: number;
  /** The parser's own words about this segment, when it has any. */
  note: string | null;
}

export interface LessonClassProgress {
  lessonId: string;
  classId: string;
  assignedStudentCount: number;
  segments: SegmentProgress[];
  /** Where the class slowed most, if anywhere. */
  slowestSegmentId: string | null;
  /** C06b's dip note, written server-side. */
  slowdownNote: string | null;
}

export const lessonsApi = {
  /** One class's progress through this lesson. */
  classProgress: (lessonId: string, classId: string) =>
    api.get<LessonClassProgress>(
      `/api/v1/lessons/${lessonId}/class-progress`,
      { params: { classId } },
    ),

  /** The parsed lesson library. GET /api/content/lessons */
  list: (options?: { limit?: number }) =>
    api.get<LessonSummary[]>("/api/content/lessons", {
      params: options?.limit ? { limit: options.limit } : undefined,
    }),

  /**
   * One lesson with its ordered segments AND its review flags. Deliberately
   * the content route, not the v1 alias - see `LessonModule`.
   */
  detail: (lessonId: string) =>
    api.get<LessonDetailResponse>(`/api/content/lessons/${lessonId}`),

  /** The module grouping, which only the v1 alias returns. */
  modules: (lessonId: string) =>
    api
      .get<{ modules?: LessonModule[] }>(`/api/v1/lessons/${lessonId}`)
      .then((r) => r.modules ?? []),
};
