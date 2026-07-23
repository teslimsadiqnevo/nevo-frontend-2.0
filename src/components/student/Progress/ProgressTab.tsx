import Link from "next/link";
import { GROWTH_SUMMARY, SUBJECTS, type SubjectSummary } from "./progressData";

/**
 * Progress Tab (screen 22). Growth in plain language: a warm summary of how the
 * student has been doing, then a card per subject with a gentle upward curve and
 * a qualitative note. Deliberately no numbers — no percentile, no score, no
 * peer comparison — only the direction of travel. Each card opens the subject.
 */
export function ProgressTab() {
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
