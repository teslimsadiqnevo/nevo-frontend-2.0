import { api } from "./client";

/**
 * The two school-wide admin reads behind the Overview: the NDPA compliance
 * position, and the adaptation log that sits behind "what has Nevo changed".
 *
 * Between them they are the only endpoints that hand an admin real school-level
 * numbers - `mastery/school/{id}` returns concept aggregates keyed by uuids
 * nothing resolves to a name, so it cannot be rendered.
 */

export interface ComplianceFinding {
  [key: string]: unknown;
}

export interface ComplianceAudit {
  schoolId: string;
  /** The only reliably reachable school NAME for an admin. */
  schoolName: string;
  generatedAt: string;
  studentsProfiled: number;
  adaptationEventsLogged: number;
  /** The NDPA claim the compliance card is built on: this should be 0. */
  diagnosticLabelsStored: number;
  compliant: boolean;
  findings: ComplianceFinding[];
}

export interface AdaptationEventRow {
  id: string;
  studentId: string;
  studentFirstName: string;
  lessonId: string;
  lessonTitle: string;
  timestamp: string;
  trigger: string;
  adaptation: string;
  eventType: string;
}

export interface AdaptationLog {
  events: AdaptationEventRow[];
  total: number;
  limit: number;
  offset: number;
}

export interface AdaptationLogQuery {
  classId?: string;
  studentId?: string;
  lessonId?: string;
  dateFrom?: string;
  dateTo?: string;
  limit?: number;
  offset?: number;
}

export const schoolIntelligenceApi = {
  /** GET /api/admin/compliance-audit */
  complianceAudit: () => api.get<ComplianceAudit>("/api/admin/compliance-audit"),

  /** POST /api/admin/compliance-audit/scan - re-runs the verification. */
  runComplianceScan: () =>
    api.post<ComplianceAudit>("/api/admin/compliance-audit/scan"),

  /** GET /api/admin/adaptation-log */
  adaptationLog: (query: AdaptationLogQuery = {}) =>
    api.get<AdaptationLog>("/api/admin/adaptation-log", {
      params: {
        classId: query.classId,
        studentId: query.studentId,
        lessonId: query.lessonId,
        dateFrom: query.dateFrom,
        dateTo: query.dateTo,
        limit: query.limit,
        offset: query.offset,
      },
    }),
};
