"use client";

import { IllustrationWrapper } from "@/components/shared";
import Link from "next/link";
import { useHasSession } from "@/hooks/useHasSession";
import { useHydrated } from "@/hooks/useHydrated";
import { useStudentProgress } from "@/hooks/useStudentProgress";
import { GROWTH_SUMMARY, SUBJECTS, type SubjectSummary } from "./progressData";

/**
 * Progress Tab (screen 22). Growth in plain language: a warm summary of how the
 * student has been doing, then a card per subject with a gentle upward curve and
 * a qualitative note. Deliberately no numbers — no percentile, no score, no
 * peer comparison — only the direction of travel. Each card opens the subject.
 *
 * A SIGNED-IN CHILD SEES THEIR OWN, and never the fixtures.
 *
 * The fixtures are not placeholder text — they are sentences about a child's
 * learning ("You've been building strong reading skills this month"), so
 * rendering them to a real child told them things we had written about them.
 *
 * They were first gated to an empty state on the belief that Progress had no
 * backend at all. That was wrong, and the correction is this file:
 * `GET /api/students/{id}/progress` returns per-subject mastery, per-concept
 * understanding, and a lesson history. A signed-in child was being shown
 * "nothing yet" while their real data sat behind an already-typed client.
 *
 * What is still absent is the PROSE. No field carries "Getting faster at
 * solving problems", so the live cards carry no note rather than a generated
 * one — a sentence composed from a number is still a claim about a child.
 * What they read instead is which concepts they have actually worked on,
 * which is a fact.
 *
 * No numbers reach the screen (screen 22: no percentile, no score, no
 * comparison, direction of travel only). `understanding` orders the concepts
 * and never appears.
 */
export function ProgressTab() {
  const signedIn = useHasSession();
  const hydrated = useHydrated();
  const { subjects, loading, failed, live } = useStudentProgress();

  // The server cannot read the token, so SSR would render the fixtures and
  // hydration would swap them out - meaning a signed-in child sees a frame of
  // invented sentences about themselves. Nothing renders until we know who is
  // looking.
  if (!hydrated) return <ProgressShell />;
  if (signedIn) {
    if (loading) return <ProgressShell />;
    if (failed) return <CouldNotLoad />;
    // Live and genuinely empty: a child who has not worked on anything yet.
    if (!live || subjects.length === 0) return <NothingYet />;
    return <LiveProgress subjects={subjects} />;
  }

  return (
    <div className="mx-auto w-full max-w-[900px] px-5 py-2 pb-6 sm:px-8 sm:py-6 lg:py-8">
      <h1 className="text-2xl font-semibold tracking-[-0.01em] text-nevo-near-black sm:text-[30px] lg:text-[32px]">
        Progress
      </h1>

      <p className="mt-5 max-w-[300px] text-base leading-[1.55] text-nevo-near-black/72 sm:mt-6 sm:max-w-[560px] sm:text-[18px] lg:mt-7 lg:max-w-[640px] lg:text-[19px]">
        {GROWTH_SUMMARY}
      </p>

      {/* Subject growth — horizontal scroll on mobile, grid on tablet/desktop */}
      <div className="-mx-5 mt-6 flex gap-3.5 overflow-x-auto px-5 pb-1 sm:mx-0 sm:mt-9 sm:grid sm:grid-cols-2 sm:gap-5 sm:overflow-visible sm:px-0 lg:mt-10 lg:grid-cols-3 [&::-webkit-scrollbar]:hidden">
        {SUBJECTS.map((subject) => (
          <SubjectCard key={subject.slug} subject={subject} />
        ))}
      </div>
    </div>
  );
}

/** The child's own subjects, from their concept rows. */
function LiveProgress({
  subjects,
}: {
  subjects: ReturnType<typeof useStudentProgress>["subjects"];
}) {
  return (
    <div className="mx-auto w-full max-w-[900px] px-5 py-2 pb-6 sm:px-8 sm:py-6 lg:py-8">
      <h1 className="text-2xl font-semibold tracking-[-0.01em] text-nevo-near-black sm:text-[30px] lg:text-[32px]">
        Progress
      </h1>

      <p className="mt-5 max-w-[300px] text-base leading-[1.55] text-nevo-near-black/72 sm:mt-6 sm:max-w-[560px] sm:text-[18px] lg:mt-7 lg:max-w-[640px] lg:text-[19px]">
        Here&rsquo;s what you&rsquo;ve been working on.
      </p>

      <div className="-mx-5 mt-6 flex gap-3.5 overflow-x-auto px-5 pb-1 sm:mx-0 sm:mt-9 sm:grid sm:grid-cols-2 sm:gap-5 sm:overflow-visible sm:px-0 lg:mt-10 lg:grid-cols-3 [&::-webkit-scrollbar]:hidden">
        {subjects.map((subject) => (
          <Link
            key={subject.slug}
            href={`/student/progress/${subject.slug}`}
            className="w-[180px] shrink-0 overflow-hidden rounded-[12px] bg-nevo-cream-elevated shadow-elevation-1 transition-transform active:scale-[0.98] sm:w-auto"
          >
            <GrowthCurve />
            <div className="p-3.5 sm:p-[18px]">
              <p className="text-base font-semibold text-nevo-near-black sm:text-[18px]">
                {subject.name}
              </p>
              {/* Concept NAMES, not scores - what they have worked on is a
                  fact; how well is a judgement the contract carries as a
                  number and screen 22 forbids showing. */}
              <p className="mt-1.5 text-sm leading-[1.4] text-nevo-near-black/60 sm:mt-2 sm:text-[15px] sm:leading-[1.45]">
                {subject.concepts
                  .slice(0, 3)
                  .map((c) => c.name)
                  .join(" · ")}
              </p>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}

/** The read failed - not the same as having done nothing. */
function CouldNotLoad() {
  return (
    <div className="mx-auto w-full max-w-[900px] px-5 py-2 pb-6 sm:px-8 sm:py-6 lg:py-8">
      <h1 className="text-2xl font-semibold tracking-[-0.01em] text-nevo-near-black sm:text-[30px] lg:text-[32px]">
        Progress
      </h1>
      <div className="mt-8 rounded-[16px] bg-nevo-cream-elevated p-[22px] shadow-elevation-1">
        <p className="text-[17px] font-semibold text-nevo-near-black">
          We couldn&rsquo;t load your progress just now
        </p>
        <p className="mt-1.5 text-[15px] leading-[1.5] text-nevo-near-black/68">
          Nothing is lost. Give it a moment and try again.
        </p>
        <button
          type="button"
          onClick={() => window.location.reload()}
          className="mt-5 flex h-[48px] cursor-pointer items-center rounded-[12px] bg-nevo-navy px-7 text-[15px] font-medium text-nevo-cream"
        >
          Try again
        </button>
      </div>
    </div>
  );
}

/** Heading only, while we work out who is looking. */
function ProgressShell() {
  return (
    <div className="mx-auto w-full max-w-[900px] px-5 py-2 pb-6 sm:px-8 sm:py-6 lg:py-8">
      <h1 className="text-2xl font-semibold tracking-[-0.01em] text-nevo-near-black sm:text-[30px] lg:text-[32px]">
        Progress
      </h1>
      <div className="mt-8 h-24 max-w-[560px] animate-pulse rounded-[12px] bg-nevo-cream-elevated" />
    </div>
  );
}

/**
 * What a signed-in child sees until the backend can say something true.
 *
 * Framed as "not yet", never as "you have made no progress". The absence is
 * ours, not theirs, and a child reading this should not take it as a verdict
 * on their work.
 */
function NothingYet() {
  return (
    <div className="mx-auto w-full max-w-[900px] px-5 py-2 pb-6 sm:px-8 sm:py-6 lg:py-8">
      <h1 className="text-2xl font-semibold tracking-[-0.01em] text-nevo-near-black sm:text-[30px] lg:text-[32px]">
        Progress
      </h1>

      <div className="flex flex-col items-center px-6 pt-10 pb-6 text-center">
        <IllustrationWrapper
          src="/illustrations/empty-lessons.png"
          alt=""
          width={512}
          height={512}
          className="w-[170px]"
        />
        <h2 className="mt-5 text-lg font-medium text-nevo-near-black">
          Nothing to show here yet
        </h2>
        <p className="mt-1.5 max-w-[320px] text-sm leading-[1.55] text-nevo-near-black/60">
          Keep going with your lessons and Nevo will start showing you how
          things are building.
        </p>
      </div>
    </div>
  );
}

/** One subject's growth — a decorative upward curve + a plain-language note. */
function SubjectCard({ subject }: { subject: SubjectSummary }) {
  return (
    <Link
      href={`/student/progress/${subject.slug}`}
      className="w-[180px] shrink-0 overflow-hidden rounded-[12px] bg-nevo-cream-elevated shadow-elevation-1 transition-transform active:scale-[0.98] sm:w-auto"
    >
      <GrowthCurve />
      <div className="p-3.5 sm:p-[18px]">
        <p className="text-base font-semibold text-nevo-near-black sm:text-[18px]">
          {subject.name}
        </p>
        <p className="mt-1.5 text-sm leading-[1.4] text-nevo-near-black/60 sm:mt-2 sm:text-[15px] sm:leading-[1.45]">
          {subject.note}
        </p>
      </div>
    </Link>
  );
}

/**
 * A calm, rising curve — direction of travel, not data. No axes, no numbers;
 * decorative by design (`aria-hidden`), so a screen reader hears only the note.
 */
function GrowthCurve() {
  return (
    <div className="h-20 bg-nevo-violet/14 sm:h-[120px]">
      <svg
        viewBox="0 0 280 120"
        width="100%"
        height="100%"
        preserveAspectRatio="none"
        aria-hidden
      >
        <path
          d="M0 100 C70 94 100 60 140 52 C190 42 240 24 280 12 L280 120 L0 120 Z"
          fill="rgba(154,156,203,0.18)"
        />
        <path
          d="M0 100 C70 94 100 60 140 52 C190 42 240 24 280 12"
          fill="none"
          stroke="#9a9ccb"
          strokeWidth="3"
          strokeLinecap="round"
        />
      </svg>
    </div>
  );
}
