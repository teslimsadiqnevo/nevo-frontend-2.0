import { api } from "./client";

/**
 * The two school-wide admin reads behind the Overview: the NDPA compliance
 * position, and the adaptation log that sits behind "what has Nevo changed".
 *
 * Between them they are the only endpoints that hand an admin real school-level
 * numbers - `mastery/school/{id}` returns concept aggregates keyed by uuids
 * nothing resolves to a name, so it cannot be rendered.
 */

/**
 * One thing the scan turned up, as a locator into the store.
 *
 * The spec's shape exactly: four required strings, no severity and no
 * category, so findings cannot be ranked or graded - the screen may only
 * count them.
 *
 * CAUTION: `term` is the matched text. On a scan for diagnostic labels that
 * is likely to BE a diagnostic label, which is the one category of string
 * this product may never put on screen. Nothing renders a finding's contents
 * today, and nothing should start without design ruling on `term` first.
 */
/**
 * A finding, with the two fields counsel forbade REMOVED AT THE BOUNDARY.
 *
 * Counsel cleared this screen on 14 Sep with four rules. Two of them are
 * subtractive: never show the flagged `term`, and never show the `recordId`,
 * which ties a finding to an identifiable child. The wire carries both - all
 * four fields are required on `ComplianceFindingResponse` - so they are
 * stripped in `stripFinding` below rather than merely left unrendered.
 *
 * WHY STRIP RATHER THAN DECLINE TO RENDER. A field that is in React state is
 * one `{JSON.stringify(finding)}` away from a screen, one debug log away from
 * a console, and one props-spread away from an attribute. The rule is easier
 * to keep if the data is not there. This type is what the rest of the console
 * is allowed to know a finding is.
 */
export interface ComplianceFinding {
  /** Which table the scan matched in. A database locator, not a category. */
  table: string;
  /** Which column. Also a locator - see the note on category in the view. */
  field: string;
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

/** The wire shape, which carries two fields this console must not hold. */
interface ComplianceFindingWire extends ComplianceFinding {
  recordId?: string;
  term?: string;
}

/**
 * Drop `term` and `recordId` before the audit reaches anything that renders.
 *
 * Deliberately rebuilt field by field rather than destructured-and-rested: a
 * rest spread would silently carry any NEW identifying field the backend adds
 * later, and this is the one screen where that must not happen by default.
 */
function stripFindings(audit: ComplianceAudit): ComplianceAudit {
  const wire = audit.findings as ComplianceFindingWire[] | undefined;
  return {
    ...audit,
    findings: (Array.isArray(wire) ? wire : []).map((f) => ({
      table: f.table,
      field: f.field,
    })),
  };
}

export const schoolIntelligenceApi = {
  /** GET /api/admin/compliance-audit */
  complianceAudit: () =>
    api.get<ComplianceAudit>("/api/admin/compliance-audit").then(stripFindings),

  /** POST /api/admin/compliance-audit/scan - re-runs the verification. */
  runComplianceScan: () =>
    api
      .post<ComplianceAudit>("/api/admin/compliance-audit/scan")
      .then(stripFindings),

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
