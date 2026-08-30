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

export const lessonsApi = {
  /** The parsed lesson library. GET /api/content/lessons */
  list: (options?: { limit?: number }) =>
    api.get<LessonSummary[]>("/api/content/lessons", {
      params: options?.limit ? { limit: options.limit } : undefined,
    }),

  /** One lesson with its ordered segments. */
  detail: (lessonId: string) =>
    api.get<LessonDetailResponse>(`/api/content/lessons/${lessonId}`),
};
