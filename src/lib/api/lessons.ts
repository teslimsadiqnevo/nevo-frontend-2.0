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
  /**
   * Shipped 31 Aug. NOT in the schema's `required` list, so it can arrive
   * absent - and absent is not zero. Anything reading it must tell those
   * apart before making a claim about whether a lesson is assigned.
   */
  assignmentCount?: number;
  /** Shipped 31 Aug. Free text; only the staged upload routes can set one. */
  subject?: string | null;
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
 * How the parser grouped the segments.
 *
 * The two lesson-detail routes were once NOT interchangeable - the content
 * route carried the review flags and no modules, the v1 route the reverse,
 * and a screen wanting both had to ask twice. Backend closed that on 31 Aug:
 * `/api/content/lessons/{id}` and `/api/v1/lessons/{id}` now return the same
 * fields, modules and segment review flags included. One call is enough.
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

/**
 * A play session, from `POST /api/v1/lessons/{id}/session`.
 *
 * `resumed` means the backend matched an existing open session rather than
 * opening a new one - so a child returning to a lesson continues one session
 * instead of accumulating orphans.
 */
export interface LessonSessionResponse {
  sessionId: string;
  resumed: boolean;
}

/** `LessonCompletionStatus` - the values progress rows come back with. */
export const LESSON_STATUS = {
  IN_PROGRESS: "in_progress",
  COMPLETED: "completed",
  EXITED: "exited",
} as const;

export type LessonStatus =
  (typeof LESSON_STATUS)[keyof typeof LESSON_STATUS];

export interface LessonProgressRequest {
  sessionId: string;
  assignmentId?: string | null;
  modulePosition?: number;
  segmentPosition?: number;
  status: LessonStatus;
}

export interface LessonProgressResponse {
  lessonId: string;
  status: string;
  modulePosition: number;
  segmentPosition: number;
  /** Untyped in the spec (`additionalProperties: true`), so it is not read. */
  intelligence: Record<string, unknown>;
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

  /**
   * Open (or re-open) a play session. POST /api/v1/lessons/{id}/session
   * Takes no body.
   */
  startSession: (lessonId: string) =>
    api.post<LessonSessionResponse>(`/api/v1/lessons/${lessonId}/session`, {}),

  /**
   * Record where the student has got to. PUT /api/v1/lessons/{id}/progress
   *
   * `sessionId` is required, so progress cannot be written before a session
   * exists - which is why `useLessonProgress` opens one before it reports
   * anything.
   */
  saveProgress: (lessonId: string, body: LessonProgressRequest) =>
    api.put<LessonProgressResponse>(
      `/api/v1/lessons/${lessonId}/progress`,
      body,
    ),
};
