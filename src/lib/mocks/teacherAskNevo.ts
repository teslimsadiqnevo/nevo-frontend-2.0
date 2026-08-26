import { getLibraryLesson } from "./teacherLibrary";
import { getStudentProfile } from "./teacherStudents";

/**
 * Ask Nevo, teacher side - rebuilt against the rewritten `Nevo Teacher Ask`
 * component (the previous `Nevo Teacher Ask Nevo` frame was deleted; git
 * scores the replacement 19% similar, so this is a new contract, not an
 * edit). Seven contexts now, keyed off the route, each with its own context
 * strip line, lead, chips and canned turn.
 *
 * Copy is frame-verbatim, apostrophes included: the frame is pure ASCII
 * apart from the curly quotes inside the connect answer, so these straight
 * quotes are deliberate - do not "upgrade" them.
 *
 * TODO(api): the live assistant answers first; these canned turns are the
 * fallback so the drawer never goes silent.
 */

export type AskNevoContext =
  | "home"
  | "classes"
  | "student"
  | "library"
  | "lesson"
  | "insights"
  | "connect";

export interface AskNevoContextData {
  /** Context-strip copy. "on" = a screen you stand in, "viewing" = a record you have open. */
  strip: string;
  lead: string;
  sub: string;
  chips: [string, string, string];
  /** The canned turn this context demos. */
  question: string;
  answer: string;
  /** Exactly one action pill per context, per the frame. */
  action: { label: string; href: string };
}

export const ASK_NEVO_CONTEXTS: Record<AskNevoContext, AskNevoContextData> = {
  home: {
    strip: "You're on: Home",
    lead: "What can I help you see today?",
    sub: "Ask about your morning, a flagged student, or where to start.",
    chips: [
      "What needs my attention today?",
      "Why is this student flagged?",
      "What should I prioritise first?",
    ],
    question: "What needs my attention today?",
    answer:
      "Three things are worth your eye: Tunde stalled on Tuesday and it's worth a quiet word, Amara's taking longer on written parts so listen-first may help, and eight in JSS 2A slowed on the same fractions step. Everything else is steady.",
    action: {
      label: "Open Tunde's profile",
      href: "/teacher/students/tunde-adeyemi",
    },
  },
  classes: {
    strip: "You're on: My Classes",
    lead: "Ask me about your classes.",
    sub: "How a class is doing, who needs a look, and the pattern underneath.",
    chips: [
      "How is this class doing overall?",
      "Which students need attention?",
      "What's the engagement pattern for this class?",
    ],
    question: "How is this class doing overall?",
    answer:
      "JSS 2A is mostly settled, with three students worth a glance - Amara, Tunde, and Chisom. The pattern is a slow-down on written segments rather than understanding; the class handles audio-led material comfortably.",
    action: { label: "See the roster", href: "/teacher/classes" },
  },
  student: {
    strip: "You're viewing: Amara Okafor",
    lead: "Ask me about Amara.",
    sub: "Her recent sessions, what suits her now, how her confidence is tracking.",
    chips: [
      "What's going on with Amara?",
      "What kind of lesson suits her now?",
      "How is her confidence building?",
    ],
    question: "What's going on with Amara?",
    answer:
      "Amara's audio engagement has been strong - she replays segments less than before, which usually means the content is landing. Her written pace is still slower than the class average, but her comprehension after those segments is solid. She's working through it, not struggling.",
    action: {
      label: "Recommend a lesson",
      href: "/teacher/students/amara-okafor/recommend",
    },
  },
  library: {
    strip: "You're on: Lesson Library",
    lead: "Ask me about a lesson.",
    sub: "Whether it fits your class, how I'll adapt it, and who might need support.",
    chips: [
      "Is this lesson right for my class?",
      "How will Nevo adapt this lesson?",
      "Which students might struggle with this?",
    ],
    question: "Is this lesson right for my class?",
    answer:
      "It's a good fit. The concept lines up with where JSS 2A is now, and the lesson leads with a real-world framing that tends to land with this group. I'll offer Chisom the listen-first version, since audio has been working for her.",
    action: { label: "Preview lesson", href: "/teacher/lessons" },
  },
  lesson: {
    strip: "You're viewing: Fractions in Everyday Life",
    lead: "Ask me about this lesson.",
    sub: "Whether it fits your class, how I'll adapt it, and who might need support.",
    chips: [
      "Is this lesson right for my class?",
      "How will Nevo adapt this lesson?",
      "Which students might struggle with this?",
    ],
    question: "Is this lesson right for my class?",
    answer:
      "It's a good fit for JSS 2A. The concept matches where they are, and it opens with a real-world framing they respond to. I'll adapt the written-heavy middle section into an audio-led path for the students who've been slowing there.",
    action: { label: "Assign to JSS 2A", href: "/teacher/lessons/assign" },
  },
  insights: {
    strip: "You're on: Insights, JSS 2A",
    lead: "Ask me about this class.",
    sub: "Where to focus, what a pattern means, and what I'd suggest doing.",
    chips: [
      "What should I prioritise for this class?",
      "What does this pattern mean?",
      "What would you recommend I do?",
    ],
    question: "What should I prioritise for this class?",
    answer:
      "Three students slowed significantly on the algebraic fractions segment - Tunde, Chisom, and Bello. It's worth revisiting that concept before moving on. A hands-on lesson tends to work better than text for this topic with this class.",
    action: { label: "Find a hands-on lesson", href: "/teacher/lessons" },
  },
  connect: {
    // The 25 Aug drop moved parents to their own portal and rewrote the Connect
    // frames without them, but this overlay - added in the same commit - still
    // named a parent thread. Reworded rather than built verbatim, and sent back
    // to design. The strip stays thread-agnostic on purpose: Connect
    // threads are local state with no route segment, so naming a student here
    // would read "Amara" while the teacher is looking at Tunde's thread.
    strip: "You're on: Connect",
    lead: "Let's shape this message.",
    sub: "I can help you frame progress, tone, and where to start.",
    chips: [
      "How should I frame this message?",
      "How should I talk about her progress?",
      "What's the best way to approach this conversation?",
    ],
    question: "How should I frame this message?",
    // The draft is addressed to the student now, so the register moves with it -
    // "her comprehension is holding strong" is adult-to-adult language.
    answer:
      "Keep it progress-focused rather than concern-focused. Something like: “You've put in real effort this week, Amara, and it's showing in how well you're following things. You take your time with written work - that's care, not struggle.”",
    action: { label: "Use this as a draft", href: "/teacher/connect" },
  },
};

/** The surface the teacher opened the drawer from, read off the route. */
export function contextForPath(pathname: string): AskNevoContext {
  if (/^\/teacher\/students\/[^/]+/.test(pathname)) return "student";
  if (pathname.startsWith("/teacher/classes")) return "classes";
  if (/^\/teacher\/lessons\/[^/]+/.test(pathname)) return "lesson";
  if (pathname.startsWith("/teacher/lessons")) return "library";
  if (pathname.startsWith("/teacher/insights")) return "insights";
  if (pathname.startsWith("/teacher/connect")) return "connect";
  return "home";
}

/** Record contexts name the real thing on screen, not the frame's fixture. */
export function stripForPath(
  context: AskNevoContext,
  pathname: string,
): string {
  const slug = pathname.split("/")[3] ?? "";
  if (context === "student") {
    const student = getStudentProfile(slug);
    if (student) return `You're viewing: ${student.name}`;
  }
  if (context === "lesson") {
    const lesson = getLibraryLesson(slug);
    if (lesson) return `You're viewing: ${lesson.title}`;
  }
  return ASK_NEVO_CONTEXTS[context].strip;
}

/** Requests outside the assistant's remit get the admin hand-off, verbatim. */
export const OUT_OF_SCOPE =
  /\b(allowance|approve|billing|invoice|pay|password|reset|account|admin|seat|permission|refund|sso|delete)\b/i;

export const CANNOT_HELP_LINE =
  "That's outside what I can help with here. Your school admin looks after that side of things.";
