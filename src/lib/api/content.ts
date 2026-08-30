import { api } from "./client";

/**
 * Lesson content endpoints.
 *
 * `upload` is the one the console wants: multipart, with extraction done
 * server-side, so PDF, Word, PowerPoint, Markdown and plain text all work
 * without the browser trying to read them. It replaces the pdfjs extraction
 * the wizard used to do, which could never cover Word or PowerPoint.
 *
 * `parse` remains for callers that already hold extracted text.
 *
 * Both return the same parsed lesson, and both CREATE it: the response's
 * `lessonId` is a lesson that now exists in the library.
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
  /** Parse already-extracted text. POST /api/content/parse */
  parse: (payload: ParseContentRequest) =>
    api.post<ParseContentResponse>("/api/content/parse", payload),

  /**
   * Upload a source file and get the parsed lesson back.
   * POST /api/content/upload (multipart, one field named `file`).
   *
   * An unreadable or unsupported file is a 400 with a functional message -
   * that is a real answer about the file, not a server fault.
   */
  upload: (file: File) => {
    const form = new FormData();
    form.append("file", file);
    return api.post<ParseContentResponse>("/api/content/upload", form);
  },
};
