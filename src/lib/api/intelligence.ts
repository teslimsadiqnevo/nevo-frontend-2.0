import { api } from "./client";

/**
 * Intelligence Framework endpoints (FE Architecture §1 & §4): learner profile,
 * lesson adaptation, attention flags, and recommendations.
 *
 * A flag names a student by id and describes what Nevo noticed, in the same
 * plain register the console writes in. It carries NO evidence series and no
 * action target - the C03 card's sparkline and its two links have no source -
 * and `flagType` has no enum, so anything unrecognised must still render.
 *
 * Zero-Tag holds here: `description` is about behaviour in the moment, never a
 * diagnosis.
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
}
export const intelligenceApi = {
  getProfile: (studentId: string) =>
    api.get(`/api/intelligence/profile/${studentId}`),
  /** Fetch the adapted lesson structure for a student (§4). */
  getAdaptation: (studentId: string, lessonId: string) =>
    api.post("/api/intelligence/adapt", { studentId, lessonId }),
  getFlags: (params?: { classId?: string; studentId?: string }) =>
    api.get<AttentionFlag[]>("/api/intelligence/flags", { params }),
  getRecommendations: (studentId: string) =>
    api.get(`/api/intelligence/recommendations/${studentId}`),
};
