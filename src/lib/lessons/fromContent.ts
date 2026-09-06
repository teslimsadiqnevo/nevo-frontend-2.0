import type {
  LessonDetailResponse,
  LessonModule as ContentModule,
  LessonSegment as ContentSegment,
} from "@/lib/api/lessons";
import { toQuickCheck } from "@/lib/api/checkpoints";
import { MODALITY, type Modality } from "@/lib/constants";
import type {
  Lesson,
  LessonModule,
  LessonSegment,
  QuickCheck,
  TextContent,
} from "@/lib/types";

/**
 * Parsed backend content -> the shape the Lesson Player renders.
 *
 * THE FIVE VARIANTS ARE TYPED NOW (3 Sep), and both detail routes return them.
 * They were typed only on the PARSE response, though, whose sole consumer is
 * the teacher's upload wizard - so `LessonSegment` on the player's own read
 * declared none of them and the bytes were erased before this adapter ran.
 * That seam is closed; what each channel does with them is opened one at a
 * time, because the rule below has not changed:
 *
 *   A modality offered and then found blank is worse than one never offered.
 *
 * ON: text, and the inline comprehension check. `comprehensionCheckpoints` was
 * being dropped here, which is why `toQuickCheck` - written for exactly this,
 * and careful enough to refuse a checkpoint it cannot mark - had no caller and
 * the player's `QuickCheckSheet` never drew for a live lesson.
 *
 * STILL OFF, and why:
 *   - VISUAL and AUDIO map cleanly (`imageUrl`/`audioUrl` -> `illustration.src`
 *     /`src`, `script` -> `transcript`), but both URLs are SIGNED and EXPIRE -
 *     they carry `urlExpiresInSeconds`, and `contentApi.mediaUrl` mints a fresh
 *     one from `storagePath`. A lesson is read once and can sit open far longer
 *     than the URL lives, so switching these on without that minting is exactly
 *     the blank frame the rule forbids. That is the next step, not this one.
 *   - INTERACTIVE does not map at all. The wire's `InteractiveVariant` is a
 *     QUESTION (`prompt`, `options`, `answerKey`); the player's
 *     `InteractiveContent` is tickable STEPS with an outcome. Two different
 *     things sharing a name - a design question, not a wiring one.
 *   - CALCULATION is partial: `CalculationSegment` needs `scaffold`
 *     (kind/parts/rows) and `problem.answer`, and the wire carries neither.
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

/**
 * The segment's inline check, if it has one this app can honestly mark.
 *
 * `toQuickCheck` returns null for a checkpoint with no answer key, a
 * multiple-answer one, or one whose key matches none of its options - all of
 * which exist in content parsed before the checkpoint contract did. The FIRST
 * markable checkpoint wins: the player draws one sheet per segment, and
 * showing a child the second question of two is worse than showing the first.
 */
function quickCheckFor(segment: ContentSegment): QuickCheck | undefined {
  for (const checkpoint of segment.comprehensionCheckpoints) {
    const check = toQuickCheck(checkpoint);
    if (check) return check;
  }
  return undefined;
}

function segmentFor(
  segment: ContentSegment,
  lessonTitle: string,
): LessonSegment {
  const quickCheck = quickCheckFor(segment);
  return {
    id: segment.id,
    modalities: modalitiesFor(segment),
    text: textFor(segment, lessonTitle),
    // Omitted rather than set undefined: the player tests `segment.quickCheck`
    // for presence, and an absent check must not gate progress.
    ...(quickCheck ? { quickCheck } : {}),
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
