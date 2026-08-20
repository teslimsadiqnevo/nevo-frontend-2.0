/**
 * Lesson Library mock data (C06 / `Nevo Teacher Library` frame) - everything
 * the teacher has created or can reach, verbatim from the frame.
 * TODO(api): served by the content seam once lesson listing exists.
 */

export type LessonStatus = "Assigned" | "Ready" | "Draft";
export type LibrarySubject = "Mathematics" | "English" | "Sciences";

export interface LibraryLesson {
  id: string;
  title: string;
  subject: LibrarySubject;
  meta: string;
  status: LessonStatus;
  assigned: string;
}

const mk = (
  id: string,
  title: string,
  subject: LibrarySubject,
  meta: string,
  status: LessonStatus,
  assigned: string,
): LibraryLesson => ({ id, title, subject, meta, status, assigned });

export const LIBRARY_LESSONS: LibraryLesson[] = [
  mk("solving-linear-equations", "Solving Linear Equations", "Mathematics", "Mathematics · This term", "Assigned", "JSS 2A, JSS 2B"),
  mk("simplifying-algebraic-fractions", "Simplifying Algebraic Fractions", "Mathematics", "Mathematics · This term", "Assigned", "JSS 2A"),
  mk("introduction-to-algebra", "Introduction to Algebra", "Mathematics", "Mathematics · Last term", "Assigned", "JSS 2A, JSS 2B"),
  mk("algebraic-word-problems", "Algebraic Word Problems", "Mathematics", "Mathematics · This term", "Ready", "Not yet assigned"),
  mk("things-fall-apart", "Comprehension: Things Fall Apart", "English", "English · This term", "Assigned", "JSS 2A, JSS 2B"),
  mk("cell-structure", "Cell Structure & Function", "Sciences", "Biology · This term", "Assigned", "SSS 1 Sciences"),
  mk("balancing-chemical-equations", "Balancing Chemical Equations", "Sciences", "Chemistry · This term", "Ready", "Not yet assigned"),
  mk("forces-motion", "Forces & Motion", "Sciences", "Physics · This term", "Draft", "Draft - not finished"),
];

export const LIBRARY_FILTERS = [
  "All",
  "Mathematics",
  "English",
  "Sciences",
] as const;
export type LibraryFilter = (typeof LIBRARY_FILTERS)[number];
