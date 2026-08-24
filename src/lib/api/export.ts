import { api } from "./client";

/**
 * IEP exporter endpoints, typed against the deployed backend (openapi
 * 2.0.0; Admin D.8). Flow: create draft → edit → mandatory SENCo review →
 * share with a parent. All admin-surface seams for the admin campaign.
 */

export type IepExportStatus = "draft" | "final";
export type IepExportShareStatus = "shared" | "revoked";

export interface IepExport {
  id: string;
  studentId: string;
  requestedByUserId: string;
  periodStart: string;
  periodEnd: string;
  status: IepExportStatus;
  exportContent: string;
  sourceSummary: Record<string, unknown>;
  annotations: Record<string, unknown>[];
  aiGatewayCallId: string | null;
  reviewedByUserId: string | null;
  reviewedAt: string | null;
  reviewNote: string | null;
}

export interface IepExportShare {
  id: string;
  exportId: string;
  studentId: string;
  parentId: string;
  sharedByUserId: string;
  status: IepExportShareStatus;
  sharedAt: string;
}

export const exportApi = {
  /** Create a draft export for a period. POST /api/v1/exports/iep */
  create: (payload: {
    studentId: string;
    periodStart: string;
    periodEnd: string;
  }) => api.post<IepExport>("/api/v1/exports/iep", payload),

  /** Read one export. */
  get: (exportId: string) =>
    api.get<IepExport>(`/api/v1/exports/iep/${exportId}`),

  /** Edit draft content/annotations. */
  update: (
    exportId: string,
    payload: {
      exportContent?: string | null;
      annotations?: Record<string, unknown>[] | null;
    },
  ) => api.patch<IepExport>(`/api/v1/exports/iep/${exportId}`, payload),

  /** SENCo review finalises the draft. */
  review: (
    exportId: string,
    payload: { reviewNote?: string | null; exportContent?: string | null },
  ) => api.post<IepExport>(`/api/v1/exports/iep/${exportId}/review`, payload),

  /** Share a finalised export with a parent account. */
  share: (exportId: string, payload: { parentId: string }) =>
    api.post<IepExportShare>(`/api/v1/exports/iep/${exportId}/share`, payload),
};
