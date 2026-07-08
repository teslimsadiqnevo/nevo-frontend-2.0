import { api } from "./client";

/**
 * Lesson content endpoints (FE Architecture §1): lessons, upload, and bulk
 * curriculum ingestion (Teacher Console C.7).
 *
 * TODO: type payloads/returns against the backend content schema.
 */
export const contentApi = {
  listLessons: (params?: { subject?: string; status?: string }) =>
    api.get("/api/content/lessons", { params }),
  getLesson: (lessonId: string) => api.get(`/api/content/lessons/${lessonId}`),
  uploadLesson: (payload: unknown) =>
    api.post("/api/content/lessons/upload", payload),
  ingestBulk: (payload: unknown) => api.post("/api/content/ingest", payload),
};
