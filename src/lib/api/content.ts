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
 * THESE ARE ASYNCHRONOUS NOW (backend, 9 Sep). `parse`, `upload` and
 * `regenerate` all answer **202** with a receipt - `lessonId`, `parseRunId`,
 * `status` and a `pollUrl` - and the work carries on without you. The finished
 * lesson is NOT in that response: poll `parseRun` until `finished`, then read
 * the lesson.
 *
 * The old shape - `ParseContentResponse`, the whole parsed lesson returned
 * synchronously - is gone from the deployed spec entirely. It was never really
 * synchronous: the contract declared only 200/422 while `ContentParseStatus`
 * admitted `pending` and `processing`, and the `parseRunId` it handed back was
 * accepted by no operation anywhere in 190. Asking about that contradiction is
 * what turned up three stacked backend faults.
 *
 * All three still CREATE the lesson: `lessonId` names a lesson that exists from
 * the moment the receipt arrives, even though it is not parsed yet.
 */

export type LessonSourceType =
  "pdf" | "word" | "powerpoint" | "google_drive" | "onedrive" | "text";

export type ContentParseStatus =
  "pending" | "processing" | "completed" | "completed_with_review" | "failed";

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

/**
 * 202 of `parse`, `upload` and `regenerate` - a receipt, not a result.
 *
 * `status` is the run's state at the moment it was accepted (`pending` or
 * `processing`), never its outcome.
 */
export interface ParseAccepted {
  lessonId: string;
  parseRunId: string;
  status: ContentParseStatus;
  /** Where to poll. The same route `parseRun(parseRunId)` builds. */
  pollUrl: string;
}

/**
 * 200 of `GET /api/content/parse-runs/{parseRunId}` - how a run is going.
 *
 * POLL `finished`, NOT `status`. It is true for `completed`,
 * `completed_with_review` and `failed` alike, so a caller never has to
 * enumerate the terminal statuses - and so cannot hang forever by missing one.
 * `failureReason` says why, when it did not work.
 *
 * `fallbackSegmentCount` IS THE FIELD THAT MATTERS. A segment counted there is
 * deterministic split-up source text, not generated content. Every lesson in
 * the library was 100% fallback until 9 Sep: the model's output ceiling was
 * 4,096 tokens, so it ran out of room mid-object, the JSON failed to parse, and
 * the pipeline quietly fell back to splitting the source - while the call log
 * recorded the provider as having succeeded. Nothing anywhere said the AI had
 * contributed nothing. When this equals `segmentCount` the lesson is split-up
 * source text and worth regenerating; on a healthy parse it is 0.
 */
export interface ParseRunStatus {
  parseRunId: string;
  lessonId: string;
  status: ContentParseStatus;
  /** True for completed, completed_with_review and failed alike. */
  finished: boolean;
  startedAt: string;
  completedAt: string | null;
  failureReason: string | null;
  reviewNotes: Record<string, unknown>[];
  segmentCount: number;
  /** Segments that are split source text rather than generated content. */
  fallbackSegmentCount: number;
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

  /** Parse already-extracted text. 202. POST /api/content/parse */
  parse: (payload: ParseContentRequest) =>
    api.post<ParseAccepted>("/api/content/parse", payload),

  /**
   * Re-run the parse over a lesson's OWN stored segment text. 202.
   *
   * It does not need the original source document, so a directly-seeded lesson
   * regenerates fine. Worth stating, because "it must be waiting on an upload
   * that was never there" was one of our theories for why this never returned,
   * and it was wrong.
   */
  regenerate: (lessonId: string) =>
    api.post<ParseAccepted>(`/api/content/lessons/${lessonId}/regenerate`),

  /** How a run is going. GET /api/content/parse-runs/{parseRunId} */
  parseRun: (parseRunId: string) =>
    api.get<ParseRunStatus>(`/api/content/parse-runs/${parseRunId}`),

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
    return api.post<ParseAccepted>("/api/content/upload", form);
  },
};

/** How often to ask, and how long before we stop asking. */
const POLL_EVERY_MS = 1500;
const POLL_LIMIT_MS = 5 * 60 * 1000;

/**
 * Wait for a parse run to finish, and hand back how it went.
 *
 * Resolves on `finished`, which includes `failed` - so a caller gets a REASON
 * rather than a timeout when the work genuinely could not be done. It rejects
 * only when we stopped asking, or the caller aborted.
 *
 * The five-minute ceiling is OURS, not the backend's. Measured after their fix,
 * a run is accepted in about 2s and done in about 17s; production is slower
 * because image generation runs there, but it is bounded. This exists only so a
 * page cannot poll forever if something upstream goes quiet.
 */
export async function awaitParseRun(
  parseRunId: string,
  options: { signal?: AbortSignal } = {},
): Promise<ParseRunStatus> {
  const until = Date.now() + POLL_LIMIT_MS;
  for (;;) {
    if (options.signal?.aborted) throw new Error("Parse run polling aborted.");
    const run = await contentApi.parseRun(parseRunId);
    if (run.finished) return run;
    if (Date.now() >= until) {
      throw new Error(
        `Parse run ${parseRunId} was still ${run.status} after ${POLL_LIMIT_MS / 1000}s.`,
      );
    }
    await new Promise((resolve) => setTimeout(resolve, POLL_EVERY_MS));
  }
}
