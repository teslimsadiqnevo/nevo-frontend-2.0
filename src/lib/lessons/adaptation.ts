import type {
  AdaptResponse,
  AdaptSegment,
  AdaptSegmentType,
} from "@/lib/api/intelligence";
import type { LessonSegment as ContentSegment } from "@/lib/api/lessons";
import { MODALITY, type Modality } from "@/lib/constants";
import { SCAFFOLD_LEVELS, type ScaffoldLevel } from "@/lib/constants/scaffold";
import type { AdaptationPlan, Lesson, SegmentAdaptation } from "@/lib/types";

/**
 * Between the adaptation engine and the player.
 *
 * These are two different vocabularies that happen to describe the same
 * lesson, and the previous code cast one to the other
 * (`setPlan(res as AdaptationPlan)`). That could never have worked: the wire
 * is snake_case with `segment_id`, the player is camelCase with `segmentId`,
 * so every per-segment lookup would have missed and every field read
 * undefined. Nothing consumed it, so nothing surfaced it.
 */

/**
 * Lesson `contentType` -> engine `segmentType`.
 *
 * NOT the same enum, and not a near-miss: they share only `worked_example`,
 * `definition` and `summary`. Sending a lesson's own `explanatory_text` gets a
 * 422 - verified against the deployed API, where it is also the type of every
 * segment in the only lesson that currently exists. So a pass-through would
 * fail on 100% of real content.
 *
 * `calculation` is the one genuine gap: the engine has no calculation type, and
 * `worked_example` is the closest honest neighbour rather than a translation.
 * Worth confirming with backend.
 */
const SEGMENT_TYPE: Record<string, AdaptSegmentType> = {
  explanatory_text: "explanation",
  visual_diagram: "diagram",
  worked_example: "worked_example",
  practice_question: "practice",
  definition: "definition",
  summary: "summary",
  calculation: "worked_example",
};

/**
 * Engine `ScaffoldingLevel` (3 values) -> the indicator's `ScaffoldLevel` (5).
 *
 * The indicator draws 4 dots; the engine speaks in three levels, so it uses
 * three of the five. `light` maps to `light` - which is also the hardcoded
 * fallback the player uses today with no data behind it, so a lesson the
 * engine calls light looks exactly as it does now, and only a lesson it calls
 * harder changes.
 */
const SCAFFOLD: Record<string, ScaffoldLevel> = {
  light: SCAFFOLD_LEVELS.LIGHT,
  standard: SCAFFOLD_LEVELS.MODERATE,
  strong: SCAFFOLD_LEVELS.FULL,
};

const MODALITIES: readonly string[] = Object.values(MODALITY);

function asModality(value: string | null | undefined): Modality | null {
  return value && MODALITIES.includes(value) ? (value as Modality) : null;
}

/**
 * The lesson as the engine needs to see it.
 *
 * `availableModalities` is `minItems: 1` in the contract and a parsed segment
 * can arrive with an empty list, so it falls back to text - which is what
 * `body` is, and is what the player would render anyway.
 */
export function adaptSegmentsFor(segments: ContentSegment[]): AdaptSegment[] {
  return segments.map((s) => ({
    id: s.id,
    segmentType: SEGMENT_TYPE[s.contentType] ?? "explanation",
    availableModalities: s.availableModalities.length
      ? s.availableModalities
      : [MODALITY.TEXT],
  }));
}

/**
 * The engine's answer, in the player's own terms.
 *
 * WHAT IS DELIBERATELY NOT CARRIED:
 *
 * - `density`. The engine's `DensityLevel` (low/medium/high) is how dense the
 *   CONTENT should be; the player's `Density` (simplify/expand/slower) is which
 *   authored RESHAPE of the text to show. Parsed content has one body and no
 *   reshapes, so translating one into the other would ask the player to render
 *   a variant that does not exist - and the player already refuses to offer a
 *   density a segment cannot actually reshape into.
 * - `breakAfter`. `break_suggestion` is one suggestion for the whole lesson,
 *   not per segment, and on `lesson_load` with no runtime signals it is always
 *   `severity: "none"` with a null type. It belongs to the `in_lesson` pass.
 * - `affect`, `affectHint`, `socraticPrompts`. No field on this route carries
 *   them, and they are claims about a child.
 */
export function toAdaptationPlan(
  res: AdaptResponse,
  lesson: Lesson,
): AdaptationPlan {
  const offered = new Map(lesson.segments.map((s) => [s.id, s.modalities]));
  const suggested = asModality(res.modality_suggestion?.suggested);

  const segments: SegmentAdaptation[] = res.segments.flatMap((row) => {
    const modalities = offered.get(row.segment_id);
    // A plan row for a segment the player does not have is dropped rather than
    // carried: the player looks its plan up by segment id, so an orphan row is
    // dead weight at best.
    if (!modalities) return [];

    // Only ever a modality this segment can actually render. The engine works
    // from `availableModalities`, which a segment can CLAIM without carrying
    // the payload - the live lesson claims `visual` with a null `visualVariant`
    // - so opening a child in the engine's choice unchecked is how you get a
    // blank frame.
    const engineChoice = asModality(row.modality);
    const startModality =
      engineChoice && modalities.includes(engineChoice)
        ? engineChoice
        : (modalities[0] ?? MODALITY.TEXT);

    return [
      {
        segmentId: row.segment_id,
        startModality,
        scaffold: SCAFFOLD[row.scaffolding] ?? SCAFFOLD_LEVELS.LIGHT,
        // Same clamp: a suggestion the segment cannot render is not offered.
        suggestModality:
          suggested && suggested !== startModality && modalities.includes(suggested)
            ? suggested
            : null,
      },
    ];
  });

  return { lessonId: res.lesson_id, segments };
}
