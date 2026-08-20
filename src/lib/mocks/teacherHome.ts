/**
 * Teacher Home mock data (C03 Home Dashboard / `Nevo Teacher Home` frame) -
 * the morning's picture, verbatim from the frame's storyboard content.
 * TODO(api): the intelligence layer serves flags/classes/activity per teacher.
 */

/** One evidence mini-bar: height % + emphasis. */
export type EvidenceBar = readonly [number, "" | "accent" | "soft"];

export interface HomeFlag {
  id: string;
  name: string;
  context: string;
  /** A sudden change carries the navy drop glyph + navy accent. */
  isSudden: boolean;
  note: string;
  evidence: readonly EvidenceBar[];
  evidenceLabel: string;
  actionLabel: string;
  actionHref: string;
  secondaryLabel: string;
  secondaryHref: string;
}

export const HOME_FLAGS: HomeFlag[] = [
  {
    id: "tunde-sudden-stall",
    name: "Tunde Adeyemi",
    context: "JSS 2A · Mathematics",
    isSudden: true,
    note: "Tunde stalled halfway through Tuesday's lesson and didn't come back to it - that's really not like him. His week before was completely steady, so it's likely something outside the work.",
    evidence: [[60, ""], [68, ""], [64, ""], [70, ""], [22, "accent"]],
    evidenceLabel: "Completion · last 5 sessions · Tuesday marked",
    actionLabel: "Have a quiet word before class",
    actionHref: "/teacher/connect",
    secondaryLabel: "See his week",
    secondaryHref: "/teacher/students/tunde-adeyemi",
  },
  {
    id: "amara-written-pace",
    name: "Amara Okafor",
    context: "JSS 2A · Mathematics",
    isSudden: false,
    note: "Amara's been taking noticeably longer on the written segments - three sessions running now. She's getting there, just slower, and she tends to settle faster when she can hear it first.",
    evidence: [[38, ""], [42, ""], [68, "soft"], [74, "soft"], [80, "soft"]],
    evidenceLabel: "Time on written parts · last 5 sessions",
    actionLabel: "Recommend the listen-first version",
    actionHref: "/teacher/students/amara-okafor",
    secondaryLabel: "Open her profile",
    secondaryHref: "/teacher/students/amara-okafor",
  },
  {
    id: "jss2a-fractions-step",
    name: "A few in JSS 2A",
    context: "8 students · Mathematics",
    isSudden: false,
    note: "Eight students slowed right down on the same step - turning algebraic fractions into a common denominator. The rest of the algebra was fine, so it's just that one move that isn't landing yet.",
    evidence: [[70, ""], [66, ""], [72, ""], [30, "soft"], [68, ""]],
    evidenceLabel: "Class pace across the lesson · dip = that step",
    actionLabel: "Plan a few minutes on it together",
    actionHref: "/teacher/insights",
    secondaryLabel: "See who slowed",
    secondaryHref: "/teacher/insights",
  },
];

export const GOOD_TO_KNOW =
  "Chisom Eze keeps doing better when a lesson leads with audio - she's finished the last four that way. Nevo will keep offering her the listen-first version.";

export interface HomeClass {
  name: string;
  subjects: string;
  status: string;
  /** Tablet cards shorten the status line. */
  statusShort: string;
  /** Violet dot = worth a glance; muted = on track. */
  glance: boolean;
  href: string;
}

export const HOME_CLASSES: HomeClass[] = [
  { name: "JSS 2A", subjects: "Mathematics · English", status: "3 worth a glance", statusShort: "3 to glance", glance: true, href: "/teacher/classes/jss-2a" },
  { name: "JSS 2B", subjects: "Mathematics · English", status: "All on track", statusShort: "On track", glance: false, href: "/teacher/classes/jss-2b" },
  { name: "SSS 1 Sciences", subjects: "Biology · Chemistry · Physics", status: "All on track", statusShort: "On track", glance: false, href: "/teacher/classes/sss-1-sciences" },
];

export interface HomeActivity {
  lesson: string;
  klass: string;
  when: string;
  done: number;
  total: number;
  href: string;
}

export const HOME_ACTIVITY: HomeActivity[] = [
  { lesson: "Solving Linear Equations", klass: "JSS 2A", when: "yesterday", done: 18, total: 28, href: "/teacher/lessons/solving-linear-equations" },
  { lesson: "Reading Comprehension: Things Fall Apart", klass: "JSS 2B", when: "yesterday", done: 25, total: 30, href: "/teacher/lessons/things-fall-apart" },
  { lesson: "Cell Structure & Function", klass: "SSS 1 Sciences", when: "2 days ago", done: 22, total: 31, href: "/teacher/lessons/cell-structure" },
];

/** The frame's canned Ask Nevo replies - the fallback when the live assistant
 *  can't answer (no session yet, offline). */
export function teacherAnswerFor(question: string): string {
  const k = question.toLowerCase();
  if (k.includes("attention") || k.includes("today"))
    return "Three things, all on your Home now: Tunde stalled on Tuesday and it's worth a quiet word, Amara's taking longer on written parts so listen-first may help, and eight in JSS 2A slowed on the same fractions step. Everything else is steady.";
  if (k.includes("why") || k.includes("flag"))
    return "Tunde's is a sudden change: four steady sessions, then he stopped halfway on Tuesday and didn't come back to it. His pattern before was fine, so it's likely something outside the work.";
  if (
    k.includes("prioritise") ||
    k.includes("prioritize") ||
    k.includes("first") ||
    k.includes("start")
  )
    return "I'd start with Tunde - a sudden change is worth catching early. The other two can wait for the lesson itself.";
  return "Good question. I'd start with what's on your Home: Tunde's sudden change first, then Amara and the JSS 2A fractions step.";
}
