import { api } from "./client";

/**
 * IEP exporter endpoints (FE Architecture §1; Admin D.8). Flow: generate draft →
 * mandatory SENCo review → finalize/share.
 *
 * TODO: type payloads/returns against the backend export schema.
 */
export const exportApi = {
  generateDraft: (studentId: string, period: { from: string; to: string }) =>
    api.post("/api/export/iep/draft", { studentId, period }),
  finalize: (draftId: string, payload: unknown) =>
    api.post(`/api/export/iep/${draftId}/finalize`, payload),
};
