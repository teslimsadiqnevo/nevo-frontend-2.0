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
  segmentType: string;
  /** At least one - the contract sets minItems: 1. */
  availableModalities: string[];
  conceptId?: string | null;
  estimatedMinutes?: number | null;
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
   */
  getAdaptation: (
    studentId: string,
    lessonId: string,
    segments: AdaptSegment[],
  ) => api.post("/api/intelligence/adapt", { studentId, lessonId, segments }),
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
