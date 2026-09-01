import { api } from "./client";

/**
 * The STAGED upload - the block path, where one file becomes a unit of
 * several lessons rather than a single one.
 *
 * Distinct from `POST /api/content/upload`, which takes a file and returns a
 * finished lesson. The staged flow is: upload -> poll -> edit the structure ->
 * confirm, with an undo, and it is the only route that accepts a `subject`.
 *
 * ONE GAP TO KNOW ABOUT. A module carries `segmentIds` and nothing else -
 * no titles, no durations - and the status response has no segments on it.
 * So the structure can be drawn down to the SECTION, and the segments under
 * it can be counted but not named. C07d draws named segment rows; until the
 * upload can hand back the segments themselves, that third level is a count.
 * Raised with backend.
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
  lessonId: string;
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

export interface UploadStatusResponse {
  id: string;
  status: UploadStatus;
  stage: UploadStage;
  structure: UploadStructure;
  error: string | null;
}

export interface UploadCreated {
  uploadId: string;
  status: UploadStatus;
  stage: UploadStage;
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

  /** Commit the unit to the library. */
  confirm: (uploadId: string) =>
    api.post<{ lessonId: string; status: string }>(
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
