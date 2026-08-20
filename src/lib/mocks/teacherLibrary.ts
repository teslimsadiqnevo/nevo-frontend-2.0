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

/* ---- C06b Lesson Detail ---- */

export type SectionType =
  | "Explanatory"
  | "Worked example"
  | "Practice"
  | "Extension";

export interface LessonSectionRow {
  title: string;
  type: SectionType;
  /** Completion for assigned lessons; ready/draft rows carry none. */
  done?: number;
  total?: number;
  /** "Several students slowed here" - violet bar + callout. */
  slowed?: boolean;
}

export interface LessonDetailData {
  /** Meta line: subject · term · N sections. */
  metaLine: string;
  /** Assigned layout: the three stat cards (tablet shows the first two). */
  stats?: { assignedTo: string; assignedToShort: string; finished: string; opened: string };
  /** Assigned layout: the plain-language dip line above the sections. */
  dipNote?: string;
  /** Assigned layout: the lightbulb note under the sections. */
  aiNote?: string;
  /** Ready layout: the "Ready when you are" banner body. */
  readyNote?: string;
  sections: LessonSectionRow[];
}

const sec = (
  title: string,
  type: SectionType,
  done?: number,
  total?: number,
  slowed = false,
): LessonSectionRow => ({ title, type, done, total, slowed });

/** Per-lesson detail. Solving Linear Equations and Balancing Chemical
 *  Equations carry the C06b doc's exact content; the rest are plausible
 *  same-shape mocks. No Draft detail state exists in C06b - flagged to
 *  design; drafts render header + sections only. */
export const LESSON_DETAILS: Record<string, LessonDetailData> = {
  "solving-linear-equations": {
    metaLine: "Mathematics · This term · 6 sections",
    stats: { assignedTo: "JSS 2A · JSS 2B", assignedToShort: "JSS 2A · 2B", finished: "18 of 28 · JSS 2A", opened: "Yesterday, 8:00 AM" },
    dipNote: "The one dip is section 4 - worth a few minutes together before the next lesson.",
    aiNote:
      "Nevo read section 4 aloud for the students who prefer to hear it first. If the slowdown continues next lesson, it may be worth reworking that explanation.",
    sections: [
      sec("What an equation is", "Explanatory", 18, 18),
      sec("Keeping both sides balanced", "Worked example", 18, 18),
      sec("Solving for x", "Worked example", 17, 18),
      sec("Equations with x on both sides", "Practice", 11, 18, true),
      sec("Word problems", "Practice", 14, 18),
      sec("A tricky one", "Extension", 9, 18),
    ],
  },
  "balancing-chemical-equations": {
    metaLine: "Chemistry · This term · 5 sections",
    readyNote:
      "Nevo has prepared this lesson into 5 sections. Assign it to a class and it'll open for students at the time you choose.",
    sections: [
      sec("What a chemical equation shows", "Explanatory"),
      sec("Counting atoms on each side", "Worked example"),
      sec("Balancing step by step", "Worked example"),
      sec("Practice set", "Practice"),
      sec("A harder one", "Extension"),
    ],
  },
  "simplifying-algebraic-fractions": {
    metaLine: "Mathematics · This term · 4 sections",
    stats: { assignedTo: "JSS 2A", assignedToShort: "JSS 2A", finished: "26 of 28 · JSS 2A", opened: "Last week" },
    dipNote: "Nothing slowed the class - a steady run start to finish.",
    aiNote:
      "Most of the class took this read-first and moved evenly. Nothing here needs your attention.",
    sections: [
      sec("What a fraction of an expression means", "Explanatory", 27, 28),
      sec("Common factors first", "Worked example", 27, 28),
      sec("Simplifying step by step", "Worked example", 26, 28),
      sec("Practice set", "Practice", 26, 28),
    ],
  },
  "introduction-to-algebra": {
    metaLine: "Mathematics · Last term · 5 sections",
    stats: { assignedTo: "JSS 2A · JSS 2B", assignedToShort: "JSS 2A · 2B", finished: "Everyone finished", opened: "Last term" },
    dipNote: "Finished last term - everyone completed it.",
    aiNote:
      "This one's done its job: both classes completed it and it now feeds the current equations work.",
    sections: [
      sec("Letters standing for numbers", "Explanatory", 58, 58),
      sec("Reading an expression", "Worked example", 58, 58),
      sec("Writing your own", "Practice", 58, 58),
      sec("Substituting values", "Worked example", 58, 58),
      sec("Mixed practice", "Practice", 58, 58),
    ],
  },
  "things-fall-apart": {
    metaLine: "English · This term · 4 sections",
    stats: { assignedTo: "JSS 2A · JSS 2B", assignedToShort: "JSS 2A · 2B", finished: "25 of 30 · JSS 2B", opened: "Monday, 8:00 AM" },
    dipNote: "Reading pace varied, as it should - no section stood out.",
    aiNote:
      "A few students took the narrated version of the opening chapters; their comprehension answers match the readers'.",
    sections: [
      sec("Setting and voice", "Explanatory", 28, 30),
      sec("Chapter 1 close reading", "Worked example", 27, 30),
      sec("Chapters 2-3", "Practice", 25, 30),
      sec("Discussion questions", "Extension", 21, 30),
    ],
  },
  "cell-structure": {
    metaLine: "Biology · This term · 5 sections",
    stats: { assignedTo: "SSS 1 Sciences", assignedToShort: "SSS 1", finished: "22 of 31 · SSS 1", opened: "2 days ago" },
    dipNote: "Steady so far - the diagram section is where most time is going, as designed.",
    aiNote:
      "The labelled-diagram section is doing the heavy lifting; several students revisited it before the practice set, which is the intended path.",
    sections: [
      sec("What cells are", "Explanatory", 29, 31),
      sec("The labelled diagram", "Worked example", 26, 31),
      sec("Organelles and jobs", "Explanatory", 24, 31),
      sec("Match and label", "Practice", 22, 31),
      sec("Compare two cells", "Extension", 15, 31),
    ],
  },
  "algebraic-word-problems": {
    metaLine: "Mathematics · This term · 4 sections",
    readyNote:
      "Nevo has prepared this lesson into 4 sections. Assign it to a class and it'll open for students at the time you choose.",
    sections: [
      sec("From words to an equation", "Explanatory"),
      sec("Two worked problems", "Worked example"),
      sec("Practice set", "Practice"),
      sec("A multi-step one", "Extension"),
    ],
  },
  "forces-motion": {
    metaLine: "Physics · This term · 3 sections so far",
    sections: [
      sec("What a force is", "Explanatory"),
      sec("Measuring motion", "Worked example"),
      sec("Practice set", "Practice"),
    ],
  },
};

export function getLibraryLesson(
  id: string,
): (LibraryLesson & { detail: LessonDetailData }) | null {
  const lesson = LIBRARY_LESSONS.find((l) => l.id === id);
  const detail = LESSON_DETAILS[id];
  return lesson && detail ? { ...lesson, detail } : null;
}
