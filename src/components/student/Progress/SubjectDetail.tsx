"use client";

import { useState } from "react";
import Link from "next/link";
import { ChevronLeft } from "lucide-react";
import { useHasSession } from "@/hooks/useHasSession";
import { useHydrated } from "@/hooks/useHydrated";
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
 * Gated exactly as the Progress tab is, and for the same reason: the prose here
 * is invented reflection on a child's learning ("Fractions clicked this week"),
 * and no endpoint carries the real thing. The tab no longer links here for a
 * signed-in child, but a bookmark or a typed URL still reaches it.
 */
export function SubjectDetail({ subject }: { subject: SubjectDetailData }) {
  const signedIn = useHasSession();
  const hydrated = useHydrated();
  // Session Detail sheet (Subject Detail frame): tapping a growth-line marker
  // opens the session behind it.
  const [session, setSession] = useState<SessionRow | null>(null);
  const [sheetOpen, setSheetOpen] = useState(false);

  // Same gate as the Progress tab, and hydration-safe for the same reason: SSR
  // cannot see the token, so rendering first and correcting after would show a
  // signed-in child a frame of invented reflection on their own learning.
  if (!hydrated || signedIn) {
    return (
      <div className="mx-auto w-full max-w-[900px] px-5 py-3 pb-6 sm:px-8 sm:py-6">
        <Link
          href="/student/progress"
          aria-label="Back to Progress"
          className="flex size-11 items-center justify-center rounded-[10px] text-nevo-near-black transition-colors hover:bg-nevo-near-black/[0.06]"
        >
          <ChevronLeft className="size-6" strokeWidth={2} />
        </Link>
        {hydrated && signedIn && (
          <div className="px-6 pt-8 text-center">
            <h1 className="text-lg font-medium text-nevo-near-black">
              Nothing to show here yet
            </h1>
            <p className="mx-auto mt-1.5 max-w-[320px] text-sm leading-[1.55] text-nevo-near-black/60">
              Keep going with your lessons and Nevo will start showing you how
              things are building.
            </p>
          </div>
        )}
      </div>
    );
  }

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
