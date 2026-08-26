import type { LessonContentType, ParsedLessonSegment } from "@/lib/api/content";

/**
 * Maps a live parse response onto the shapes the review step renders.
 *
 * Two rules hold throughout: never invent structure the parser did not return,
 * and never invent prose. Module boundaries come from real `contentType`
 * transitions and titles from the real content type; the recap and preview
 * lines are left empty for the teacher, which is the same state a manual split
 * produces, rather than filled with plausible-sounding copy.
 */

export interface ReviewSegment {
  id: number;
  title: string;
  mins: string;
  needsReview: boolean;
}

export interface ReviewModule {
  title: string;
  recap: string;
  preview: string;
  segIds: number[];
}

/** Silent reading at roughly 180 wpm - an estimate, and the only figure here
 * that is derived rather than returned by the parser. */
export function estimateMinutes(body: string): number {
  const words = body.trim().split(/\s+/).filter(Boolean).length;
  return Math.max(1, Math.round(words / 180));
}

const TYPE_TITLES: Record<LessonContentType, string> = {
  explanatory_text: "Explanation",
  visual_diagram: "Diagram",
  worked_example: "Worked example",
  practice_question: "Practice",
  definition: "Definition",
  summary: "Recap",
  calculation: "Calculation",
};

/** Which of the three phases a content type belongs to. */
function phaseOf(type: LessonContentType): "intro" | "practice" | "wrap" {
  if (type === "summary") return "wrap";
  if (
    type === "worked_example" ||
    type === "practice_question" ||
    type === "calculation"
  ) {
    return "practice";
  }
  return "intro";
}

const PHASE_TITLES = {
  intro: "Introduction",
  practice: "Practice",
  wrap: "Wrap-up",
} as const;

export function toReviewSegments(
  segments: ParsedLessonSegment[],
): ReviewSegment[] {
  return [...segments]
    .sort((a, b) => a.sequenceOrder - b.sequenceOrder)
    .map((s, i) => ({
      id: i + 1,
      title: s.title?.trim() || TYPE_TITLES[s.contentType],
      mins: `${estimateMinutes(s.body)} min`,
      needsReview: s.needsReview,
    }));
}

/**
 * Group consecutive segments by phase. Returns [] when the parse gives no
 * usable boundary - one phase throughout, or too few segments to be worth
 * splitting - which is the review step's existing no-suggestion state.
 */
export function suggestModules(
  segments: ParsedLessonSegment[],
): ReviewModule[] {
  const ordered = [...segments].sort(
    (a, b) => a.sequenceOrder - b.sequenceOrder,
  );
  if (ordered.length <= 5) return [];

  const groups: { phase: keyof typeof PHASE_TITLES; segIds: number[] }[] = [];
  ordered.forEach((s, i) => {
    const phase = phaseOf(s.contentType);
    const last = groups[groups.length - 1];
    if (last && last.phase === phase) last.segIds.push(i + 1);
    else groups.push({ phase, segIds: [i + 1] });
  });

  if (groups.length < 2) return [];
  return groups.map((g) => ({
    title: PHASE_TITLES[g.phase],
    recap: "",
    preview: "",
    segIds: g.segIds,
  }));
}
