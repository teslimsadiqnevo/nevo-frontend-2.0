import type {
  LessonDetailResponse,
  LessonModule as ContentModule,
  LessonSegment as ContentSegment,
} from "@/lib/api/lessons";
import { MODALITY, type Modality } from "@/lib/constants";
import type {
  Lesson,
  LessonModule,
  LessonSegment,
  TextContent,
} from "@/lib/types";

/**
 * Parsed backend content -> the shape the Lesson Player renders.
 *
 * WHAT THIS DELIBERATELY DOES NOT DO. The content contract carries five
 * per-modality payloads - `textVariant`, `visualVariant`, `audioVariant`,
 * `interactiveVariant`, `calculationVariant` - and every one of them is typed
 * `Record<string, unknown>`. Nothing can be read out of a free-form object
 * honestly, so this adapter reads NONE of them and builds the text modality
 * from `body`, which is a plain string and is the one field whose meaning the
 * spec actually fixes.
 *
 * The consequence is deliberate and visible: a live lesson plays as text. It
 * does not pretend to offer visual, audio or interactive channels, because the
 * player would draw an empty frame for each - and the audio channel could not
 * play anything even with content, since narration assets are producer-generated
 * and do not exist yet. A modality offered and then found blank is worse than a
 * modality never offered.
 *
 * This is the seam the full player swap lands on once the backend types those
 * five fields. Until then the two authored mock lessons keep their full
 * multi-modal treatment and everything else plays as text.
 */

/** The channels this adapter can actually populate from parsed content. */
const RENDERABLE: readonly Modality[] = [MODALITY.TEXT];

/**
 * What the player will be offered for a segment: the backend's own list,
 * narrowed to what we can draw. Never empty - a segment with no recognised
 * modality still reads as text, which is what `body` is.
 */
function modalitiesFor(segment: ContentSegment): Modality[] {
  const offered = segment.availableModalities.filter((m): m is Modality =>
    (RENDERABLE as readonly string[]).includes(m),
  );
  return offered.length > 0 ? offered : [MODALITY.TEXT];
}

/**
 * One segment's text. `heading` falls back to the lesson title because the
 * parser leaves `title` null on continuation segments, and the player's text
 * frame always draws a heading.
 */
function textFor(segment: ContentSegment, lessonTitle: string): TextContent {
  return {
    heading: segment.title ?? lessonTitle,
    // No density reshapes exist in the contract - see `TextContent.body`.
    body: { default: segment.body },
  };
}

function segmentFor(
  segment: ContentSegment,
  lessonTitle: string,
): LessonSegment {
  return {
    id: segment.id,
    modalities: modalitiesFor(segment),
    text: textFor(segment, lessonTitle),
  };
}

/**
 * Modules are optional and come from a different endpoint (`/api/v1/lessons/{id}`),
 * so they are passed in rather than fetched here. A module whose segments did
 * not survive the mapping is dropped: the player indexes segments by id and a
 * module pointing at nothing would draw an empty boundary screen.
 */
function modulesFor(
  modules: ContentModule[],
  segments: LessonSegment[],
): LessonModule[] | undefined {
  if (modules.length === 0) return undefined;
  const known = new Set(segments.map((s) => s.id));
  const mapped = modules
    .slice()
    .sort((a, b) => a.sequenceOrder - b.sequenceOrder)
    .map((m) => ({
      id: m.id,
      title: m.title,
      segmentIds: m.segmentIds.filter((id) => known.has(id)),
      ...(m.preview ? { preview: m.preview } : {}),
      ...(m.recap ? { recap: m.recap } : {}),
    }))
    .filter((m) => m.segmentIds.length > 0);
  return mapped.length > 0 ? mapped : undefined;
}

/**
 * Build a playable lesson from the content endpoint's response.
 *
 * Returns null when the lesson has no segments at all - a lesson still being
 * parsed, or one whose parse failed. The player has nothing to show for that
 * and the caller should say so rather than open an empty spine.
 */
export function lessonFromContent(
  res: LessonDetailResponse,
  modules: ContentModule[] = [],
): Lesson | null {
  const ordered = res.segments
    .slice()
    .sort((a, b) => a.sequenceOrder - b.sequenceOrder);
  if (ordered.length === 0) return null;

  const segments = ordered.map((s) => segmentFor(s, res.title));

  return {
    id: res.id,
    title: res.title,
    segments,
    modules: modulesFor(modules, segments),
    // No assessment in the content contract, and no recap field the summary
    // screen could honestly use: `confirmationSummary` is the parser talking
    // to a teacher about its own confidence, not a recap written for a child.
  };
}
