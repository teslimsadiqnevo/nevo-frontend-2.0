"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { BookOpen, Clock, Play, Shapes } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { EmptyState, IllustrationWrapper } from "@/components/shared";
import { MOCK_STUDENT } from "@/components/student/Shell/studentNav";

// ── Mock data ───────────────────────────────────────────────────────────────
// TODO(api): source "continue", "today's lessons" and the encouragement line
// from the backend (in-progress state, assignments, profile) once contracts land.
interface InProgress {
  lessonId: string;
  title: string;
  /** 0–1 through the lesson. */
  progress: number;
  note: string;
}
interface TodayLesson {
  lessonId: string;
  title: string;
  time: string;
  icon: LucideIcon;
}

const CONTINUE: InProgress | null = {
  lessonId: "photosynthesis",
  title: "Adding Fractions",
  progress: 0.55,
  note: "A little over halfway",
};

const TODAY: TodayLesson[] = [
  { lessonId: "photosynthesis", title: "Telling the Time", time: "About 10 min", icon: Clock },
  { lessonId: "photosynthesis", title: "The Lighthouse", time: "About 15 min", icon: BookOpen },
  { lessonId: "photosynthesis", title: "Shapes Around Us", time: "About 8 min", icon: Shapes },
];

const ENCOURAGEMENT =
  "You've been showing up this week. Keep going at your own pace.";

/** Time-of-day greeting — no data, just the clock. */
function greetingFor(hour: number): string {
  if (hour < 12) return "Good morning";
  if (hour < 17) return "Good afternoon";
  return "Good evening";
}

/**
 * Date + greeting depend on the viewer's local clock, which only the client
 * knows — computing them during render would mismatch the server HTML on
 * hydration. Resolve them after mount instead; until then the greeting is a
 * time-neutral "Hello".
 */
function useLocalClock() {
  const [clock, setClock] = useState<{ date: string; greeting: string } | null>(
    null,
  );
  useEffect(() => {
    const now = new Date();
    // Client-only clock read, once on mount — keeps SSR + hydration in agreement.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setClock({
      date: now.toLocaleDateString(undefined, {
        weekday: "long",
        day: "numeric",
        month: "long",
      }),
      greeting: greetingFor(now.getHours()),
    });
  }, []);
  return clock;
}

/**
 * Home Dashboard (screen 19). The student's calm landing surface: pick back up
 * where they left off (primary), today's lessons (secondary), and a warm,
 * pace-affirming note (tertiary — never a score or a streak count). Reduced-motion
 * aware; a settled empty state when there's nothing queued.
 */
export function HomeDashboard() {
  const clock = useLocalClock();
  const nothingQueued = !CONTINUE && TODAY.length === 0;

  return (
    <div className="mx-auto w-full max-w-[720px] px-5 py-2 pb-8 sm:px-8 sm:py-6 lg:max-w-[860px]">
      {/* Greeting */}
      <div className="motion-safe:animate-in motion-safe:fade-in-0 motion-safe:slide-in-from-bottom-2 motion-safe:duration-500">
        <span className="flex h-4 items-center font-mono text-[11px] tracking-[0.14em] text-nevo-near-black/60 uppercase">
          {clock?.date ?? ""}
        </span>
        <h1 className="mt-2 text-[28px] font-semibold leading-[1.12] tracking-[-0.02em] text-nevo-near-black sm:text-[34px]">
          {clock?.greeting ?? "Hello"}, {MOCK_STUDENT.name}
        </h1>
      </div>

      {nothingQueued ? (
        <div className="mt-10">
          <EmptyState
            illustration={
              <IllustrationWrapper
                src="/illustrations/welcome-settling.png"
                alt=""
                width={697}
                height={598}
                className="w-[180px]"
              />
            }
            title="Nothing waiting right now"
            description="When your teacher assigns a lesson, it'll show up here. Nice work staying on top of things."
          />
        </div>
      ) : (
        <>
          {CONTINUE && <ContinueCard lesson={CONTINUE} />}

          <div className="mt-8 flex items-baseline justify-between motion-safe:animate-in motion-safe:fade-in-0 motion-safe:duration-500 motion-safe:[animation-delay:200ms]">
            <h2 className="text-[17px] font-semibold tracking-[-0.01em] text-nevo-near-black">
              Today&apos;s lessons
            </h2>
            {TODAY.length > 0 && (
              <span className="text-[13px] text-nevo-near-black/60">
                {TODAY.length} ready
              </span>
            )}
          </div>

          {/* Grid on tablet/desktop, horizontal scroll on mobile */}
          <div className="-mx-5 mt-3.5 flex gap-3.5 overflow-x-auto px-5 pb-1.5 sm:mx-0 sm:grid sm:grid-cols-3 sm:gap-4 sm:overflow-visible sm:px-0 [&::-webkit-scrollbar]:hidden">
            {TODAY.map((lesson, i) => (
              <LessonCard key={i} lesson={lesson} index={i} />
            ))}
          </div>

          <div className="mt-8 flex items-center gap-3.5 rounded-[12px] bg-nevo-violet/14 px-5 py-[18px] motion-safe:animate-in motion-safe:fade-in-0 motion-safe:duration-500 motion-safe:[animation-delay:320ms]">
            <span className="size-2.5 shrink-0 rounded-full bg-nevo-violet" />
            <p className="text-[15px] leading-[1.45] text-nevo-near-black">
              {ENCOURAGEMENT}
            </p>
          </div>
        </>
      )}
    </div>
  );
}

/** Primary "pick back up" card — the one at Design System Level 3 elevation. */
function ContinueCard({ lesson }: { lesson: InProgress }) {
  return (
    <Link
      href={`/student/lessons/${lesson.lessonId}`}
      className="mt-6 block rounded-[16px] bg-nevo-cream-elevated p-[22px] shadow-elevation-3 transition-transform active:scale-[0.99] motion-safe:animate-in motion-safe:fade-in-0 motion-safe:slide-in-from-bottom-2 motion-safe:duration-500 motion-safe:[animation-delay:120ms]"
    >
      <span className="font-mono text-[11px] tracking-[0.08em] text-nevo-near-black/60 uppercase">
        Pick back up
      </span>
      <div className="mt-4 sm:flex sm:items-center sm:gap-7">
        <div className="flex flex-1 items-center gap-[18px]">
          <ProgressRing value={lesson.progress} />
          <div className="min-w-0 flex-1">
            <p className="text-[19px] font-semibold tracking-[-0.01em] text-nevo-near-black">
              {lesson.title}
            </p>
            <p className="mt-1.5 text-sm text-nevo-near-black/68">{lesson.note}</p>
          </div>
        </div>
        <span className="mt-5 flex h-[52px] w-full shrink-0 items-center justify-center rounded-[12px] bg-nevo-navy px-8 text-base font-medium text-nevo-cream sm:mt-0 sm:w-auto">
          Continue
        </span>
      </div>
    </Link>
  );
}

/** A quiet violet arc on a navy-tinted track, with a play glyph — never a %. */
function ProgressRing({ value }: { value: number }) {
  const r = 32;
  const circumference = 2 * Math.PI * r;
  const offset = circumference * (1 - Math.max(0, Math.min(1, value)));
  return (
    <span className="relative size-[68px] shrink-0">
      <svg
        width="68"
        height="68"
        viewBox="0 0 68 68"
        className="absolute inset-0 -rotate-90"
      >
        <circle cx="34" cy="34" r={r} fill="none" stroke="rgba(59,63,110,0.14)" strokeWidth="5" />
        <circle
          cx="34"
          cy="34"
          r={r}
          fill="none"
          stroke="#9a9ccb"
          strokeWidth="5"
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
        />
      </svg>
      <span className="absolute inset-0 flex items-center justify-center text-nevo-navy">
        <Play className="size-6" fill="currentColor" strokeWidth={0} />
      </span>
    </span>
  );
}

/** Secondary lesson card — icon header + title + adaptive time estimate. */
function LessonCard({ lesson, index }: { lesson: TodayLesson; index: number }) {
  const Icon = lesson.icon;
  // Alternating violet tints, matching the frame's rhythm.
  const tints = ["bg-nevo-violet/18", "bg-nevo-violet/12", "bg-nevo-violet/[0.22]"];
  return (
    <Link
      href={`/student/lessons/${lesson.lessonId}`}
      className="w-[158px] shrink-0 snap-start overflow-hidden rounded-[12px] bg-nevo-cream-elevated shadow-elevation-1 transition-transform active:scale-[0.98] motion-safe:animate-in motion-safe:fade-in-0 motion-safe:slide-in-from-bottom-2 motion-safe:duration-500 sm:w-auto"
      style={{ animationDelay: `${240 + index * 70}ms` }}
    >
      <div className={`flex h-[88px] items-center justify-center text-nevo-navy ${tints[index % tints.length]}`}>
        <Icon className="size-10" strokeWidth={2} />
      </div>
      <div className="p-3.5">
        <p className="text-[15px] font-semibold leading-[1.3] text-nevo-near-black">
          {lesson.title}
        </p>
        <p className="mt-1.5 text-[13px] text-nevo-near-black/60">{lesson.time}</p>
      </div>
    </Link>
  );
}
