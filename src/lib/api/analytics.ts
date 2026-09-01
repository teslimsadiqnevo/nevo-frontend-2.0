import { api } from "./client";

/**
 * School-wide analytics (D20 Cohort Analytics · SCRUM-65).
 *
 * AGGREGATE ONLY. Nothing on these routes names a student, and nothing here
 * may be joined back to one on an admin surface - the cohort screen's whole
 * claim to sit inside admin scope is that it shows the shape of a school, not
 * a child.
 *
 * These were previously typed as `unknown` under an "internal-only surface"
 * note. They are the admin proprietor's own reporting data, so they are typed
 * properly here and the note is retired.
 */

/** One period in the outcomes series - a week or a month, backend's choice. */
export interface OutcomePeriod {
  /** ISO date for the START of the period. */
  period: string;
  sessions: number;
  completedSessions: number;
  /** 0..1. */
  completionRate: number;
  averageAdaptations: number;
}

export interface SchoolOutcomes {
  schoolId: string;
  outcomes: OutcomePeriod[];
}

export interface SchoolHealth {
  schoolId: string;
  studentCount: number;
  activeStudentsLast30Days: number;
  completedLessonSessions: number;
  /** 0..1. */
  participationRate: number;
}

/**
 * School-wide concept mastery, dual-track.
 *
 * The same two tracks as the learner profile, one row per concept across every
 * learner: how well the school understands the idea, and the reading level the
 * material demands. A gap between them points at the text rather than the
 * concept, which is the most actionable thing on this screen.
 */
export interface SchoolConceptMastery {
  conceptId: string;
  conceptName: string | null;
  studentCount: number;
  masteryProbabilityConcept: number;
  masteryProbabilityReading: number;
}

/**
 * Counters describing how much adapting Nevo has actually done.
 *
 * NOT the four transformation INDICES D15b draws - see `ReportsView`. These are
 * volumes, and they are labelled as volumes.
 */
export interface TransformationMetrics {
  scope: string;
  studentCount: number;
  lessonsTransformed: number;
  transformationRuns: number;
  lessonSessions: number;
  adaptationsApplied: number;
  adaptationsPerSession: number;
}

export const analyticsApi = {
  /** Headline counts for the school. Also the source of `schoolId`. */
  getSchoolHealth: () => api.get<SchoolHealth>("/api/analytics/schools"),

  /** The period series behind the trend charts. */
  getOutcomes: (params?: { schoolId?: string }) =>
    api.get<SchoolOutcomes>("/api/analytics/outcomes", { params }),

  /** Dual-track mastery for the whole school. */
  getSchoolMastery: (schoolId: string) =>
    api.get<SchoolConceptMastery[]>(`/api/mastery/school/${schoolId}`),

  /**
   * How much transforming has happened. `scope` narrows it; omitted means the
   * whole school.
   */
  getTransformationMetrics: (params?: { scope?: string; cohortId?: string }) =>
    api.get<TransformationMetrics>("/api/transformation-metrics", { params }),
};
