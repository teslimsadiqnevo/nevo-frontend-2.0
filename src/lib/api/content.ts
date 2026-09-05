import { api } from "./client";
import type { ComprehensionCheckpoint } from "./checkpoints";
import type {
  AudioVariant,
  CalculationVariant,
  InteractiveVariant,
  TextVariant,
  VisualVariant,
} from "./variants";

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
  comprehensionCheckpoints: ComprehensionCheckpoint[];
  /**
   * Typed as of 3 Sep - see `api/variants.ts`. `interactiveVariant.answerKey`
   * is nullable exactly as a checkpoint's is, and `markInteractive` is the
   * only thing that should judge it.
   */
  textVariant: TextVariant | null;
  visualVariant: VisualVariant | null;
  audioVariant: AudioVariant | null;
  interactiveVariant: InteractiveVariant | null;
  calculationVariant: CalculationVariant | null;
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

/** 200 of POST /api/content/media/url. */
export interface MediaUrl {
  storagePath: string;
  url: string;
  /** Null means the fresh URL does not expire. */
  expiresInSeconds: number | null;
}

export const contentApi = {
  /**
   * Mint a fresh URL for a stored media object.
   *
   * Generated narration and images live in private Supabase storage behind
   * URLs that AGE OUT - `audioVariant` and `visualVariant` both carry
   * `urlExpiresInSeconds`. An expired one is a dead player or a missing
   * image, so `mediaUrlExpired` in `api/variants.ts` decides when to call
   * this, and `storagePath` - not the stale URL - is what identifies the
   * object.
   */
  mediaUrl: (storagePath: string) =>
    api.post<MediaUrl>("/api/content/media/url", { storagePath }),

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
