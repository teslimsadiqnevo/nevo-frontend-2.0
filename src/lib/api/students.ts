import { api } from "./client";

/**
 * What a teacher can read about one student.
 *
 * Four endpoints, because the contract splits them: identity and open-flag
 * count, the learner profile, per-concept mastery, and recommendations.
 *
 * ZERO-TAG APPLIES HERE, and it is now a RULING, not a pending question
 * (Olayinka, 30 Aug 2026): `workingMemoryCapacity` and `attentionSpan` are
 * never rendered on any teacher-visible surface. A number against a child's
 * working memory is a diagnostic-shaped measurement, which is exactly what
 * the D22 compliance screen promises Nevo does not hold. The accommodations
 * read carries everything actionable in those numbers, in the product's own
 * register.
 *
 * BACKEND HONOURED THE RULING (31 Aug 2026): `/api/intelligence/profile/{id}`
 * is now `{studentId, status, observedEventCount}` and returns neither field
 * on any teacher-scoped read. They are gone from `LearnerProfile` below - a
 * type that declares fields the API never sends is a standing invitation to
 * render them.
 *
 * `mastery/student` NOW CARRIES `conceptName` (31 Aug 2026), so the
 * `/api/concepts` round trip that resolved ids to names is gone. It was
 * best-effort and silently swallowed its own failure, which meant a teacher
 * could be shown a raw UUID as the name of the concept their student was
 * struggling with.
 *
 * CONVERSATION EVIDENCE IS RULED AGGREGATE-ONLY (Olayinka, 30 Aug 2026).
 * `/api/conversation-evidence/student/{id}` returns per-question rows -
 * which page a child was on each time they asked Nevo for help. A teacher-
 * visible log of help-seeking chills exactly the students who most need a
 * safe place to ask, so the per-question rows are never shown. What MAY ship,
 * once design draws it: the pattern only - interaction count and category mix
 * over the period - and nothing at all below 3 interactions, so a single
 * question is never traceable. Untyped here until that element exists.
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
  observedEventCount: number | null;
}

export interface ConceptMasteryRow {
  studentId: string;
  conceptId: string;
  /** Shipped 31 Aug. Before it, this read had ids only. */
  conceptName: string;
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

/** One row of the student's own recent lesson activity. */
export interface DashboardProgressRow {
  lessonId: string;
  /** LessonCompletionStatus: in_progress | completed | exited. */
  status: string;
  segmentPosition: number;
  updatedAt: string;
}

/**
 * The admin roster's view of a student (D7 / D7b). Enrolment fact only - this
 * shape must never grow a score, a mastery figure or an adaptation.
 *
 * WHAT IS NOT HERE, and cannot be: CONSENT. D7 exists to answer "which
 * students cannot yet begin lessons", and the list route returns no consent
 * field of any kind. See the note on `StudentsView` - it is not derived from
 * `status`, because an account being active is a different fact from a parent
 * having agreed, and conflating them would misinform a school about a legal
 * position.
 */
export interface AdminStudentRow {
  id: string;
  /** Always present - the backend composes its own fallback. */
  name: string;
  /** The student's sign-in name. Belongs on the detail page; do not drop it. */
  loginIdentifier: string | null;
  /** "active" | "deactivated" in practice; the schema does not narrow it. */
  status: string;
  ageBand: string | null;
}

export interface AdminStudentDetail {
  id: string;
  firstName: string | null;
  lastName: string | null;
  loginIdentifier: string | null;
  email: string | null;
  status: string;
  ageBand: string | null;
  classIds: string[];
  firstUse: boolean;
}

/**
 * A guardian attached to a student.
 *
 * `account_created` is the closest thing the API has to a consent signal, and
 * it is NOT the same thing - it says an account exists, not that consent was
 * given, refused, pending or withdrawn. D7b's four-state consent record cannot
 * be built from it and is not attempted.
 */
export interface ParentLink {
  id: string;
  school_id: string;
  student_id: string;
  parent_id: string | null;
  parent_name: string;
  parent_contact: string;
  contact_method: string;
  account_created: boolean;
}

export const studentsApi = {
  /**
   * The school roster. Deactivated students are excluded by default and
   * reachable by filter, which is what `includeInactive` does. `classId`
   * narrows to one class - the same filter D7's "All classes" pill drives.
   */
  list: (options: { classId?: string; includeInactive?: boolean } = {}) =>
    api.get<AdminStudentRow[]>("/api/v1/students", {
      params: {
        classId: options.classId,
        includeInactive: options.includeInactive ? true : undefined,
      },
    }),

  /** One student, admin-scoped. GET /api/v1/students/{student_id} */
  get: (studentId: string) =>
    api.get<AdminStudentDetail>(`/api/v1/students/${studentId}`),

  /** Guardians on the record. */
  parentLinks: (studentId: string) =>
    api.get<ParentLink[]>(`/api/v1/students/${studentId}/parent-links`),

  /**
   * Move a student to another class. A move never resets anything - no
   * progress, no profile, no history - and the sheet says so before it
   * commits.
   *
   * TODO(api): D7c offers "Move now" or a scheduled date at the start of next
   * term. The endpoint takes a class id and nothing else, so only "now" is
   * built rather than pretending a date was honoured.
   */
  moveToClass: (studentId: string, classId: string) =>
    api.patch<{ studentId: string; classId: string }>(
      `/api/v1/students/${studentId}/class`,
      { classId },
    ),

  /** Step one of two. Reversible, keeps everything, frees the seat. */
  deactivate: (studentId: string) =>
    api.post<void>(`/api/v1/students/${studentId}/deactivate`),

  /** Undo a deactivation - they pick up exactly where they left off. */
  restore: (studentId: string) =>
    api.post<void>(`/api/v1/students/${studentId}/restore`),

  /**
   * Step two of two, and the only permanent deletion in the admin set. Only
   * reachable once a student is already deactivated, and gated on their name
   * typed exactly. Severity comes from friction, not from colour.
   */
  erase: (studentId: string) => api.del<void>(`/api/v1/students/${studentId}`),
  /**
   * The signed-in student's own landing data: who they are, what has been
   * assigned to them (each with its lesson summary nested), and their recent
   * lesson activity. GET /api/v1/students/me/dashboard
   */
  myDashboard: () =>
    api.get<{
      student: StudentIdentity;
      assignments: import("./assignments").Assignment[];
      recentProgress: DashboardProgressRow[];
    }>("/api/v1/students/me/dashboard"),

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

/**
 * Ask Nevo help-seeking, aggregate only.
 *
 * `privacy` is the SERVER's gate, not ours: `withheld_below_minimum` means it
 * has decided there is too little here to say anything, and nothing may be
 * rendered in that case - not a zero, not a "no data yet". `categories` is a
 * name -> count map; there are no per-question rows in this response and there
 * must never be. See the ruling at the top of this file.
 */
export interface ConversationEvidence {
  studentId: string;
  periodDays: number;
  interactionCount: number;
  categories: Record<string, number>;
  helpfulResponseRate: number | null;
  privacy: "aggregate_only" | "withheld_below_minimum";
  minimumInteractions?: number;
}

export const conversationEvidenceApi = {
  forStudent: (studentId: string) =>
    api.get<ConversationEvidence>(
      `/api/conversation-evidence/student/${studentId}`,
    ),
};

export const classInsightsApi = {
  /**
   * Shared misconceptions. `minimumStudents` filters out one-offs.
   *
   * THREE IS THE FLOOR, and it is the server's, not a preference: the spec
   * constrains this parameter to `minimum: 3` (default 3, max 50). We sent 2,
   * so every single request 422'd and C09's "a shared sticking point" section
   * has never rendered for any class since it was written. Do not lower it.
   */
  misconceptions: (classId: string, minimumStudents = 3) =>
    api.get<ClassMisconception[]>(`/api/misconceptions/class/${classId}`, {
      params: { minimumStudents },
    }),

  mastery: (classId: string) =>
    api.get<ClassMasteryRow[]>(`/api/mastery/class/${classId}`),
};
