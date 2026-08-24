import type { SectionType } from "./teacherLibrary";

/**
 * Intelligence layer, teacher side (C16 / C16a-C16d). Four additive surfaces:
 * the Class Learning Pulse on Home, per-student Observations on the class
 * detail, Adaptation Insights on the student profile, and the Variant Review
 * orientation. Copy is frame-verbatim where our fixtures match the drawing;
 * numbers are adapted to the real JSS 2A roster (28, not the frame's 27).
 *
 * TODO(api): all of this comes from the intelligence endpoints once they
 * exist; the shapes below are the seam.
 */

/* ---- C16a Class Learning Pulse (Home, above the lesson list) ---- */

export interface PulseMetric {
  head: string;
  value: string;
  desc: string;
}

export const PULSE_LABEL = "Class learning pulse";
export const PULSE_SUBTITLE =
  "How your class is engaging with lessons this week.";

export const HOME_PULSE: PulseMetric[] = [
  {
    head: "Engagement",
    value: "Strong",
    desc: "25 of 28 students engaged consistently across sessions this week.",
  },
  {
    head: "Comprehension",
    value: "Building",
    desc: "Most students are moving through the current sequence at their own pace. 4 may benefit from a review session.",
  },
  {
    head: "Focus",
    value: "Steady",
    desc: "Attention patterns are stable across the class. No signs of widespread fatigue or disengagement.",
  },
];

/* ---- C16b Student Observations (replaces the plain class-detail roster) ---- */

export interface StudentObservation {
  seat: number;
  chips: string[];
}

export const OBSERVATIONS_LABEL = "Student observations";
export const OBSERVATIONS_SUBTITLE =
  "What Nevo has noticed about each student this week.";

/** Keyed by class id, then student name (the roster stays the flag source). */
export const CLASS_OBSERVATIONS: Record<
  string,
  Record<string, StudentObservation>
> = {
  "jss-2a": {
    "Adaeze Ifeanyi": { seat: 3, chips: ["Consistent engagement across all subjects"] },
    "Aisha Abdullahi": { seat: 21, chips: ["Steady pace through this week's lessons"] },
    "Amara Okafor": { seat: 12, chips: ["Taking longer on written segments this week", "Settles faster when she can hear it first"] },
    "Bello Ibrahim": { seat: 7, chips: ["Prefers to work through problems step by step"] },
    "Chisom Eze": { seat: 16, chips: ["Doing better when lessons lead with audio", "Finished the last four listen-first"] },
    "Chukwuemeka Nwosu": { seat: 4, chips: ["Asks for the worked example first, then moves quickly"] },
    "Damilola Akinwande": { seat: 25, chips: ["Engaging strongly with visual content this week"] },
    "Emeka Nwachukwu": { seat: 9, chips: ["Back to full pace after a slow start to the term"] },
    "Fatima Musa": { seat: 14, chips: ["Ready for a challenge in fractions"] },
    "Kolade Fashola": { seat: 22, chips: ["Moving evenly through the current sequence"] },
    "Ngozi Obi": { seat: 6, chips: ["Strong week in comprehension work"] },
    "Sade Olawale": { seat: 18, chips: ["Keeps a steady rhythm across longer sessions"] },
    "Taiwo Ogundimu": { seat: 11, chips: ["Settled quickly into the new equations work"] },
    "Tobi Adeleke": { seat: 27, chips: ["Picks up new concepts fastest with a worked example"] },
    "Tunde Adeyemi": { seat: 8, chips: ["Stalled partway through Tuesday's lesson - three times this week", "His week before was completely steady"] },
    "Zainab Yusuf": { seat: 15, chips: ["Finishing with time to spare this week"] },
  },
  "jss-2b": {
    "Adanna Okoye": { seat: 2, chips: ["Steady pace across both lessons this week"] },
    "Bashir Lawal": { seat: 17, chips: ["Comprehension answers are getting sharper"] },
    "Chiamaka Udo": { seat: 9, chips: ["Engaged well with the reading this week"] },
    "Efe Oghenekaro": { seat: 24, chips: ["Working through practice sets without prompts"] },
    "Halima Sani": { seat: 5, chips: ["Strong finish on the Things Fall Apart chapters"] },
    "Ikenna Eze": { seat: 13, chips: ["Keeps an even pace through longer lessons"] },
    "Lola Adebayo": { seat: 28, chips: ["Settled quickly into this term's fractions work"] },
    "Nnamdi Okafor": { seat: 11, chips: ["Prefers reading first, then the practice set"] },
    "Rukayat Balogun": { seat: 19, chips: ["Answering stretch questions unprompted"] },
    "Segun Adewale": { seat: 7, chips: ["Steady all week - nothing worth flagging"] },
    "Uche Nnaji": { seat: 22, chips: ["Moving comfortably through the current sequence"] },
    "Yemi Oladipo": { seat: 15, chips: ["Finished both lessons ahead of most of the class"] },
  },
  "sss-1-sciences": {
    "Abiola Ogunleye": { seat: 4, chips: ["Working carefully through the labelled diagram"] },
    "Chidera Anyanwu": { seat: 12, chips: ["Strong recall on organelles and their jobs"] },
    "Dabira Oyelaran": { seat: 20, chips: ["Steady pace through the cell structure lesson"] },
    "Emmanuella Bassey": { seat: 8, chips: ["Revisits diagrams before practice - the intended path"] },
    "Femi Alade": { seat: 26, chips: ["Moving evenly, no sections standing out"] },
    "Ifeoma Chukwu": { seat: 15, chips: ["Engaging closely with the compare-two-cells task"] },
    "Kamsi Obiora": { seat: 3, chips: ["Finished the practice set in one sitting"] },
    "Micheal Etim": { seat: 18, chips: ["Takes the diagram section slowly, as designed"] },
    "Nafisa Garba": { seat: 10, chips: ["Consistent engagement across the sciences"] },
    "Olamide Shittu": { seat: 23, chips: ["Confident with match-and-label work"] },
    "Tari Briggs": { seat: 6, chips: ["Steady this week - within usual pace"] },
    "Zara Mohammed": { seat: 14, chips: ["Still to finish - within her usual rhythm"] },
  },
};

/* ---- C16c Adaptation Insights (student profile, below lesson history) ---- */

export interface AdaptationEntry {
  date: string;
  lesson: string;
  desc: string;
}

export const ADAPTATIONS_LABEL = "How Nevo has adapted for this student";

/** Only students with a full profile carry history; early profiles render
 *  no section at all (the C08 no-empty-cards rule). */
export const STUDENT_ADAPTATIONS: Record<string, AdaptationEntry[]> = {
  "amara-okafor": [
    {
      date: "15 Jul",
      lesson: "Fractions Lesson 3",
      desc: "Nevo delivered the second half of this lesson with additional visual examples after noticing Amara took longer with the text-based explanation.",
    },
    {
      date: "12 Jul",
      lesson: "Reading: The Coastline",
      desc: "Nevo offered a listen-first version when Amara paused often on the longer passages.",
    },
    {
      date: "9 Jul",
      lesson: "Algebra Basics",
      desc: "Nevo broke the worked example into smaller steps and checked in a little more often.",
    },
  ],
};

export const ADAPTATIONS_FOOTNOTE_MAIN =
  "You do not need to act on any of these. Nevo handles the adaptations for you.";
export const ADAPTATIONS_FOOTNOTE_DESKTOP_TAIL =
  "They are shown here so you can see how the platform is supporting each student.";

/* ---- C16d Variant Review (SCRUM-37) ---- */

export const VARIANT_TABS = ["Text", "Visual", "Audio", "Interactive"] as const;
export type VariantTab = (typeof VARIANT_TABS)[number];

export const VARIANT_ORIENTATION =
  "Nevo generates these four variants for every segment. During the lesson, the system decides which variant each student sees based on how they are engaging. You do not need to assign specific variants to specific students.";

/** Preview paragraphs per variant. Hand-written for the slowed JSS 2A
 *  section; every other section gets an honest derived preview. */
const LINEAR_EQUATIONS_S4: Record<VariantTab, string[]> = {
  Text: [
    "When x appears on both sides, the first move is to collect the x terms together. Subtract the smaller x term from both sides, then solve as before.",
    "Example: 5x + 2 = 3x + 10. Subtracting 3x from both sides leaves 2x + 2 = 10, and from there it solves the usual way.",
  ],
  Visual: [
    "A balance scale shows 5x + 2 on the left pan and 3x + 10 on the right. Removing 3x from each pan keeps the scale level - the remaining weights read 2x + 2 = 10.",
    "Each step redraws the scale, so students watch the equation stay balanced as terms move across.",
  ],
  Audio: [
    "A narrated walk-through of the same worked example, paced with short pauses. Students hear each move stated before they see it - “take three x from both sides” - then confirm it on screen.",
  ],
  Interactive: [
    "Students drag x-blocks off both sides of an on-screen balance until x remains on one side only. The equation updates live with every move, and a gentle check-in appears if the scale tips.",
  ],
};

function derivedVariants(
  title: string,
  type: SectionType,
): Record<VariantTab, string[]> {
  const subject = `“${title}”`;
  const practice = type === "Practice" || type === "Extension";
  return {
    Text: [
      practice
        ? `The written form of ${subject} - each question stated plainly, with one worked line available if a student stalls.`
        : `A plain-written explanation of ${subject}, broken into short steps with one worked line per idea.`,
    ],
    Visual: [
      practice
        ? `The same questions with a diagram alongside each one, so students can see the step before they write it.`
        : `The same idea drawn out - each step of ${subject} appears as a diagram before any text does.`,
    ],
    Audio: [
      `A narrated version of ${subject}, paced with short pauses so students can follow along without reading.`,
    ],
    Interactive: [
      `A hands-on version of ${subject} - students work each step themselves and Nevo checks in as they go.`,
    ],
  };
}

export function getSectionVariants(
  lessonId: string,
  sectionIndex: number,
  title: string,
  type: SectionType,
): Record<VariantTab, string[]> {
  if (lessonId === "solving-linear-equations" && sectionIndex === 4) {
    return LINEAR_EQUATIONS_S4;
  }
  return derivedVariants(title, type);
}
