"use client";

import { useEffect, useState } from "react";
import { Play } from "lucide-react";
import { cn } from "@/lib/utils";
import type { AgeBand } from "@/lib/profiling/bands";
import type { BaselineCapture } from "@/lib/profiling/capture";
import { AvatarBubble, ProfilingShell } from "./ProfilingShell";
import { SettleBadge } from "./GridSpanModule";
import { TrialButton } from "./PatternFlankerModule";
import { useTrialRunner } from "./useTrialRunner";

/** 3B: the dot arrays show briefly, then mask; only then do the buttons arm. */
const DOT_REVEAL_MS = 850;

/**
 * Module 3 - Reading + Dot Comparison (BP-M3: reading and numerical fluency).
 * 3A adapts by band: P1-3 hears a sentence and taps the matching picture (no
 * reading required); P4-6/JSS mark localized sentences True/False with a
 * lighter "Not sure" always available; SS reads a passage and answers a
 * comprehension question. 3B flashes two dot arrays (~850ms), masks them, and
 * asks which side had more. Content is real and West-African localized. No
 * timers, no scores, never "wrong".
 */

const SENTENCES: Record<string, string[]> = {
  p46: [
    "Garri is made from cassava.",
    "Lagos is the capital of Nigeria.",
    "The danfo bus runs from Oshodi to CMS.",
  ],
  jss: [
    "If you travel from Lagos to Abuja by road, you pass through at least three states.",
    "The naira is the currency of Ghana.",
    "Harmattan winds blow from the Sahara between November and March.",
  ],
};

const PASSAGE =
  "Every morning, Ada sets up her stall at Balogun Market before sunrise. She sells folded Ankara wrappers, and by mid-morning the narrow lane is crowded with traders calling out prices. Ada keeps a small notebook where she records each sale, because she is saving to pay her younger brother's school fees. On market days she rarely sits down before noon.";
const PASSAGE_QUESTION = "Why does Ada keep a notebook?";
const PASSAGE_OPTIONS = [
  "To remember her customers' names",
  "To track her savings for school fees",
  "To write down the market prices",
  "To record the day's weather",
];

/** P1-3 audio mode: the sentence is heard, the answer is a picture. */
const AUDIO_PICS: { key: string; label: string; svg: string }[] = [
  { key: "bus", label: "A bus", svg: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="5" width="18" height="11" rx="2"/><path d="M3 11h18"/><circle cx="7.5" cy="19" r="1.5"/><circle cx="16.5" cy="19" r="1.5"/><path d="M6 8h4"/></svg>' },
  { key: "market", label: "A market bag", svg: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M4 8h16l-1.5 11H5.5z"/><path d="M8 8V6a4 4 0 0 1 8 0v2"/></svg>' },
  { key: "house", label: "A house", svg: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M4 11l8-6 8 6"/><path d="M6 10v9h12v-9"/></svg>' },
];

/** Dot pairs per trial (left/right counts converge by band difficulty). */
const DOT_PAIRS: Record<AgeBand, { a: number; b: number }[]> = {
  p13: [{ a: 8, b: 4 }, { a: 7, b: 3 }, { a: 9, b: 5 }],
  p46: [{ a: 9, b: 5 }, { a: 8, b: 6 }, { a: 10, b: 7 }],
  jss: [{ a: 12, b: 8 }, { a: 11, b: 9 }, { a: 13, b: 10 }],
  ss: [{ a: 13, b: 12 }, { a: 12, b: 11 }, { a: 14, b: 13 }],
};

/** Deterministic scatter so re-renders never reshuffle a shown array. */
function scatter(count: number, seed: number): { x: number; y: number }[] {
  let s = seed >>> 0;
  const rng = () => {
    s = (s * 1664525 + 1013904223) >>> 0;
    return s / 4294967296;
  };
  return Array.from({ length: count }, () => ({
    x: 8 + rng() * 76,
    y: 8 + rng() * 76,
  }));
}

export function SentenceDotModule({
  band,
  capture,
  onComplete,
}: {
  band: AgeBand;
  capture?: BaselineCapture;
  onComplete: () => void;
}) {
  const mode = band === "p13" ? "audio" : band === "ss" ? "passage" : "sentence";
  const readingCount =
    mode === "sentence" ? (SENTENCES[band] ?? SENTENCES.p46).length : mode === "audio" ? 2 : 1;
  const dotPairs = DOT_PAIRS[band] ?? DOT_PAIRS.p46;

  const { act, trial, picked, settling, pick } = useTrialRunner({
    module: "sentence_dot",
    counts: [
      ["reading", readingCount],
      ["dots", dotPairs.length],
    ],
    capture,
    onComplete,
  });

  // 3B reveal/mask cycle, restarted per dot trial (both edges on cancellable
  // timers - no synchronous setState in the effect body).
  const [masked, setMasked] = useState(false);
  useEffect(() => {
    if (act !== "dots") return;
    const t0 = setTimeout(() => setMasked(false), 0);
    const t1 = setTimeout(() => setMasked(true), DOT_REVEAL_MS);
    return () => {
      clearTimeout(t0);
      clearTimeout(t1);
    };
  }, [act, trial]);

  const sentence =
    (SENTENCES[band] ?? SENTENCES.p46)[
      Math.min(trial, (SENTENCES[band] ?? SENTENCES.p46).length - 1)
    ];
  const pair = dotPairs[Math.min(trial, dotPairs.length - 1)];

  const bubble = settling
    ? ""
    : act === "dots"
      ? masked
        ? "Which side had more dots?"
        : "Watch the dots"
      : mode === "audio"
        ? "Listen, then tap the matching picture"
        : mode === "passage"
          ? "Read it, then answer"
          : "Is this true or false?";

  return (
    <ProfilingShell filled={settling ? 3 : 2} active={settling ? -1 : 2}>
      {!settling && bubble && <AvatarBubble text={bubble} />}

      <div className="flex min-h-0 w-full flex-1 flex-col items-center justify-center gap-7">
        {settling ? (
          <SettleBadge />
        ) : act === "reading" ? (
          mode === "audio" ? (
            <div className="flex w-full max-w-[560px] flex-col items-center gap-8">
              {/* TODO(audio): real narration asset; the play affordance is the shell. */}
              <button
                type="button"
                aria-label="Play the sentence"
                className="flex size-[64px] cursor-pointer items-center justify-center rounded-full bg-nevo-navy text-nevo-cream transition-transform active:scale-[0.96]"
              >
                <Play className="ml-1 size-6" fill="currentColor" strokeWidth={0} />
              </button>
              <div className="flex w-full flex-col items-center gap-3.5 sm:flex-row sm:justify-center sm:gap-4">
                {AUDIO_PICS.map((p, i) => (
                  <button
                    key={p.key}
                    type="button"
                    aria-label={p.label}
                    onClick={() => pick(i, { mode })}
                    className={cn(
                      "flex h-[120px] w-full cursor-pointer items-center justify-center rounded-[12px] bg-nevo-cream transition-transform active:scale-[0.97] sm:size-[160px]",
                      picked === i
                        ? "border-[3px] border-nevo-navy"
                        : "border-2 border-nevo-navy",
                    )}
                  >
                    <div
                      className="size-[76px] text-nevo-navy sm:size-[96px]"
                      dangerouslySetInnerHTML={{ __html: p.svg }}
                    />
                  </button>
                ))}
              </div>
            </div>
          ) : mode === "passage" ? (
            <div className="flex w-full max-w-[600px] flex-col gap-4">
              <div className="rounded-[12px] border-2 border-nevo-navy bg-nevo-cream px-[18px] py-4 text-[15px] leading-[1.6] text-pretty text-nevo-near-black">
                {PASSAGE}
              </div>
              <p className="text-[15px] font-medium text-nevo-navy">{PASSAGE_QUESTION}</p>
              <div className="flex flex-col gap-2.5">
                {PASSAGE_OPTIONS.map((o, i) => (
                  <button
                    key={o}
                    type="button"
                    onClick={() => pick(i, { mode })}
                    className={cn(
                      "flex min-h-12 w-full cursor-pointer items-center rounded-[10px] border-2 px-4 py-3.5 text-left text-[15px] leading-[1.4]",
                      picked === i
                        ? "border-nevo-navy bg-nevo-navy text-nevo-cream"
                        : "border-nevo-navy bg-nevo-cream text-nevo-near-black",
                    )}
                  >
                    {o}
                  </button>
                ))}
                <button
                  type="button"
                  onClick={() => pick(PASSAGE_OPTIONS.length, { mode, notSure: true })}
                  className="flex min-h-12 w-full cursor-pointer items-center rounded-[10px] border-2 border-nevo-violet bg-nevo-cream px-4 py-3.5 text-left text-sm font-medium text-nevo-violet"
                >
                  Not sure
                </button>
              </div>
            </div>
          ) : (
            <div className="flex w-full max-w-[560px] flex-col items-center gap-7">
              <div
                key={trial}
                className="w-full rounded-[12px] border-2 border-nevo-navy bg-nevo-cream px-5 py-[22px] text-center text-[17px] leading-[1.5] text-pretty text-nevo-near-black"
              >
                {sentence}
              </div>
              <div className="flex w-full flex-col items-center gap-3.5 sm:w-auto sm:flex-row">
                <TrialButton label="True" pressed={picked === 0} onClick={() => pick(0, { mode })} />
                <TrialButton label="False" pressed={picked === 1} onClick={() => pick(1, { mode })} />
                <TrialButton label="Not sure" soft pressed={picked === 2} onClick={() => pick(2, { mode, notSure: true })} />
              </div>
            </div>
          )
        ) : (
          <>
            <div className="flex flex-col items-center gap-4 sm:flex-row sm:gap-6">
              {[pair.a, pair.b].map((count, side) => (
                <div
                  key={`${trial}-${side}`}
                  className="relative size-[200px] overflow-hidden rounded-[12px] border-2 border-nevo-navy bg-nevo-cream"
                >
                  {scatter(count, 11 + trial * 3 + side * 29).map((d, i) => (
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
            <div className="flex w-full max-w-[300px] flex-col gap-4 sm:w-auto sm:max-w-none sm:flex-row">
              <DotButton label="Top" wide={pair.a} onClick={() => masked && pick(0, { a: pair.a, b: pair.b })} pressed={picked === 0} armed={masked} sideLabel="Left" />
              <DotButton label="Bottom" wide={pair.b} onClick={() => masked && pick(1, { a: pair.a, b: pair.b })} pressed={picked === 1} armed={masked} sideLabel="Right" />
            </div>
          </>
        )}
      </div>
    </ProfilingShell>
  );
}

/** 3B answer button: disabled-looking until the mask lands, per the frame. */
function DotButton({
  sideLabel,
  label,
  onClick,
  pressed,
  armed,
}: {
  label: string;
  sideLabel: string;
  wide: number;
  onClick: () => void;
  pressed: boolean;
  armed: boolean;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "flex h-14 min-w-[170px] items-center justify-center rounded-[10px] border-2 text-lg font-semibold transition-[background-color,border-color]",
        pressed
          ? "border-nevo-violet bg-nevo-violet text-nevo-near-black"
          : armed
            ? "cursor-pointer border-nevo-navy bg-nevo-cream text-nevo-navy"
            : "cursor-default border-nevo-navy/30 bg-nevo-cream text-nevo-navy/40",
      )}
    >
      <span className="sm:hidden">{label}</span>
      <span className="hidden sm:inline">{sideLabel}</span>
    </button>
  );
}
