import { api } from "./client";

/**
 * Lesson content endpoints, typed against the deployed backend
 * (openapi 2.0.0). Parsing (Teacher Console C.7) is live; lesson
 * listing/detail endpoints are not deployed yet - the library still runs on
 * src/lib/mocks/teacherLibrary until they exist.
 */

export type LessonSourceType =
  | "pdf"
  | "word"
  | "powerpoint"
  | "google_drive"
  | "onedrive"
  | "text";

export type ContentParseStatus =
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

export interface SourcePage {
  pageNumber: number;
  text: string;
}

export interface ParseContentRequest {
  title: string;
  sourceType: LessonSourceType;
  sourceText?: string | null;
  pages?: SourcePage[];
  sourceMetadata?: Record<string, unknown>;
}

export interface ParsedLessonSegment {
  id: string;
  contentType: LessonContentType;
  sequenceOrder: number;
  title: string | null;
  body: string;
  availableModalities: ContentModality[];
  comprehensionCheckpoints: Record<string, unknown>[];
  textVariant: Record<string, unknown> | null;
  visualVariant: Record<string, unknown> | null;
  audioVariant: Record<string, unknown> | null;
  interactiveVariant: Record<string, unknown> | null;
  calculationVariant: Record<string, unknown> | null;
  needsReview: boolean;
  reviewReasons: string[];
}

export interface ParseContentResponse {
  lessonId: string;
  parseRunId: string;
  status: ContentParseStatus;
  title: string;
  segmentCount: number;
  reviewSegmentCount: number;
  confirmationSummary: string | null;
  reviewNotes: Record<string, unknown>[];
  segments: ParsedLessonSegment[];
}

export const contentApi = {
  /** Parse uploaded content into segments. POST /api/content/parse */
  parse: (payload: ParseContentRequest) =>
    api.post<ParseContentResponse>("/api/content/parse", payload),
};
