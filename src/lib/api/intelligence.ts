import { api } from "./client";

/**
 * Intelligence Framework endpoints (FE Architecture §1 & §4): learner profile,
 * lesson adaptation, attention flags, and recommendations.
 *
 * TODO: type returns against the backend schema (Zero-Tag: no diagnostic labels).
 */
export const intelligenceApi = {
  getProfile: (studentId: string) =>
    api.get(`/api/intelligence/profile/${studentId}`),
  /** Fetch the adapted lesson structure for a student (§4). */
  getAdaptation: (studentId: string, lessonId: string) =>
    api.post("/api/intelligence/adapt", { studentId, lessonId }),
  getFlags: (params?: { classId?: string; studentId?: string }) =>
    api.get("/api/intelligence/flags", { params }),
  getRecommendations: (studentId: string) =>
    api.get(`/api/intelligence/recommendations/${studentId}`),
};
