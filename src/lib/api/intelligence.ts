import { api } from "./client";

/**
 * Intelligence Framework endpoints (FE Architecture §1 & §4): learner profile,
 * lesson adaptation, attention flags, and recommendations.
 *
 * A flag names a student by id and describes what Nevo noticed, in the same
 * plain register the console writes in.
 *
 * This file used to say a flag carried no evidence series and no action
 * target, and that the C03 card's sparkline and its two links therefore had no
 * source. Backend has since added `evidenceSeries` and `actionTargets`, so
 * both are typed below and both are optional - an older row may still arrive
 * without them. The correction is left visible rather than quietly swapped in.
 *
 * `flagType` still has no enum, so anything unrecognised must still render.
 *
 * Zero-Tag holds here: `description` is about behaviour in the moment, never a
 * diagnosis. Nothing on this route may be rendered as a label about a child.
 *
 * TODO: type `getProfile`, `getAdaptation` and `getRecommendations` too.
 */

export interface AttentionFlag {
  id: string;
  studentId: string;
  /** No enum in the spec; treat as an opaque label. */
  flagType: string;
  description: string;
  generatedAt: string;
  acknowledged: boolean;
  /** Present on newer rows only - a small series behind the description. */
  evidenceSeries?: number[];
  /** Where an admin can act. Absent means the flag is informational. */
  actionTargets?: string[];
}
/**
 * One segment as the adaptation engine needs to see it (`ContentSegmentRequest`).
 * Deliberately the engine's shape, not the player's - a lesson segment carries
 * far more, and none of the rest is read here.
 */
export interface AdaptSegment {
  id: string;
  segmentType: AdaptSegmentType;
  /** At least one - the contract sets minItems: 1. */
  availableModalities: string[];
  conceptId?: string | null;
  estimatedMinutes?: number | null;
}

/**
 * `ContentSegmentType` - the engine's own vocabulary, and NOT the same enum as
 * a lesson's `contentType` (`LessonContentType`). They share only
 * `worked_example`, `definition` and `summary`; sending a lesson's own
 * `explanatory_text` is a 422, verified against the deployed API. The
 * translation lives with the lesson adapter, in `lib/lessons/adaptation.ts`.
 */
export type AdaptSegmentType =
  | "diagram"
  | "worked_example"
  | "explanation"
  | "definition"
  | "summary"
  | "practice"
  | "interaction"
  | "checkpoint";

/** `lesson_load` on open; `in_lesson` while the child is working. */
export type AdaptationMode = "lesson_load" | "in_lesson";

/**
 * `AdaptResponse`, snake_case - one of the few routes that is. Every field
 * below is REQUIRED by the contract except the two nullable suggestions.
 *
 * `confidence`, `adaptation_confidence` and every score behind them are engine
 * parameters: they may decide what the interface does and must never be
 * rendered to a child (Zero-Tag).
 */
export interface SegmentAdaptationResponse {
  segment_id: string;
  /** `ContentModality` - visual | audio | text | interactive. */
  modality: string;
  /** `DensityLevel` - low | medium | high. NOT the player's Density. */
  density: string;
  /** `ScaffoldingLevel` - light | standard | strong. */
  scaffolding: string;
  priority: number;
}

export interface BreakSuggestionResponse {
  triggered_thresholds: string[];
  severity: string;
  /** `BreakType`, null when nothing is suggested. */
  break_type: string | null;
  reason: string | null;
}

export interface ModalitySuggestionResponse {
  /** `ContentModality`. */
  suggested: string;
  trigger_reason: string;
  confidence: string;
  adaptation_confidence: number;
}

export interface AdaptResponse {
  lesson_id: string;
  /** e.g. `rule_based` - which engine answered. */
  source: string;
  segments: SegmentAdaptationResponse[];
  break_suggestion: BreakSuggestionResponse;
  proactive_adjustment: { action: string; reason: string } | null;
  modality_suggestion: ModalitySuggestionResponse | null;
}

export const intelligenceApi = {
  getProfile: (studentId: string) =>
    api.get(`/api/intelligence/profile/${studentId}`),
  /**
   * Fetch the adapted lesson structure for a student (§4).
   *
   * `segments` is REQUIRED by `AdaptRequest` and was not being sent, so every
   * call would have 422'd - found by `scripts/contract-check.mjs` rather than
   * by anyone running it, because the only caller is currently unused. The
   * engine adapts a lesson it is shown, so the segments are the lesson: at
   * least one, each with an id, a type and the modalities it can be rendered
   * in.
   *
   * A STUDENT MAY CALL THIS FOR THEMSELVES. The route is Bearer with no role
   * restriction, and a student's own token returns 200 - checked against the
   * deployed API, not inferred from the spec. `useStudentLesson` said the
   * adaptation plan had no student-facing endpoint; that was wrong.
   *
   * `studentId` is nullable in the contract: the backend can take the student
   * from the token, so it is optional here rather than invented by the caller.
   */
  getAdaptation: (
    lessonId: string,
    segments: AdaptSegment[],
    options: { studentId?: string | null; mode?: AdaptationMode } = {},
  ) =>
    api.post<AdaptResponse>("/api/intelligence/adapt", {
      lessonId,
      segments,
      studentId: options.studentId ?? null,
      mode: options.mode ?? "lesson_load",
    }),
  getFlags: (params?: {
    classId?: string;
    studentId?: string;
    limit?: number;
    offset?: number;
  }) => api.get<AttentionFlag[]>("/api/intelligence/flags", { params }),

  /**
   * Acknowledge a flag: the SENCo has seen it and it stops asking.
   *
   * Not a dismissal and not a resolution - the flag stays on the record with
   * `acknowledged: true`, because what Nevo noticed remains true whether or
   * not somebody has read it.
   */
  acknowledgeFlag: (flagId: string) =>
    api.post<AttentionFlag>(`/api/intelligence/flags/${flagId}/acknowledge`),
  getRecommendations: (studentId: string) =>
    api.get(`/api/intelligence/recommendations/${studentId}`),
};
