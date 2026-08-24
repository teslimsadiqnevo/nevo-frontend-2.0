import { getStudentProfile } from "./teacherStudents";

/**
 * Ask Nevo, teacher side (C15 / `Nevo Teacher Ask Nevo`). The drawer is
 * context-aware: what it greets with, suggests and answers follows the
 * surface it was opened from. Five contexts, frame-verbatim.
 *
 * TODO(api): the live assistant answers first; these canned turns are the
 * demo fallback so the drawer never goes silent.
 */

export type AskNevoContext =
  | "home"
  | "student"
  | "insights"
  | "connect"
  | "library";

export interface AskNevoContextData {
  contextLine: string;
  lead: string;
  sub: string;
  chips: string[];
  /** The canned turn this context demos. */
  question: string;
  answer: string;
  /** Navy action pills under the answer, with honest destinations. */
  actions: { label: string; href: string }[];
}

export const ASK_NEVO_CONTEXTS: Record<AskNevoContext, AskNevoContextData> = {
  home: {
    contextLine: "Corona Secondary School",
    lead: "What can I help you see today?",
    sub: "Ask about your morning, a flagged student, or where to start.",
    chips: [
      "What needs my attention today?",
      "Why is this student flagged?",
      "What should I prioritise first?",
    ],
    question: "Why is Amara flagged this week?",
    answer:
      "Amara has been spending significantly longer on written segments over the last three sessions, though she's still understanding the material just as well. It's worth checking in - she may be working harder than usual to keep up, which isn't always visible from her answers alone.",
    actions: [
      { label: "Open Amara's profile", href: "/teacher/students/amara-okafor" },
    ],
  },
  student: {
    contextLine: "Amara Okafor · JSS 2A",
    lead: "Ask me about Amara.",
    sub: "Her recent sessions, what suits her now, how her confidence is tracking.",
    chips: [
      "What's going on with Amara this week?",
      "What kind of lesson suits her now?",
      "How is her confidence building?",
    ],
    question: "What's going on with Amara this week?",
    answer:
      "Amara's audio engagement has been strong - she replays segments less often than before, which usually means the content is landing. Her written segment pace is still slower than her class average but her comprehension scores after those segments are solid. She's working through it, not struggling.",
    actions: [
      {
        label: "Recommend a lesson",
        href: "/teacher/students/amara-okafor/recommend",
      },
      { label: "Message her parent", href: "/teacher/connect" },
    ],
  },
  insights: {
    contextLine: "JSS 2A · Mathematics",
    lead: "Ask me about this class.",
    sub: "Where to focus, what a pattern means, and what I'd suggest doing.",
    chips: [
      "What should I prioritise for JSS 2A?",
      "What does this pattern mean?",
      "What would you recommend I do?",
    ],
    question: "What should I prioritise for JSS 2A?",
    answer:
      "Three students in JSS 2A slowed significantly on the algebraic fractions segment - Tunde, Chisom, and Bello. It's worth revisiting that concept before moving forward. A hands-on lesson tends to work better than text for this topic with this class.",
    actions: [{ label: "Find a hands-on lesson", href: "/teacher/lessons" }],
  },
  connect: {
    contextLine: "Draft to Amara's parent",
    lead: "Let's shape this message.",
    sub: "I can help you frame progress, tone, and where to start.",
    chips: [
      "How should I frame this message?",
      "What should I tell the parent about progress?",
      "What's the best way to approach this conversation?",
    ],
    question: "How should I message Amara's parent?",
    answer:
      "Keep it progress-focused rather than concern-focused. Something like: “Amara has been putting in real effort this week and her comprehension is holding strong. She takes her time with written work, which is actually a sign she's being careful, not that she's struggling.”",
    actions: [{ label: "Use this as a draft", href: "/teacher/connect" }],
  },
  library: {
    contextLine: "Fractions in Everyday Life · JSS 2",
    lead: "Ask me about this lesson.",
    sub: "Whether it fits your class, how I'll adapt it, and who might need support.",
    chips: [
      "Is this lesson right for my class?",
      "How will Nevo adapt this lesson?",
      "Which students might struggle with this?",
    ],
    question: "Is this lesson right for JSS 2A?",
    answer:
      "It's a good fit. The concept lines up with where JSS 2A is now, and the lesson leads with a real-world framing that tends to land well with this group. I'll offer Chisom the listen-first version, since audio has been working for her.",
    actions: [
      { label: "Preview lesson", href: "/teacher/lessons" },
      { label: "Assign to JSS 2A", href: "/teacher/lessons/assign" },
    ],
  },
};

/** The surface the teacher opened the drawer from, read off the route. */
export function contextForPath(pathname: string): AskNevoContext {
  if (/^\/teacher\/students\/[^/]+/.test(pathname)) return "student";
  if (pathname.startsWith("/teacher/insights")) return "insights";
  if (pathname.startsWith("/teacher/connect")) return "connect";
  if (pathname.startsWith("/teacher/lessons")) return "library";
  return "home";
}

/** Student pages carry the real student in the context line. */
export function contextLineForPath(
  context: AskNevoContext,
  pathname: string,
): string {
  if (context === "student") {
    const slug = pathname.split("/")[3] ?? "";
    const student = getStudentProfile(slug);
    if (student) return `${student.name} · ${student.className}`;
  }
  return ASK_NEVO_CONTEXTS[context].contextLine;
}

/** Requests outside the assistant's remit get the gentle recovery. */
export const OUT_OF_SCOPE = /approve|allowance|billing|payment|invoice|salary|password reset|admin access/i;

export const CANNOT_HELP_LINE =
  "That's outside what I can help with right now.";
