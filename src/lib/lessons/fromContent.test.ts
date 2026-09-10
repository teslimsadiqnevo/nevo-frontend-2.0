import { describe, expect, it } from "vitest";
import { lessonFromContent } from "./fromContent";
import type {
  LessonDetailResponse,
  LessonSegment as ContentSegment,
} from "@/lib/api/lessons";

/**
 * The rule this file defends: a modality offered and then found blank is worse
 * than one never offered.
 *
 * That is not abstract here. `availableModalities` listed `visual` on every
 * segment of the library for months while `visualVariant` was null - a claim
 * with no payload - because the backend's 4,096-token output ceiling meant the
 * model never produced one and the pipeline silently fell back to splitting
 * source text. Trusting the claim would have opened a child on an empty frame.
 *
 * So visual is offered only when there is an image AND that image passed its
 * own review, and the tests are written from both directions.
 */

const segment = (over: Partial<ContentSegment> = {}): ContentSegment =>
  ({
    id: "seg-1",
    segmentKey: "s1",
    contentType: "visual_diagram",
    sequenceOrder: 1,
    title: "Numerators",
    body: "The number on top.",
    availableModalities: ["text", "visual"],
    comprehensionCheckpoints: [],
    textVariant: null,
    visualVariant: null,
    audioVariant: null,
    interactiveVariant: null,
    calculationVariant: null,
    needsReview: false,
    reviewReasons: [],
    ...over,
  }) as unknown as ContentSegment;

const visualVariant = (over: Record<string, unknown> = {}) =>
  ({
    type: "ai_generated_image",
    imageUrl: "https://cdn.example/img.png",
    storagePath: "lessons/seg-1.png",
    prompt: "A pizza cut into quarters, friendly cartoon style",
    provider: "openai",
    reviewedBy: "claude-opus-4-8",
    reviewAttempts: 0,
    generatedAt: new Date().toISOString(),
    caption: "Understanding Numerators and Denominators",
    qualityValidated: true,
    urlExpiresInSeconds: null,
    ...over,
  }) as never;

const lesson = (segments: ContentSegment[]): LessonDetailResponse =>
  ({
    id: "lesson-1",
    title: "Fractions Lesson 3",
    confirmationSummary: null,
    segments,
  }) as unknown as LessonDetailResponse;

describe("lessonFromContent — the visual channel", () => {
  it("carries a reviewed image through", () => {
    const out = lessonFromContent(
      lesson([segment({ visualVariant: visualVariant() })]),
    );

    expect(out?.segments[0].visual?.illustration?.src).toBe(
      "https://cdn.example/img.png",
    );
    expect(out?.segments[0].modalities).toContain("visual");
  });

  it("refuses an image that failed its own review", () => {
    // These are generated pictures with a review pass behind them. One that did
    // not pass is one we have been told not to trust, and a wrong picture of a
    // concept a child is trying to learn is worse than no picture.
    const out = lessonFromContent(
      lesson([
        segment({ visualVariant: visualVariant({ qualityValidated: false }) }),
      ]),
    );

    expect(out?.segments[0].visual).toBeUndefined();
    expect(out?.segments[0].modalities).not.toContain("visual");
  });

  it("does not believe a segment that claims visual with no image", () => {
    // Exactly the state the whole library was in: availableModalities said
    // "visual", visualVariant was null.
    const out = lessonFromContent(
      lesson([segment({ availableModalities: ["text", "visual"] })]),
    );

    expect(out?.segments[0].visual).toBeUndefined();
    expect(out?.segments[0].modalities).toEqual(["text"]);
  });

  it("never lets the generator's prompt reach a child or a screen reader", () => {
    const out = lessonFromContent(
      lesson([segment({ visualVariant: visualVariant() })]),
    );
    const illustration = out?.segments[0].visual?.illustration;

    expect(illustration?.alt).toBe("Understanding Numerators and Denominators");
    expect(illustration?.caption).toBe(
      "Understanding Numerators and Denominators",
    );
    expect(JSON.stringify(out)).not.toContain("friendly cartoon style");
  });

  it("prefers an empty alt to narrating something invented", () => {
    // No caption means no honest description. An empty alt is the correct way
    // to say "this adds nothing a screen reader needs".
    const out = lessonFromContent(
      lesson([segment({ visualVariant: visualVariant({ caption: "  " }) })]),
    );
    const illustration = out?.segments[0].visual?.illustration;

    expect(illustration?.alt).toBe("");
    expect(illustration?.caption).toBeUndefined();
  });

  it("leaves audio off, because the player only pretends to play it", () => {
    // `AudioSegment` animates a waveform on a timer and defaults durationSec to
    // 40. The asset is real; the playback is not. Offering it would be a play
    // button that runs a progress line over silence.
    const out = lessonFromContent(
      lesson([
        segment({
          availableModalities: ["text", "audio"],
          audioVariant: {
            script: "The number on top is the numerator.",
            audioUrl: "https://cdn.example/a.mp3",
          } as never,
        }),
      ]),
    );

    expect(out?.segments[0].modalities).toEqual(["text"]);
  });
});
