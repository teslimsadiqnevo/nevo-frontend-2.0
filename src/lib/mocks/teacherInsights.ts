import { TEACHER_CLASSES } from "./teacherClasses";
import { studentSlug } from "./teacherStudents";

/**
 * Insights mock data (C09 + C14 A2/A3). Intelligence turned into decisions:
 * recommendations read as things you can act on, class patterns are plain
 * prose rather than dense charts, and the class selector governs everything
 * below it.
 *
 * Three shapes, all designed:
 *  - populated  (C09 "data available")   - JSS 2A
 *  - quiet week (C14 A2, nothing flagged) - JSS 2B
 *  - sparse     (C09 "new class")        - SSS 1 Sciences
 *
 * TODO(api): replaced by the class-insights endpoint when it exists.
 */

/** A run of narrative; `strong` marks the frame's inline emphasis. */
export interface Segment {
  t: string;
  strong?: boolean;
}

export interface InsightFlag {
  name: string;
  href: string;
  note: string;
  /** Sudden change - navy accent and the navy down-arrow badge. */
  isSudden: boolean;
}

export interface ClassConcept {
  name: string;
  u: number;
  r: number;
}

export interface Recommendation {
  name: string;
  text: string;
  action: string;
  href: string;
}

export interface ClassInsights {
  classId: string;
  className: string;
  /** No sessions behind the class yet - the whole page is one calm card. */
  sparse?: boolean;
  summaryDesktop?: Segment[];
  summaryTablet?: string;
  misconception?: { title: string; desktop: string; tablet: string; href: string };
  flags?: InsightFlag[];
  concepts?: ClassConcept[];
  recommendations?: Recommendation[];
  /** C14 A2 - the forward look that appears on a quiet week. */
  lookingAhead?: { desktop: string; tablet: string };
}

/** Reading is dragging on the result when the tracks pull this far apart. */
export const GAP_THRESHOLD = 20;
export const hasGap = (c: ClassConcept) => c.u - c.r > GAP_THRESHOLD;

const INSIGHTS: ClassInsights[] = [
  {
    classId: "jss-2a",
    className: "JSS 2A",
    summaryDesktop: [
      { t: "The class is moving well through the algebra unit - most students are keeping a steady pace. The one place worth your time is " },
      { t: "turning algebraic fractions into a common denominator", strong: true },
      { t: ": eight students slowed right down on that single step, though the surrounding work was fine. A few minutes on just that move before Thursday would likely clear it. Separately, " },
      { t: "Tunde", strong: true },
      { t: " had one uncharacteristic session on Tuesday - probably worth a quiet check-in rather than anything to do with the maths." },
    ],
    summaryTablet:
      "Eight students slowed on one step - common denominators in algebraic fractions. A few minutes on just that before Thursday would clear it. Tunde had one off session Tuesday; worth a quiet check-in.",
    misconception: {
      title: "Common misconception in algebraic fractions",
      desktop:
        "Five students this week worked through it the same way: adding the numerators and denominators straight across, rather than finding a common denominator first. A shared misunderstanding, not five separate slips.",
      tablet:
        "Five students added the numerators and denominators straight across, rather than finding a common denominator first. A shared misunderstanding, not five separate slips.",
      href: "/teacher/classes/jss-2a",
    },
    flags: [
      {
        name: "Tunde Adeyemi",
        href: `/teacher/students/${studentSlug("Tunde Adeyemi")}`,
        isSudden: true,
        note: "One uncharacteristic session on Tuesday - stalled and didn't return to it. The week around it was steady, so likely nothing to do with the work itself.",
      },
      {
        name: "Amara Okafor",
        href: `/teacher/students/${studentSlug("Amara Okafor")}`,
        isSudden: false,
        note: "Taking longer on written segments for three sessions now. She's getting there, just slower - she settles faster when she can hear it first.",
      },
    ],
    concepts: [
      { name: "Solving linear equations", u: 81, r: 76 },
      { name: "Word problems: rates & ratio", u: 74, r: 49 },
      { name: "Algebraic fractions", u: 62, r: 58 },
      { name: "Simplifying expressions", u: 84, r: 80 },
    ],
    recommendations: [
      {
        name: "Amara Okafor",
        text: "Consider pointing her to the listen-first version of the next lesson - the last few went more smoothly that way.",
        action: "Recommend a lesson",
        href: `/teacher/students/${studentSlug("Amara Okafor")}/recommend`,
      },
      {
        name: "A few in JSS 2A",
        text: "A short walk-through of common denominators before Thursday would help the eight who slowed on that step.",
        action: "See who slowed",
        href: "/teacher/classes/jss-2a",
      },
      {
        name: "Chisom Eze",
        text: "She's ready for slightly longer segments - she's been finishing the audio-led lessons early.",
        action: "Open her profile",
        href: `/teacher/students/${studentSlug("Chisom Eze")}`,
      },
      {
        name: "Tunde Adeyemi",
        text: "A quiet check-in would tell you more than the data can here - his one off session doesn't fit his pattern.",
        action: "See his week",
        href: `/teacher/students/${studentSlug("Tunde Adeyemi")}`,
      },
    ],
  },
  {
    // C14 A2: a mature class with an uneventful week. The absence of flags is
    // a positive state, so those sections are removed rather than emptied.
    classId: "jss-2b",
    className: "JSS 2B",
    summaryDesktop: [
      { t: "A calm, steady week in JSS 2B - everyone is moving through the material at their own pace and nothing stands out as needing your attention. Reading comprehension in particular is going well; several students finished ahead of the group." },
    ],
    summaryTablet:
      "A settled week - everyone's moving steadily through the material. Nothing needs your attention this week.",
    lookingAhead: {
      desktop:
        "Keep an eye on JSS 2B next week - algebraic fractions are coming up, and that step tends to be where this group slows. Worth a few minutes on common denominators before you start.",
      tablet:
        "Keep an eye on JSS 2B next week - algebraic fractions are coming up, and that's where this group tends to slow.",
    },
  },
  {
    classId: "sss-1-sciences",
    className: "SSS 1 Sciences",
    sparse: true,
  },
];

export const INSIGHT_CLASSES = TEACHER_CLASSES.map((c) => ({
  id: c.id,
  name: c.name,
}));

export function getClassInsights(classId: string): ClassInsights | null {
  return INSIGHTS.find((i) => i.classId === classId) ?? null;
}
