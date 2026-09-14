import { describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import type { LessonDetailResponse, LessonSegment } from "@/lib/api/lessons";

vi.mock("@/components/shared/IllustrationWrapper", () => ({
  IllustrationWrapper: ({ alt }: { alt: string }) => <div role="img" aria-label={alt} />,
}));

import { LiveLessonDetail } from "./LiveLessonDetail";

/**
 * The way into variant review.
 *
 * `/teacher/lessons/{id}/variants` was built, tested and live for three days
 * with NOTHING linking to it - a finished screen reachable only by typing a
 * URL. The inventory called it "no entry point"; this is the entry.
 *
 * The assertion is about the HREF, because the href is the feature. A test that
 * the link renders would pass against one pointing at the wrong section, which
 * is the failure that would actually reach a teacher: variants for the segment
 * below the one they tapped.
 */

const seg = (over: Partial<LessonSegment> = {}): LessonSegment =>
  ({
    id: "s-1",
    segmentKey: "k-1",
    contentType: "explanation",
    sequenceOrder: 1,
    title: "What an equation is",
    body: "",
    availableModalities: [],
    comprehensionCheckpoints: [],
    needsReview: false,
    reviewReasons: [],
    textVariant: null,
    visualVariant: null,
    audioVariant: null,
    interactiveVariant: null,
    calculationVariant: null,
    ...over,
  }) as unknown as LessonSegment;

const lesson = (segments: LessonSegment[]) =>
  ({
    id: "l-9",
    title: "Solving linear equations",
    segments,
    confirmationSummary: null,
  }) as unknown as LessonDetailResponse;

const render3 = () =>
  render(
    <LiveLessonDetail
      lesson={lesson([
        seg({ id: "s-1", sequenceOrder: 1, title: "First" }),
        seg({ id: "s-2", sequenceOrder: 2, title: "Second" }),
        seg({ id: "s-3", sequenceOrder: 3, title: "Third" }),
      ])}
      modules={[]}
      assignments={[]}
      progress={null}
    />,
  );

describe("variant review entry", () => {
  it("offers a way in from every segment", () => {
    render3();

    expect(screen.getAllByRole("link", { name: "Variant review" })).toHaveLength(3);
  });

  it("points each link at ITS OWN section, one-indexed", () => {
    // Off by one here sends a teacher to a neighbouring segment's variants and
    // says nothing is wrong. The screen counts sections from 1.
    render3();

    const hrefs = screen
      .getAllByRole("link", { name: "Variant review" })
      .map((a) => a.getAttribute("href"));

    expect(hrefs).toEqual([
      "/teacher/lessons/l-9/variants?section=1",
      "/teacher/lessons/l-9/variants?section=2",
      "/teacher/lessons/l-9/variants?section=3",
    ]);
  });

  it("offers it even where Nevo has generated nothing", () => {
    // Every segment above carries four null variants. The screen names which
    // are missing, and that is worth reaching; a link that appeared and
    // vanished for invisible reasons would be worse than one that is always
    // there.
    render3();

    expect(screen.getAllByRole("link", { name: "Variant review" }).length).toBe(3);
  });
});
