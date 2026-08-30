import { api } from "./client";

/**
 * What a teacher can read about one student.
 *
 * Four endpoints, because the contract splits them: identity and open-flag
 * count, the learner profile, per-concept mastery, and recommendations.
 *
 * ZERO-TAG APPLIES HERE. `workingMemoryCapacity` and `attentionSpan` are
 * engine parameters, not things to show a teacher as a score about a child -
 * C08's rule is that the page must hold up if a parent or the SENCo reads it,
 * and Nevo's whole NDPA claim is that it holds no diagnostic label about
 * anyone. They are typed so the shape is honest, and deliberately not
 * rendered. See `LiveStudentProfile`.
 *
 * `mastery/student` returns `conceptId` and no name, though `mastery/class`
 * carries `conceptName` - so `/api/concepts` resolves it. Flagged to backend.
 *
 * NOT TYPED HERE ON PURPOSE: `/api/conversation-evidence/student/{id}`. Its
 * `recentEvidence` rows carry `currentPage` and `contextIds` - which page a
 * child was on when they asked Nevo for help, one row per question. That is
 * the student's Ask Nevo usage, not the learning evidence C08's "What Nevo has
 * seen" section shows, and putting a teacher-visible log of where a child
 * asked for help on this page is a product and privacy decision rather than a
 * wiring one. Raised, deliberately unwired.
 */

export interface StudentIdentity {
  id: string;
  firstName: string | null;
  lastName: string | null;
  ageBand: string | null;
}

export interface StudentProfileResponse {
  student: StudentIdentity;
  /** Free-form in the spec; not read. */
  profile: Record<string, unknown> | null;
  openFlagCount: number;
}

export interface LearnerProfile {
  studentId: string;
  /** `observed` once Nevo has watched enough to adapt. */
  status: string;
  workingMemoryCapacity: number | null;
  attentionSpan: number | null;
  observedEventCount: number | null;
}

export interface ConceptMasteryRow {
  studentId: string;
  conceptId: string;
  /** 0-1. The frame's bars are percentages. */
  masteryProbabilityConcept: number;
  masteryProbabilityReading: number;
  attentionWeights: Record<string, unknown>;
  practiceCount: number;
  lastResponseCorrect: boolean | null;
  lastFailureAttribution: string;
  seedingSource: string;
}

export interface Recommendation {
  id: string;
  studentId: string;
  /** Already written in plain language by the backend. */
  recommendationText: string;
  generatedAt: string;
}

export interface StudentAdaptation {
  id: string;
  studentId: string;
  lessonId: string;
  lessonTitle: string;
  timestamp: string;
  eventType: string;
  /** What prompted it. */
  trigger: string;
  /** What Nevo did, in the product's own plain register. */
  adaptation: string;
  /** True when the adaptation was considered and withheld. */
  suppressed: boolean;
}

export interface Concept {
  id: string;
  name: string;
  subject: string;
}

/** What Nevo is currently offering this student, and on what evidence. */
export type AccommodationType = "reading" | "attention" | "numerical";

export interface AccommodationSignal {
  accommodation: AccommodationType;
  frontendSignal: string;
  evidence: string[];
  lessonCount: number;
}

export interface Accommodations {
  studentId: string;
  activeAccommodations: AccommodationType[];
  frontendSignals: string[];
  signals: AccommodationSignal[];
  source: string;
  /**
   * The Zero-Tag assertion: whether any of this was written down as a label
   * about the child. It should always be false, and the compliance screen
   * makes the same claim school-wide, so it is not rendered per student -
   * but it is typed, because a `true` here would matter enormously.
   */
  persistedAsLabel: boolean;
}

export interface LessonProgress {
  lessonId: string;
  title: string;
  /** `in_progress` | `completed` | `exited`, per LessonCompletionStatus. */
  status: string;
  /**
   * Indices into the lesson. Whether they are 0- or 1-based is not stated in
   * the spec and cannot be told apart from one demo school's data, so they
   * are typed and not rendered - "section 0" in front of a teacher is worse
   * than no position at all.
   */
  modulePosition: number;
  segmentPosition: number;
  updatedAt: string;
}

export interface StudentProgress {
  studentId: string;
  subject: string | null;
  masteryAverage: number | null;
  concepts: {
    conceptId: string;
    name: string;
    subject: string;
    understanding: number;
    reading: number;
    practiceCount: number;
  }[];
  lessons: LessonProgress[];
}

export const studentsApi = {
  profile: (studentId: string) =>
    api.get<StudentProfileResponse>(`/api/v1/students/${studentId}/profile`),

  learnerProfile: (studentId: string) =>
    api.get<LearnerProfile>(`/api/intelligence/profile/${studentId}`),

  mastery: (studentId: string) =>
    api.get<ConceptMasteryRow[]>(`/api/mastery/student/${studentId}`),

  recommendations: (studentId: string) =>
    api.get<Recommendation[]>(`/api/intelligence/recommendations/${studentId}`),

  /** What Nevo quietly adjusted, and why (C16c). */
  adaptations: (studentId: string, limit = 8) =>
    api.get<StudentAdaptation[]>(`/api/adaptations/student/${studentId}`, {
      params: { limit },
    }),

  /** Lessons this student has worked through, newest activity first. */
  progress: (studentId: string) =>
    api.get<StudentProgress>(`/api/students/${studentId}/progress`),

  /** Active accommodations and the evidence behind them. */
  accommodations: (studentId: string) =>
    api.get<Accommodations>(`/api/intelligence/accommodations/${studentId}`),

  /** Concept names, to resolve the ids mastery returns. */
  concepts: () => api.get<Concept[]>("/api/concepts"),
};

/** One misconception several students in a class share (C09). */
export interface ClassMisconception {
  conceptId: string;
  conceptName: string;
  /** A short name for the shape of the error. */
  pattern: string;
  studentCount: number;
  description: string;
}

/** Class-level mastery per concept. Carries `conceptName`, unlike the
 *  per-student read - see the note at the top of this file. */
export interface ClassMasteryRow {
  conceptId: string;
  conceptName: string;
  studentCount: number;
  masteryProbabilityConcept: number;
  masteryProbabilityReading: number;
}

export const classInsightsApi = {
  /** Shared misconceptions. `minimumStudents` filters out one-offs. */
  misconceptions: (classId: string, minimumStudents = 2) =>
    api.get<ClassMisconception[]>(`/api/misconceptions/class/${classId}`, {
      params: { minimumStudents },
    }),

  mastery: (classId: string) =>
    api.get<ClassMasteryRow[]>(`/api/mastery/class/${classId}`),
};
