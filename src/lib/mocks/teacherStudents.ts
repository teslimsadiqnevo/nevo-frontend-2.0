import { TEACHER_CLASSES, type TeacherClass } from "./teacherClasses";

/**
 * Student-profile mock data (C08). The frame draws two states: a full profile
 * with enough history (Amara Okafor) and an early / low-confidence profile
 * for a student Nevo is still learning (drawn with Zainab Yusuf).
 *
 * Every roster student resolves: the one with a written profile gets the full
 * page, everyone else gets the designed early state carrying their own name
 * and class. Confidence is one-to-three quiet dots, never a percentage, and
 * there is no clinical language anywhere - the page has to hold up if a
 * parent or the SENCo reads it.
 *
 * TODO(api): `/api/v1/students/{id}/profile` and `/api/intelligence/profile/{id}`
 * are deployed and typed but unwired; the per-student observations these
 * fixtures carry have no endpoint at all.
 */

export type ConfidenceLevel = 1 | 2 | 3;

export interface Dimension {
  statement: string;
  level: ConfidenceLevel;
}

export interface ConceptMastery {
  name: string;
  /** 0-100. */
  u: number;
  /** 0-100. */
  r: number;
  /** Overrides the component's auto label; "none" suppresses it. */
  flag?: string;
}

export interface EvidenceItem {
  concept: string;
  badge: "Demonstrated" | "Developing";
  when: string;
  desc?: string;
}

export interface SessionStep {
  title: string;
  note: string;
  /** true = "took her time here" (violet clock), false = steady (navy check). */
  took: boolean;
}

export interface SessionRow {
  id: string;
  date: string;
  /** Long form for the panel eyebrow: "9 Jul" -> "9 July". */
  dateLong: string;
  lesson: string;
  note: string;
  /** Panel subtitle tail, e.g. "finished in two sittings". Designed for the
   *  9 Jul session only; omitted elsewhere rather than invented. */
  sitting?: string;
  /** Panel summary card. The tablet line is a rewrite, not a truncation. */
  summary?: { desktop: string; tablet: string };
  /** Section-by-section list; only the 9 Jul session is designed (C08d). */
  steps?: SessionStep[];
}

export interface LessonOption {
  id: string;
  lesson: string;
  /** "listen-first" / "standard"; absent when the lesson has no variant. */
  version?: string;
  meta: string;
  suggested?: boolean;
}

export interface RecommendData {
  /** Nevo's reason, in a colleague's voice. Tablet is a shorter rewrite. */
  suggestDesktop: string;
  suggestTablet: string;
  /** The emphasised run inside the desktop reason, bolded per the frame. */
  suggestStrong: string;
  options: LessonOption[];
}

export interface StudentProfileData {
  id: string;
  name: string;
  initials: string;
  classId: string;
  className: string;
  /** Meta line under the name. */
  meta: string;
  /** Present only on the full profile. */
  chip?: string;
  /** The "This week" noticing banner - desktop and its compressed tablet line. */
  noticing?: { desktop: string; tablet: string };
  /** The early state's calm callout; mutually exclusive with `noticing`. */
  earlyNote?: string;
  /** Carried explicitly so the designed copy stays exact; never inferred
   *  from a name. Students without a recorded pronoun read as they/them. */
  pronoun: { subject: string; possessive: string };
  dimensions: Dimension[];
  concepts: ConceptMastery[];
  evidence: EvidenceItem[];
  sessions: SessionRow[];
  /** C08c. Only students with a full profile can be recommended to. */
  recommend?: RecommendData;
}

export const CONFIDENCE_LABEL: Record<ConfidenceLevel, string> = {
  3: "Clear pattern",
  2: "Emerging",
  1: "Early signal",
};

/** Matches the roster links already in place: name -> "amara-okafor". */
export const studentSlug = (name: string) =>
  name.toLowerCase().replace(/\s+/g, "-");

const AMARA: Omit<StudentProfileData, "classId" | "className"> = {
  id: "amara-okafor",
  name: "Amara Okafor",
  initials: "AO",
  meta: "JSS 2A · Mathematics & English",
  chip: "Worth a glance",
  pronoun: { subject: "She", possessive: "her" },
  recommend: {
    suggestDesktop:
      "Since Amara's been slower on written work lately, the listen-first version of \"Simplifying Expressions\" would play to how she's been learning best this week.",
    suggestStrong: 'listen-first version of "Simplifying Expressions"',
    suggestTablet:
      "Since Amara's been slower on written work, the listen-first version of \"Simplifying Expressions\" fits how she's learning best this week.",
    options: [
      {
        id: "simplifying-expressions-listen-first",
        lesson: "Simplifying Expressions",
        version: "listen-first",
        meta: "Audio-led · 5 sections",
        suggested: true,
      },
      {
        id: "simplifying-expressions-standard",
        lesson: "Simplifying Expressions",
        version: "standard",
        meta: "Text-led · 5 sections",
      },
      {
        id: "algebraic-word-problems",
        lesson: "Algebraic Word Problems",
        meta: "Text-led · 4 sections",
      },
    ],
  },
  noticing: {
    desktop:
      "Amara's been taking longer on the written segments - three sessions running. She's getting there, just slower. She settles faster when she can hear it first.",
    tablet:
      "longer on written segments, three sessions running. Settles faster when she can hear it first.",
  },
  dimensions: [
    { statement: "Prefers to hear an explanation before reading it herself", level: 3 },
    { statement: "Does her best thinking when she's given a little more time", level: 3 },
    { statement: "Stays with a task longer when there's a clear finish line", level: 2 },
    { statement: "Comes back sharper after a short movement break", level: 2 },
  ],
  // None of these four trip the component's auto-flag thresholds, so no flag
  // pill renders on this data - that is the frame's intent, not a gap.
  concepts: [
    { name: "Solving linear equations", u: 84, r: 66 },
    { name: "Simplifying expressions", u: 79, r: 63 },
    { name: "Algebraic fractions", u: 58, r: 60 },
    { name: "Comprehension: prose texts", u: 86, r: 72 },
  ],
  evidence: [
    { concept: "Solving linear equations", badge: "Demonstrated", when: "Yesterday" },
    { concept: "Comprehension: prose texts", badge: "Demonstrated", when: "Monday" },
    {
      concept: "Algebraic fractions",
      badge: "Developing",
      when: "2 days ago",
      desc: "Her method is sound; she's just slower through the written steps. It reads like reading load, not the maths.",
    },
    { concept: "Simplifying expressions", badge: "Demonstrated", when: "3 days ago" },
  ],
  // Session titles are Title Case here and sentence case in the mastery and
  // evidence lists - reproduced from the frame; flagged to design.
  sessions: [
    {
      id: "9-jul",
      date: "9 Jul",
      dateLong: "9 July",
      lesson: "Solving Linear Equations",
      note: "Worked through it in two sittings. Took the listen-first route on the second half and finished comfortably.",
      sitting: "finished in two sittings",
      summary: {
        desktop:
          "Amara took her time on the written practice and stepped away once, then came back the next morning and finished comfortably. Switching to the listen-first explanation seemed to help her settle.",
        tablet:
          "Took her time on the written practice, stepped away once, came back the next morning and finished. Listen-first seemed to help her settle.",
      },
      steps: [
        { title: "What an equation is", note: "Straight through - this was familiar ground.", took: false },
        { title: "Keeping both sides balanced", note: "Watched the worked example twice, then moved on.", took: false },
        { title: "Solving for x", note: "Comfortable here.", took: false },
        {
          title: "Equations with x on both sides",
          note: "Took her time - this is where she paused and came back the next day.",
          took: true,
        },
        { title: "Word problems", note: "Switched to listen-first and it went more smoothly.", took: false },
        { title: "A tricky one", note: "Gave it a good try and got most of the way.", took: false },
      ],
    },
    // C08d designs the section-by-section detail for the 9 Jul session only.
    // The rest open the same panel carrying their own designed note as the
    // summary; the section list is omitted rather than invented.
    {
      id: "8-jul",
      date: "8 Jul",
      dateLong: "8 July",
      lesson: "Simplifying Expressions",
      note: "Straight through, no breaks needed. This one sat well with her.",
    },
    {
      id: "5-jul",
      date: "5 Jul",
      dateLong: "5 July",
      lesson: "Introduction to Algebra",
      note: "Slower on the written practice, but got there. Stepped away once and picked it back up fine.",
    },
    {
      id: "3-jul",
      date: "3 Jul",
      dateLong: "3 July",
      lesson: "Comprehension: Things Fall Apart",
      note: "Strong on this - finished early and answered the stretch question.",
    },
  ],
};

/** The early state's two dimension cards, both at level 1. */
const EARLY_DIMENSIONS: Dimension[] = [
  { statement: "Seems to settle into practice questions quickly", level: 1 },
  { statement: "May prefer shorter segments - still early to say", level: 1 },
];

const initialsOf = (name: string) =>
  name
    .split(/\s+/)
    .slice(0, 2)
    .map((p) => p[0]?.toUpperCase() ?? "")
    .join("");

function classOf(name: string): TeacherClass | null {
  return (
    TEACHER_CLASSES.find((c) => c.roster.some((s) => s.name === name)) ?? null
  );
}

export function getStudentProfile(slug: string): StudentProfileData | null {
  const student = TEACHER_CLASSES.flatMap((c) => c.roster).find(
    (s) => studentSlug(s.name) === slug,
  );
  if (!student) return null;
  const klass = classOf(student.name);
  if (!klass) return null;

  if (studentSlug(student.name) === AMARA.id) {
    return { ...AMARA, classId: klass.id, className: klass.name };
  }

  // Everyone else renders the designed early / low-confidence state.
  return {
    id: studentSlug(student.name),
    name: student.name,
    initials: initialsOf(student.name),
    classId: klass.id,
    className: klass.name,
    meta: `${klass.name} · joined 6 days ago`,
    pronoun: { subject: "They", possessive: "their" },
    earlyNote: `Still learning how ${student.name.split(" ")[0]} learns best. A few more sessions and this will fill in - for now, here's the early picture.`,
    dimensions: EARLY_DIMENSIONS,
    concepts: [],
    evidence: [],
    sessions: [],
  };
}

export function getSession(
  slug: string,
  sessionId: string,
): { student: StudentProfileData; session: SessionRow } | null {
  const student = getStudentProfile(slug);
  const session = student?.sessions.find((s) => s.id === sessionId);
  if (!student || !session) return null;
  return { student, session };
}
