import { api } from "./client";

/**
 * The STAGED upload - the block path, where one file becomes a unit of
 * several lessons rather than a single one.
 *
 * Distinct from `POST /api/content/upload`, which takes a file and returns a
 * finished lesson. The staged flow is: upload -> poll -> edit the structure ->
 * confirm, with an undo, and it is the only route that accepts a `subject`.
 *
 * TWO THINGS LANDED ON 3 SEP that this file was waiting on.
 *
 * `segments` and `lessonTitle` are now on the status response, so C07d's
 * third level can NAME its rows instead of counting them, and a batch screen
 * can show lesson titles from the poll it already makes rather than one extra
 * request per upload. Modules still point at segments by key, so `segments`
 * is the lookup table for `segmentIds`.
 *
 * `lessonId` is now OPTIONAL on a structure lesson. Omitting it is how a
 * split is expressed: send a lesson with no id and the server mints one, then
 * hands the ids back from confirm as `lessonIds`, positionally aligned with
 * the `lessons` that were sent. The client no longer has to invent identity
 * for a row it does not own - and confirm was previously discarding any id it
 * was given and generating its own, so a client-minted id would have named
 * nothing that existed.
 */

/** `UploadStatus` in the spec. */
export type UploadStatus =
  | "pending"
  | "processing"
  | "ready"
  | "confirmed"
  | "failed"
  | "cancelled";

/** `UploadStage` in the spec. */
export type UploadStage = "lessons" | "structure" | "complete";

export interface StructureModule {
  title: string;
  sequenceOrder: number;
  segmentIds: string[];
  recap: string | null;
  preview: string | null;
}

/** One lesson inside a staged unit. */
export interface StructureLesson {
  /**
   * ABSENT MEANS NEW. The server mints an id for any lesson that arrives
   * without one and returns it in `lessonIds`, so a split writes its new
   * halves with this omitted rather than guessing a uuid.
   */
  lessonId?: string;
  title: string;
  sequenceOrder: number;
  modules: StructureModule[];
}

export interface UploadStructure {
  /**
   * `lessons` is the real shape as of 1 Sep. `lessonId` and `modules` mirror
   * the FIRST lesson and are kept for compatibility - read `lessons` and let
   * the mirror alone, or a unit of four will read as one.
   */
  lessons?: StructureLesson[];
  lessonId: string;
  modules: StructureModule[];
  /** Free-form in the contract; not rendered. */
  reviewNotes?: unknown[];
}

/**
 * A named row for the structure review screen. Modules reference these by
 * `segmentKey`, so this is what turns C07d's third level from a count into a
 * list of titles.
 */
export interface UploadSegment {
  segmentKey: string;
  /** Nullable in the contract - a parse can produce an untitled section. */
  title: string | null;
  contentType: string;
  sequenceOrder: number;
  estimatedMinutes: number;
  needsReview: boolean;
}

export interface UploadStatusResponse {
  id: string;
  status: UploadStatus;
  stage: UploadStage;
  /** The unit's own title, when the parse found one. */
  lessonTitle?: string | null;
  /**
   * Optional in the contract - `required` does not list it - so an older
   * upload can come back with no segments at all. Callers must treat absent
   * and empty the same way and fall back to counting.
   */
  segments?: UploadSegment[];
  structure: UploadStructure;
  error: string | null;
}

export interface UploadCreated {
  uploadId: string;
  status: UploadStatus;
  stage: UploadStage;
}

/** One file's outcome inside a batch. */
export interface BatchUpload {
  uploadId: string | null;
  filename: string;
  accepted: boolean;
  /** The server's own reason when it refused the file. */
  error: string | null;
  status: UploadStatus | null;
  stage: UploadStage | null;
}

export interface BatchResult {
  acceptedCount: number;
  rejectedCount: number;
  uploads: BatchUpload[];
}

export const uploadsApi = {
  /** Stage a file. `scope` is the unit size; `subject` is optional. */
  create: (file: File, scope: string, subject?: string) => {
    const form = new FormData();
    form.append("file", file);
    form.append("scope", scope);
    if (subject) form.append("subject", subject);
    return api.post<UploadCreated>("/api/v1/uploads", form);
  },

  /**
   * Stage up to 20 files at once - C07h's whole scheme of work.
   *
   * Each file reports its OWN outcome: one oversized or unreadable file is
   * rejected on its own line rather than sinking the batch. That is the
   * shape to render, and the reason `Promise.all` would have been wrong here.
   */
  batch: (files: File[], scope: string, subject?: string) => {
    const form = new FormData();
    files.forEach((f) => form.append("files", f));
    form.append("scope", scope);
    if (subject) form.append("subject", subject);
    return api.post<BatchResult>("/api/v1/uploads/batch", form);
  },

  /** Where the parse has got to, and the structure once there is one. */
  status: (uploadId: string) =>
    api.get<UploadStatusResponse>(`/api/v1/uploads/${uploadId}`),

  /** Save an edited structure. Returns the stored one, plus whether it can be undone. */
  updateStructure: (uploadId: string, structure: UploadStructure) =>
    api.put<{ id: string; structure: UploadStructure; canUndo: boolean | null }>(
      `/api/v1/uploads/${uploadId}/structure`,
      { structure },
    ),

  /** Reverse the last structure edit. */
  undo: (uploadId: string) =>
    api.post<{ id: string; structure: UploadStructure; canUndo: boolean | null }>(
      `/api/v1/uploads/${uploadId}/undo`,
    ),

  /**
   * Commit the unit to the library.
   *
   * `lessonIds` is the split's other half: one id per lesson that was sent,
   * in the same order, including the ones the server minted for lessons that
   * arrived without an id. `lessonId` remains the first, for callers that
   * only ever expected one.
   */
  confirm: (uploadId: string) =>
    api.post<{ lessonId: string; lessonIds?: string[]; status: UploadStatus }>(
      `/api/v1/uploads/${uploadId}/confirm`,
    ),

  /** Re-parse specific pages that came through faint. */
  retryPages: (uploadId: string, pageNumbers: number[]) =>
    api.post<{
      uploadId: string;
      lessonId: string;
      pagesRetried: number;
      structure: UploadStructure;
    }>(`/api/v1/uploads/${uploadId}/retry-pages`, { pageNumbers }),
};

/**
 * The lessons a staged upload describes.
 *
 * Prefers `lessons`; falls back to the mirrored single lesson so an older
 * response still reads as one lesson rather than none.
 */
export function lessonsOf(structure: UploadStructure): StructureLesson[] {
  if (structure.lessons?.length) return structure.lessons;
  return [
    {
      lessonId: structure.lessonId,
      title: "",
      sequenceOrder: 1,
      modules: structure.modules ?? [],
    },
  ];
}

/**
 * Name the segments a module points at.
 *
 * Modules carry `segmentIds` - keys, not titles - so drawing C07d's third
 * level means joining them against the status response's `segments`. A key
 * with no matching row, or a row whose title is null, yields null rather than
 * a placeholder: the caller decides whether that is "Section 3" or a count,
 * because inventing a title here would put words in the parse's mouth.
 */
export function namedSegments(
  segmentIds: string[],
  segments: UploadSegment[] | undefined,
): { key: string; title: string | null; minutes: number; needsReview: boolean }[] {
  const byKey = new Map((segments ?? []).map((seg) => [seg.segmentKey, seg]));
  return segmentIds.map((key) => {
    const found = byKey.get(key);
    return {
      key,
      title: found?.title?.trim() ? found.title.trim() : null,
      minutes: found?.estimatedMinutes ?? 0,
      needsReview: found?.needsReview ?? false,
    };
  });
}
