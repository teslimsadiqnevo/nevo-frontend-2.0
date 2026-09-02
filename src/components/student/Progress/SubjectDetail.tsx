"use client";

import { useState } from "react";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ChevronLeft } from "lucide-react";
import { useHasSession } from "@/hooks/useHasSession";
import { useHydrated } from "@/hooks/useHydrated";
import { useDueReviews } from "@/hooks/useDueReviews";
import { useStudentProgress } from "@/hooks/useStudentProgress";
import type {
  SessionRow,
  SubjectDetail as SubjectDetailData,
} from "./progressData";
import { SessionDetailSheet } from "./SessionDetailSheet";

/** Smooth path through the timeline points (0–320 × 0–80 space). */
function smoothPath(points: [number, number][]): string {
  if (points.length < 2) return "";
  let d = `M ${points[0][0]} ${points[0][1]}`;
  for (let i = 0; i < points.length - 1; i++) {
    const [, y0] = points[i];
    const [x1, y1] = points[i + 1];
    const cx = (points[i][0] + x1) / 2;
    d += ` C ${cx} ${y0}, ${cx} ${y1}, ${x1} ${y1}`;
  }
  return d;
}

/**
 * Subject Detail (screen 23) — a deeper, still-calm look at one subject, reached
 * from the Progress tab. A plain-language reflection, a gentle growth line with
 * session markers (direction, not data), and the lessons behind it. No numbers,
 * no score, no comparison.
 *
 * SIGNED IN, THIS READS LIVE. `GET /api/students/{id}/progress/{subject}`
 * carries the concepts worked on and the lesson history with timestamps - the
 * two things this screen is actually made of. The invented reflection
 * ("Fractions clicked this week") has no field behind it and is simply not
 * shown rather than generated from a score.
 *
 * The growth line stays DECORATIVE and `aria-hidden`, as designed. The
 * contract gives a current understanding value per concept and no series over
 * time, so drawing a trend from it would be inventing a shape the data does
 * not have. Direction of travel, not data - the frame's own words.
 */
export function SubjectDetail({
  subject,
  slug,
}: {
  /** The designed fixture, for the signed-out walkthrough. */
  subject: SubjectDetailData | null;
  /** Route slug - the live subject is matched against it. */
  slug: string;
}) {
  const signedIn = useHasSession();
  const hydrated = useHydrated();
  const live = useStudentProgress();
  const liveSubject = live.subjects.find((s) => s.slug === slug);
  // Session Detail sheet (Subject Detail frame): tapping a growth-line marker
  // opens the session behind it.
  const [session, setSession] = useState<SessionRow | null>(null);
  const [sheetOpen, setSheetOpen] = useState(false);

  // Hydration-safe: SSR cannot see the token, so rendering the fixtures first
  // and correcting after would show a signed-in child a frame of invented
  // reflection on their own learning.
  if (!hydrated || (signedIn && live.loading)) {
    return <DetailShell />;
  }
  if (signedIn) {
    return (
      <LiveSubjectDetail
        name={liveSubject?.name ?? subject?.name ?? "Progress"}
        concepts={liveSubject?.concepts ?? []}
        lessons={live.lessons}
        failed={live.failed}
      />
    );
  }

  // Signed out with no fixture for this slug: nothing designed to show.
  if (!subject) notFound();

  // Markers run oldest → newest left-to-right; the lessons list is newest-first.
  // Map from the newest end so the most recent markers carry sessions; any
  // extra leading markers stay decorative.
  const chronological = [...subject.lessons].reverse();
  const offset = subject.timeline.length - chronological.length;
  const sessionForDot = (i: number): SessionRow | null =>
    i - offset >= 0 ? (chronological[i - offset] ?? null) : null;

  const openSession = (s: SessionRow) => {
    setSession(s);
    setSheetOpen(true);
  };

  return (
    <div className="flex min-h-full flex-col">
      {/* Back to Progress */}
      <div className="flex h-14 shrink-0 items-center px-3 sm:px-5">
        <Link
          href="/student/progress"
          aria-label="Back to Progress"
          className="flex size-11 items-center justify-center rounded-[10px] transition-colors hover:bg-nevo-near-black/[0.06]"
        >
          <ChevronLeft className="size-6 text-nevo-near-black" strokeWidth={2} />
        </Link>
        <span className="ml-1.5 text-sm text-nevo-near-black/60 max-sm:hidden">
          Progress
        </span>
      </div>

      <div className="mx-auto w-full max-w-[680px] px-6 pb-8 sm:px-8">
        <h1 className="text-[26px] font-semibold tracking-[-0.01em] text-nevo-near-black sm:text-[30px] lg:text-[32px]">
          {subject.name}
        </h1>

        <p className="mt-[18px] text-base leading-[1.65] text-nevo-near-black sm:text-[17px]">
          {subject.prose}
        </p>

        {/* Growth timeline — decorative direction, not a chart of numbers */}
        <div className="mt-7 rounded-[12px] bg-nevo-cream-elevated px-[18px] py-6 shadow-elevation-1">
          <div className="relative h-20 w-full sm:h-[100px] lg:h-[110px]">
            <svg
              viewBox="0 0 320 80"
              width="100%"
              height="100%"
              preserveAspectRatio="none"
              className="absolute inset-0 overflow-visible"
              aria-hidden
            >
              <path
                d={smoothPath(subject.timeline)}
                fill="none"
                stroke="#9a9ccb"
                strokeWidth="3"
                strokeLinecap="round"
                strokeLinejoin="round"
                vectorEffect="non-scaling-stroke"
              />
            </svg>
            {subject.timeline.map(([x, y], i) => {
              const dot = (
                <span
                  aria-hidden
                  className="size-[13px] rounded-full bg-nevo-navy shadow-[0_0_0_4px_rgba(237,232,220,0.9)]"
                />
              );
              const s = sessionForDot(i);
              return s ? (
                // 44×44 hit area around the 13px marker (touch-first).
                <button
                  key={i}
                  type="button"
                  aria-label={`View session: ${s.title}, ${s.date}`}
                  onClick={() => openSession(s)}
                  className="absolute flex size-11 -translate-x-1/2 -translate-y-1/2 cursor-pointer items-center justify-center rounded-full transition-transform active:scale-95"
                  style={{ left: `${(x / 320) * 100}%`, top: `${(y / 80) * 100}%` }}
                >
                  {dot}
                </button>
              ) : (
                <span
                  key={i}
                  className="absolute flex size-11 -translate-x-1/2 -translate-y-1/2 items-center justify-center"
                  style={{ left: `${(x / 320) * 100}%`, top: `${(y / 80) * 100}%` }}
                >
                  {dot}
                </span>
              );
            })}
          </div>
        </div>

        <h2 className="mt-7 text-base font-semibold text-nevo-near-black">
          What you&apos;ve been learning
        </h2>
        <ul className="mt-3">
          {subject.lessons.map((lesson) => (
            <li
              key={lesson.title}
              className="flex items-center justify-between border-b border-nevo-near-black/8 py-3.5"
            >
              <span className="text-[15px] text-nevo-near-black">
                {lesson.title}
              </span>
              <span className="text-[13px] text-nevo-near-black/55">
                {lesson.date}
              </span>
            </li>
          ))}
        </ul>
      </div>

      <SessionDetailSheet
        session={session}
        open={sheetOpen}
        onOpenChange={setSheetOpen}
      />
    </div>
  );
}

/** Chrome shared by every state of this screen. */
function DetailFrame({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-full flex-col">
      <div className="flex h-14 shrink-0 items-center px-3 sm:px-5">
        <Link
          href="/student/progress"
          aria-label="Back to Progress"
          className="flex size-11 items-center justify-center rounded-[10px] transition-colors hover:bg-nevo-near-black/[0.06]"
        >
          <ChevronLeft className="size-6 text-nevo-near-black" strokeWidth={2} />
        </Link>
        <span className="ml-1.5 text-sm text-nevo-near-black/60 max-sm:hidden">
          Progress
        </span>
      </div>
      <div className="mx-auto w-full max-w-[680px] px-6 pb-8 sm:px-8">
        {children}
      </div>
    </div>
  );
}

function DetailShell() {
  return (
    <DetailFrame>
      <div className="h-8 w-48 animate-pulse rounded bg-nevo-cream-elevated" />
      <div className="mt-7 h-[132px] animate-pulse rounded-[12px] bg-nevo-cream-elevated" />
    </DetailFrame>
  );
}

/**
 * The child's own subject, from `progress/{subject}`.
 *
 * Concepts and lesson history are real. The reflection paragraph is absent:
 * nothing writes one, and composing it from `understanding` would be us making
 * the claim. Dates are formatted from `updatedAt`, which is a fact.
 */
function LiveSubjectDetail({
  name,
  concepts,
  lessons,
  failed,
}: {
  name: string;
  concepts: { conceptId: string; name: string }[];
  lessons: { lessonId: string; title: string; updatedAt: string }[];
  failed: boolean;
}) {
  // Which of these concepts the scheduler says are ready again. A failed or
  // still-running read simply leaves every concept where it was: the grouping
  // is an addition to this screen, never a precondition for rendering it.
  const review = useDueReviews();
  const ready = review.due.size
    ? concepts.filter((c) => review.due.has(c.conceptId))
    : [];
  const rest = ready.length
    ? concepts.filter((c) => !review.due.has(c.conceptId))
    : concepts;

  if (failed) {
    return (
      <DetailFrame>
        <h1 className="text-[26px] font-semibold tracking-[-0.01em] text-nevo-near-black sm:text-[30px]">
          {name}
        </h1>
        <p className="mt-4 text-[15px] leading-[1.55] text-nevo-near-black/66">
          We couldn&rsquo;t load this just now. Nothing is lost &mdash; give it a
          moment and try again.
        </p>
      </DetailFrame>
    );
  }

  return (
    <DetailFrame>
      <h1 className="text-[26px] font-semibold tracking-[-0.01em] text-nevo-near-black sm:text-[30px] lg:text-[32px]">
        {name}
      </h1>

      {ready.length > 0 && (
        <>
          <h2 className="mt-7 text-base font-semibold text-nevo-near-black">
            Ready for another look
          </h2>
          <div className="mt-3 flex flex-wrap gap-2">
            {ready.map((c) => (
              <span
                key={c.conceptId}
                className="rounded-full bg-nevo-navy/10 px-3 py-1.5 text-[13px] text-nevo-navy ring-1 ring-nevo-navy/20 ring-inset"
              >
                {c.name}
              </span>
            ))}
          </div>
        </>
      )}

      {rest.length > 0 && (
        <>
          <h2 className="mt-7 text-base font-semibold text-nevo-near-black">
            What you&apos;ve been working on
          </h2>
          <div className="mt-3 flex flex-wrap gap-2">
            {rest.map((c) => (
              <span
                key={c.conceptId}
                className="rounded-full bg-nevo-violet/20 px-3 py-1.5 text-[13px] text-nevo-navy"
              >
                {c.name}
              </span>
            ))}
          </div>
        </>
      )}

      {lessons.length > 0 && (
        <>
          <h2 className="mt-7 text-base font-semibold text-nevo-near-black">
            Lessons you&apos;ve done
          </h2>
          <ul className="mt-3">
            {lessons.map((l) => (
              <li
                key={l.lessonId}
                className="flex items-center justify-between gap-3 border-b border-nevo-near-black/8 py-3.5"
              >
                <span className="min-w-0 flex-1 truncate text-[15px] text-nevo-near-black">
                  {l.title}
                </span>
                <span className="shrink-0 text-[13px] text-nevo-near-black/55">
                  {new Date(l.updatedAt).toLocaleDateString("en-GB", {
                    day: "numeric",
                    month: "short",
                  })}
                </span>
              </li>
            ))}
          </ul>
        </>
      )}

      {concepts.length === 0 && lessons.length === 0 && (
        <p className="mt-6 text-[15px] leading-[1.55] text-nevo-near-black/60">
          Nothing here yet. Keep going with your lessons and this will fill in.
        </p>
      )}
    </DetailFrame>
  );
}
