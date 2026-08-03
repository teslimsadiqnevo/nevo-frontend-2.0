"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowRight, Check } from "lucide-react";
import { cn, randomId } from "@/lib/utils";
import { baselineApi } from "@/lib/api";
import { FIRST_LESSON_ID } from "@/lib/mocks";
import {
  BASELINE_DIMENSIONS,
  type BaselineDimension,
} from "@/lib/profiling/bands";
import { BaselineCapture } from "@/lib/profiling/capture";

/** One round only; the whole run should feel like ~45 seconds, never a test. */
const GRID_SEQ_LEN = 3;
const LIT_MS = 660;
const GAP_MS = 280;
const DOT_REVEAL_MS = 850;
const PICK_BEAT_MS = 440;

/** Today's dimension - backend decides; weekday rotation is the mock fallback. */
export function dimensionForToday(): BaselineDimension {
  return BASELINE_DIMENSIONS[new Date().getDay() % BASELINE_DIMENSIONS.length];
}

/**
 * Daily warm-up run (`Nevo Warm-Up Run Frame`, SCRUM-104): one round of the
 * day's baseline task, stripped of the onboarding quest map - a quiet
 * "DAILY WARM-UP" header with a small ring, the activity, and the gentle
 * one-shot done state ("Your progress is saved"). Never reads as an assessment;
 * nothing is marked right or wrong.
 * TODO(api): dimension comes from GET /api/baseline/recalibrate-prompt.
 */
export function WarmUpRun({
  dimension = dimensionForToday(),
}: {
  dimension?: BaselineDimension;
}) {
  const router = useRouter();
  const [done, setDone] = useState(false);
  const [capture] = useState(() => new BaselineCapture(`warmup-${randomId()}`));
  const startedAt = useRef(0);
  const submitted = useRef(false);

  useEffect(() => {
    startedAt.current = performance.now();
    capture.record("warmup_start", { dimension });
  }, [capture, dimension]);

  const finish = useCallback(() => {
    if (!submitted.current) {
      submitted.current = true;
      const durationMs = Math.round(performance.now() - startedAt.current);
      baselineApi
        .submit(capture.sessionId, [{ module: "warmup", dimension, durationMs }])
        .catch(() => {})
        .finally(() => void capture.purge());
    }
    setDone(true);
  }, [capture, dimension]);

  return (
    <div className="flex min-h-[100dvh] flex-col bg-nevo-cream text-nevo-near-black">
      <div className="flex shrink-0 items-center justify-between px-7 py-7">
        <span className="font-mono text-[11px] font-bold tracking-[0.14em] text-nevo-violet">
          DAILY WARM-UP
        </span>
        <svg width="34" height="34" viewBox="0 0 34 34" aria-hidden>
          <circle cx="17" cy="17" r="15" fill="none" stroke="rgba(154,156,203,0.25)" strokeWidth="3" />
          <circle
            cx="17"
            cy="17"
            r="15"
            fill="none"
            stroke="#9a9ccb"
            strokeWidth="3"
            strokeLinecap="round"
            strokeDasharray="94"
            strokeDashoffset={done ? 0 : 40}
            transform="rotate(-90 17 17)"
            className="transition-[stroke-dashoffset] duration-500"
          />
        </svg>
      </div>

      {done ? (
        <div className="flex flex-1 flex-col items-center justify-center gap-[22px] px-9 text-center">
          <span className="flex size-20 items-center justify-center rounded-full bg-nevo-navy motion-safe:animate-nevo-pop">
            <Check className="size-9 text-nevo-cream" strokeWidth={2.4} />
          </span>
          <div>
            <h3 className="text-[22px] font-semibold tracking-[-0.01em] text-nevo-navy">
              That&apos;s it for today
            </h3>
            <p className="mt-2.5 max-w-[320px] text-[15.5px] leading-[1.55] text-nevo-near-black">
              Nevo is tuned to how you&apos;re doing today. Your progress is
              saved.
            </p>
          </div>
          <button
            type="button"
            onClick={() => router.push(`/student/lessons/${FIRST_LESSON_ID}`)}
            className="h-12 cursor-pointer rounded-[10px] bg-nevo-navy px-6 text-base font-semibold text-nevo-cream transition-[filter,transform] hover:brightness-109 active:scale-[0.985]"
          >
            Start today&apos;s lesson
          </button>
        </div>
      ) : (
        <div className="flex min-h-0 flex-1 items-center justify-center px-7 pb-10">
          <div className="flex w-full max-w-[480px] flex-col items-center gap-[26px]">
            <WarmUpTask dimension={dimension} capture={capture} onDone={finish} />
          </div>
        </div>
      )}
    </div>
  );
}

/** One round of the day's task - the frame's simplified single-trial forms. */
function WarmUpTask({
  dimension,
  capture,
  onDone,
}: {
  dimension: BaselineDimension;
  capture: BaselineCapture;
  onDone: () => void;
}) {
  const shownAt = useRef(0);
  useEffect(() => {
    shownAt.current = performance.now();
  }, []);
  const pick = (choice: number | string) => {
    capture.record("trial_pick", {
      module: "warmup",
      act: dimension,
      choice,
      rtMs: Math.round(performance.now() - shownAt.current),
    });
  };

  switch (dimension) {
    case "wmc":
      return <WarmUpGrid capture={capture} onDone={onDone} />;
    case "ps":
      return (
        <SingleChoice
          prompt="Same, or different?"
          onDone={onDone}
          onPick={pick}
          options={["Same", "Different"]}
          stimulus={
            <div className="flex gap-5 sm:gap-7">
              {[0, 1].map((i) => (
                <div
                  key={i}
                  className="flex size-[120px] items-center justify-center rounded-[16px] border-2 border-nevo-navy bg-nevo-cream sm:size-[150px]"
                >
                  <span
                    className={cn(
                      "block size-1/2 border-[3px] border-nevo-violet",
                      i === 0 ? "rounded-full" : "rounded-[6px]",
                    )}
                  />
                </div>
              ))}
            </div>
          }
        />
      );
    case "reading":
      return (
        <SingleChoice
          prompt="True or false?"
          onDone={onDone}
          onPick={pick}
          stacked
          options={["True", "False", "Not sure"]}
          softLast
          stimulus={
            <div className="w-full rounded-[12px] border-2 border-nevo-navy/50 bg-nevo-cream p-[18px] text-center text-[17px] leading-[1.5] text-nevo-near-black">
              Garri is made from cassava.
            </div>
          }
        />
      );
    case "ans":
      return <WarmUpDots onDone={onDone} onPick={pick} />;
    case "attention":
      return (
        <SingleChoice
          prompt="Which way is the middle arrow pointing?"
          onDone={onDone}
          onPick={pick}
          options={["Left", "Right"]}
          stimulus={
            <div className="flex items-center gap-1.5">
              {[0, 1, 2, 3, 4].map((i) => (
                <ArrowRight
                  key={i}
                  strokeWidth={2.4}
                  className={cn(
                    i === 2
                      ? "size-10 text-nevo-navy"
                      : "size-8 -scale-x-100 text-nevo-near-black/40",
                  )}
                />
              ))}
            </div>
          }
        />
      );
    default:
      return (
        <SingleChoice
          prompt="A quick one from today's lesson."
          onDone={onDone}
          onPick={pick}
          stacked
          options={["Two-thirds", "Three-fifths", "They're equal"]}
          stimulus={
            <div className="w-full rounded-[12px] bg-nevo-cream-elevated px-5 py-[18px]">
              <p className="text-[17px] leading-[1.5] font-medium text-nevo-near-black">
                Which is larger: two-thirds or three-fifths?
              </p>
            </div>
          }
        />
      );
  }
}

/** Generic single-trial pick with the 440ms pressed beat, no feedback. */
function SingleChoice({
  prompt,
  stimulus,
  options,
  stacked = false,
  softLast = false,
  onPick,
  onDone,
}: {
  prompt: string;
  stimulus: React.ReactNode;
  options: string[];
  stacked?: boolean;
  softLast?: boolean;
  onPick: (choice: string) => void;
  onDone: () => void;
}) {
  const [picked, setPicked] = useState(-1);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const onDoneRef = useRef(onDone);
  useEffect(() => {
    onDoneRef.current = onDone;
  }, [onDone]);
  useEffect(() => () => {
    if (timer.current) clearTimeout(timer.current);
  }, []);

  const choose = (i: number) => {
    if (picked !== -1) return;
    onPick(options[i]);
    setPicked(i);
    timer.current = setTimeout(() => onDoneRef.current(), PICK_BEAT_MS);
  };

  return (
    <>
      <p className="text-center text-[17px] leading-[1.5] font-medium text-nevo-near-black">
        {prompt}
      </p>
      {stimulus}
      <div className={cn("flex w-full gap-3.5", stacked ? "flex-col" : "justify-center")}>
        {options.map((o, i) => {
          const soft = softLast && i === options.length - 1;
          return (
            <button
              key={o}
              type="button"
              onClick={() => choose(i)}
              className={cn(
                "h-12 cursor-pointer rounded-[10px] border-2 transition-[background-color,transform] active:scale-[0.97]",
                stacked ? "w-full" : "min-w-[140px] flex-1 sm:flex-none",
                soft ? "text-sm font-medium" : "text-base font-semibold",
                picked === i
                  ? "border-nevo-violet bg-nevo-violet text-nevo-near-black"
                  : soft
                    ? "border-nevo-violet bg-nevo-cream text-nevo-violet"
                    : "border-nevo-navy bg-nevo-cream text-nevo-navy",
              )}
            >
              {o}
            </button>
          );
        })}
      </div>
    </>
  );
}

/** wmc: one 3-tile sequence on a 4x4 grid, tapped back in reverse. */
function WarmUpGrid({
  capture,
  onDone,
}: {
  capture: BaselineCapture;
  onDone: () => void;
}) {
  const [seq, setSeq] = useState<number[]>([]);
  const [lit, setLit] = useState(-1);
  const [inputOn, setInputOn] = useState(false);
  const [tapped, setTapped] = useState<ReadonlySet<number>>(() => new Set());
  const [wrongCell, setWrongCell] = useState(-1);
  const pos = useRef(0);
  const timers = useRef<ReturnType<typeof setTimeout>[]>([]);
  const onDoneRef = useRef(onDone);
  useEffect(() => {
    onDoneRef.current = onDone;
  }, [onDone]);

  useEffect(() => {
    const pool = [...Array(16).keys()];
    const s: number[] = [];
    for (let i = 0; i < GRID_SEQ_LEN; i++)
      s.push(pool.splice(Math.floor(Math.random() * pool.length), 1)[0]);
    const local: ReturnType<typeof setTimeout>[] = [];
    const at = (ms: number, fn: () => void) => local.push(setTimeout(fn, ms));
    at(0, () => setSeq(s));
    let t = 560;
    s.forEach((cell) => {
      at(t, () => setLit(cell));
      at(t + LIT_MS, () => setLit(-1));
      t += LIT_MS + GAP_MS;
    });
    at(t + 150, () => setInputOn(true));
    timers.current = local;
    return () => local.forEach(clearTimeout);
  }, []);

  const tap = (cell: number) => {
    if (!inputOn) return;
    const expected = [...seq].reverse();
    const correct = cell === expected[pos.current];
    capture.record("tap", { module: "warmup", act: "wmc", cell, correct });
    if (!correct) {
      setWrongCell(cell);
      timers.current.push(setTimeout(() => setWrongCell(-1), 900));
      return;
    }
    const next = new Set(tapped).add(cell);
    setTapped(next);
    pos.current += 1;
    if (pos.current >= seq.length)
      timers.current.push(setTimeout(() => onDoneRef.current(), PICK_BEAT_MS));
  };

  return (
    <>
      <p className="text-center text-[17px] leading-[1.5] font-medium text-nevo-near-black">
        {inputOn ? "Tap the tiles you saw, in reverse order." : "Watch the tiles"}
      </p>
      <div className="grid grid-cols-4 gap-2 sm:gap-2.5">
        {Array.from({ length: 16 }, (_, i) => (
          <button
            key={i}
            type="button"
            tabIndex={inputOn ? 0 : -1}
            onClick={() => tap(i)}
            className={cn(
              "flex size-[62px] items-center justify-center rounded-[12px] transition-[transform,box-shadow] duration-150 sm:size-[84px]",
              i === lit &&
                "scale-105 bg-nevo-violet shadow-[0_6px_18px_rgba(154,156,203,0.5)]",
              tapped.has(i) && "bg-nevo-navy",
              i === wrongCell &&
                "border-2 border-nevo-violet bg-nevo-cream shadow-[0_0_0_3px_rgba(154,156,203,0.35)]",
              i !== lit && !tapped.has(i) && i !== wrongCell &&
                "border-2 border-nevo-navy bg-nevo-cream",
              inputOn ? "cursor-pointer" : "pointer-events-none",
            )}
          >
            {tapped.has(i) && (
              <Check className="size-5 text-nevo-cream" strokeWidth={2.6} />
            )}
          </button>
        ))}
      </div>
    </>
  );
}

/** ans: one dot comparison - reveal, mask, then answer. */
function WarmUpDots({
  onPick,
  onDone,
}: {
  onPick: (choice: string) => void;
  onDone: () => void;
}) {
  const [masked, setMasked] = useState(false);
  const [picked, setPicked] = useState(-1);
  const timers = useRef<ReturnType<typeof setTimeout>[]>([]);
  const onDoneRef = useRef(onDone);
  useEffect(() => {
    onDoneRef.current = onDone;
  }, [onDone]);
  useEffect(() => {
    const t = setTimeout(() => setMasked(true), DOT_REVEAL_MS);
    return () => clearTimeout(t);
  }, []);
  useEffect(() => () => timers.current.forEach(clearTimeout), []);

  const scatter = (count: number, seed: number) => {
    let s = seed >>> 0;
    const rng = () => {
      s = (s * 1664525 + 1013904223) >>> 0;
      return s / 4294967296;
    };
    return Array.from({ length: count }, () => ({
      x: 10 + rng() * 72,
      y: 10 + rng() * 72,
    }));
  };

  const choose = (i: number, label: string) => {
    if (!masked || picked !== -1) return;
    onPick(label);
    setPicked(i);
    timers.current.push(setTimeout(() => onDoneRef.current(), PICK_BEAT_MS));
  };

  return (
    <>
      <p className="text-center text-[17px] leading-[1.5] font-medium text-nevo-near-black">
        {masked ? "Which side had more dots?" : "Watch the dots"}
      </p>
      <div className="flex flex-col gap-4 sm:flex-row sm:gap-6">
        {[9, 6].map((count, side) => (
          <div
            key={side}
            className="relative size-[150px] overflow-hidden rounded-[12px] border-2 border-nevo-navy bg-nevo-cream sm:size-[200px]"
          >
            {scatter(count, 17 + side * 29).map((d, i) => (
              <span
                key={i}
                className="absolute size-4 rounded-full bg-nevo-violet"
                style={{ left: `${d.x}%`, top: `${d.y}%` }}
              />
            ))}
            {masked && <div className="absolute inset-0 bg-nevo-cream-elevated" />}
          </div>
        ))}
      </div>
      <div className="flex w-full justify-center gap-3.5">
        {["Left", "Right"].map((label, i) => (
          <button
            key={label}
            type="button"
            onClick={() => choose(i, label)}
            className={cn(
              "h-12 min-w-[140px] rounded-[10px] border-2 text-base font-semibold transition-[background-color,border-color]",
              picked === i
                ? "border-nevo-violet bg-nevo-violet text-nevo-near-black"
                : masked
                  ? "cursor-pointer border-nevo-navy bg-nevo-cream text-nevo-navy"
                  : "cursor-default border-nevo-navy/30 bg-nevo-cream text-nevo-navy/40",
            )}
          >
            {label}
          </button>
        ))}
      </div>
    </>
  );
}
