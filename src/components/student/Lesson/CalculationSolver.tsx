"use client";

import { useEffect, useRef, useState } from "react";
import { Check, Pause, Play } from "lucide-react";
import { NevoKeyboard } from "@/components/shared";
import { CALC_MODALITY } from "@/lib/constants";
import type { CalculationSegment } from "@/lib/types";
import { isNumericStep } from "@/lib/types";
import { cn } from "@/lib/utils";

/**
 * Calculation Solver (17b — co-construction). The one component that teaches a
 * calculation across all three modalities: Interactive (the default co-construction
 * flow), Audio (a narration layer that never hides text), and Kinesthetic (a
 * tap-to-build manipulative for the final step). The system holds the equation
 * and a visual scaffold on screen throughout; the student supplies one thinking
 * step at a time; the answer assembles itself. This is the accessibility
 * requirement — never a generic "enter the answer" component (17b §2).
 *
 * v1 renders the `fraction_add_like` scaffold (fraction bars). Prompts, choices,
 * hints, confirm and completion copy are driven by the segment payload; the bar
 * scaffold + equation rendering are specific to this variant (17b §1, §7).
 *
 * No evaluative colour ever — never red/green, never a cross. A miss is a single
 * gentle shake and warmer framing. No score, percentage or progress counter.
 */
export function CalculationSolver({
  calculation,
  onSolved,
  onStepAnswered,
  onReplay,
}: {
  calculation: CalculationSegment;
  /** Fired once the answer assembles - the player opens the forward chevron. */
  onSolved: () => void;
  /** Each confirmed step (comprehension_response signal). */
  onStepAnswered?: (correct: boolean) => void;
  /** Audio narration replay (replay signal). */
  onReplay?: () => void;
}) {
  const steps = calculation.steps;
  const lastIndex = steps.length - 1;

  const [step, setStep] = useState(0);
  const [phase, setPhase] = useState<"ask" | "confirmed" | "done">("ask");
  const [attempts, setAttempts] = useState(0);
  const [showHint, setShowHint] = useState(false);
  const [numVal, setNumVal] = useState("");
  const [manip, setManip] = useState(false);
  const [placed, setPlaced] = useState(0);

  const advanceTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  useEffect(() => () => {
    if (advanceTimer.current) clearTimeout(advanceTimer.current);
  }, []);

  const done = phase === "done";

  // ── Derived scaffold (fraction_add_like) ────────────────────────────────
  const parts = calculation.scaffold.parts; // 4
  const rows = calculation.scaffold.rows; // [1, 2]
  const sum = rows.reduce((a, b) => a + b, 0); // 3
  const numericAnswer = isNumericStep(steps[lastIndex])
    ? (steps[lastIndex] as { answer: string }).answer
    : String(sum);

  // Denominators highlighted while resolving them (step 0 confirmed) and step 1.
  const ring = (step === 0 && phase === "confirmed") || step === 1;
  // Numerators emphasised (navy) from step 1 onward.
  const strong = step >= 1 || done;

  const current = steps[step];
  const isCardStep = phase === "ask" && !isNumericStep(current);
  const isFinalStep = phase === "ask" && isNumericStep(current);
  const kinestheticAvailable = calculation.modalities.includes(
    CALC_MODALITY.KINESTHETIC,
  );
  const audioAvailable = calculation.modalities.includes(CALC_MODALITY.AUDIO);

  const finish = () => {
    if (advanceTimer.current) clearTimeout(advanceTimer.current);
    setPhase("done");
    onSolved();
  };

  const pickCard = (choiceIndex: number) => {
    if (phase !== "ask" || isNumericStep(current)) return;
    const correct = choiceIndex === current.correct;
    onStepAnswered?.(correct);
    if (!correct) {
      setAttempts((a) => {
        const next = a + 1;
        if (next >= 2) setShowHint(true); // two misses auto-surface the hint
        return next;
      });
      return;
    }
    // Correct. A step that carries confirm copy pauses on a confirmation, then
    // auto-advances; otherwise it advances straight away.
    const nextStep = step + 1;
    const goNext = () => {
      setStep(nextStep);
      setPhase("ask");
      setAttempts(0);
      setShowHint(false);
    };
    if (current.onCorrect?.confirm) {
      setPhase("confirmed");
      advanceTimer.current = setTimeout(goNext, 1500);
    } else {
      goNext();
    }
  };

  const onNumChange = (value: string) => {
    setNumVal(value);
    if (value.trim() === numericAnswer) {
      onStepAnswered?.(true);
      if (advanceTimer.current) clearTimeout(advanceTimer.current);
      advanceTimer.current = setTimeout(finish, 250);
    }
  };

  const placeTile = () => {
    setPlaced((p) => {
      const next = Math.min(sum, p + 1);
      if (next >= sum) {
        onStepAnswered?.(true);
        if (advanceTimer.current) clearTimeout(advanceTimer.current);
        advanceTimer.current = setTimeout(finish, 400);
      }
      return next;
    });
  };

  const hintText = "hint" in current ? current.hint : "";

  return (
    <div>
      {audioAvailable && <NarrationBar onReplay={onReplay} />}

      {/* SCAFFOLD — persistent; highlights per step, fills as the answer assembles */}
      <div className="rounded-[12px] bg-nevo-cream-elevated p-[18px] shadow-elevation-1 sm:p-6">
        <span className="font-mono text-[10px] tracking-[0.06em] text-nevo-near-black/50 uppercase">
          Picture it
        </span>
        <div className="mt-3.5 flex flex-col gap-3">
          <BarRow
            label={`${rows[0]}/${parts}`}
            parts={parts}
            filled={rows[0]}
            strong={strong}
            ring={ring}
          />
          <BarRow
            label={`${rows[1]}/${parts}`}
            parts={parts}
            filled={rows[1]}
            strong={strong}
            ring={ring}
          />
          {done && (
            <div className="flex items-center gap-3 border-t border-nevo-near-black/10 pt-3 motion-safe:animate-nevo-reveal">
              <span className="w-[34px] shrink-0 text-sm font-semibold text-nevo-navy">
                {sum}/{parts}
              </span>
              <div className="flex flex-1 gap-[5px]">
                {Array.from({ length: parts }).map((_, i) => (
                  <span
                    key={i}
                    className="h-7 flex-1 rounded-[5px] bg-nevo-navy origin-left motion-safe:animate-nevo-fill"
                  />
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* EQUATION — updates in place, assembles to the answer on completion */}
      <div className="mt-[18px] flex min-h-[52px] items-center justify-center">
        {isFinalStep && !done ? (
          <div className="flex items-center gap-2.5 text-[30px] font-medium tracking-[-0.01em] text-nevo-navy sm:text-[40px] motion-safe:animate-nevo-reveal">
            <span>{rows[0]}</span>
            <span className="text-nevo-navy/70">+</span>
            <span>{rows[1]}</span>
            <span className="text-nevo-navy/70">=</span>
            <span className="text-nevo-navy/50">?</span>
          </div>
        ) : (
          <div className="flex items-center gap-2.5 sm:gap-3.5">
            <Fraction top={rows[0]} bottom={parts} />
            <span className="text-[30px] font-medium text-nevo-navy sm:text-[40px]">
              +
            </span>
            <Fraction top={rows[1]} bottom={parts} />
            <span className="text-[30px] font-medium text-nevo-navy sm:text-[40px]">
              =
            </span>
            {done ? (
              <span className="motion-safe:animate-nevo-pop">
                <Fraction top={sum} bottom={parts} bold />
              </span>
            ) : (
              <span className="flex size-11 items-center justify-center rounded-[10px] border-2 border-dashed border-nevo-navy/40 text-[30px] font-semibold text-nevo-navy/55 sm:size-[52px] sm:text-[40px]">
                ?
              </span>
            )}
          </div>
        )}
      </div>

      {/* RESPONSE — the one thing the student does, per step */}
      <div className="mt-5">
        {phase === "confirmed" && !isNumericStep(current) && (
          <div className="flex flex-col gap-3.5 motion-safe:animate-nevo-reveal">
            <div className="flex items-center justify-between rounded-[12px] border-2 border-nevo-navy bg-nevo-cream-elevated px-[18px] py-4 text-base font-semibold text-nevo-near-black shadow-elevation-1 sm:text-[18px]">
              <span>{current.choices[current.correct]}</span>
              <span className="flex size-6 shrink-0 items-center justify-center rounded-full bg-nevo-navy">
                <Check className="size-[13px] text-nevo-cream" strokeWidth={2.8} />
              </span>
            </div>
            {current.onCorrect?.confirm && (
              <p className="text-center text-sm leading-[1.6] text-nevo-near-black/70 sm:text-[15px]">
                {current.onCorrect.confirm}
              </p>
            )}
          </div>
        )}

        {done && (
          <p className="text-center text-sm leading-[1.6] text-nevo-near-black/70 motion-safe:animate-nevo-reveal sm:text-[15px]">
            {calculation.completion}
          </p>
        )}

        {isCardStep && (
          <>
            <p className="text-center text-[19px] font-semibold leading-[1.35] text-nevo-near-black sm:text-[22px]">
              {current.prompt}
            </p>
            {showHint && <HintPill text={hintText} />}
            <div
              key={`cards-${attempts}`}
              className={cn(
                "mt-4 flex flex-col gap-2.5",
                attempts > 0 && "motion-safe:animate-nevo-shake",
              )}
            >
              {current.choices.map((choice, i) => (
                <button
                  key={i}
                  type="button"
                  onClick={() => pickCard(i)}
                  className="rounded-[12px] border-2 border-transparent bg-nevo-cream-elevated px-[18px] py-4 text-center text-base font-medium text-nevo-near-black shadow-elevation-1 transition-transform active:scale-[0.98] sm:text-[18px]"
                >
                  {choice}
                </button>
              ))}
            </div>
            {!showHint && <HintLink attempts={attempts} onClick={() => setShowHint(true)} />}
          </>
        )}

        {isFinalStep && (
          <>
            <p className="text-center text-[19px] font-semibold leading-[1.35] text-nevo-near-black sm:text-[22px]">
              {manip ? "Build the total - tap a quarter to drop it in." : current.prompt}
            </p>
            {showHint && <HintPill text={hintText} />}

            {manip ? (
              <ManipulativeTray
                parts={parts}
                sum={sum}
                placed={placed}
                onPlace={placeTile}
              />
            ) : (
              <div className="mt-[18px] flex justify-center">
                <input
                  // A.12: suppress the native OS keyboard on web — the Nevo
                  // Keyboard drives entry on touch; a hardware keyboard still
                  // types normally (desktop), where the on-screen one is hidden.
                  inputMode="none"
                  value={numVal}
                  onChange={(e) => onNumChange(e.target.value)}
                  placeholder="-"
                  aria-label={current.prompt}
                  className="h-[52px] w-[120px] rounded-[10px] border-2 border-nevo-near-black/18 bg-nevo-cream-elevated text-center text-[26px] font-semibold text-nevo-navy shadow-elevation-1 outline-none transition-colors focus:border-nevo-navy"
                />
              </div>
            )}

            {!manip && (
              <NevoKeyboard
                layout="pad"
                onKey={(d) => onNumChange(numVal + d)}
                onBackspace={() => onNumChange(numVal.slice(0, -1))}
                className="fixed inset-x-0 bottom-0 z-40 lg:hidden"
              />
            )}

            {kinestheticAvailable && !manip && (
              <p className="mt-4 text-center">
                <button
                  type="button"
                  onClick={() => setManip(true)}
                  className="cursor-pointer text-[13px] font-medium text-nevo-violet"
                >
                  Want to build it instead?
                </button>
              </p>
            )}
            {!showHint && !manip && (
              <HintLink attempts={attempts} onClick={() => setShowHint(true)} />
            )}
          </>
        )}
      </div>
    </div>
  );
}

/** One scaffold bar: a fraction label + `parts` cells, `filled` of them shaded. */
function BarRow({
  label,
  parts,
  filled,
  strong,
  ring,
}: {
  label: string;
  parts: number;
  filled: number;
  strong: boolean;
  ring: boolean;
}) {
  return (
    <div className="flex items-center gap-3">
      <span
        className={cn(
          "w-[34px] shrink-0 text-sm transition-colors",
          strong ? "font-semibold text-nevo-navy" : "text-nevo-near-black/60",
        )}
      >
        {label}
      </span>
      <div className="flex flex-1 gap-[5px]">
        {Array.from({ length: parts }).map((_, i) => {
          const on = i < filled;
          return (
            <span
              key={i}
              className={cn(
                "h-7 flex-1 rounded-[5px] transition-[background-color,outline-color] duration-200",
                on
                  ? strong
                    ? "bg-nevo-navy"
                    : "bg-nevo-violet"
                  : "border border-nevo-near-black/12 bg-nevo-near-black/[0.08]",
                ring && "outline outline-2 outline-nevo-violet outline-offset-2",
              )}
            />
          );
        })}
      </div>
    </div>
  );
}

/** A stacked numerator/denominator fraction. */
function Fraction({
  top,
  bottom,
  bold,
}: {
  top: number;
  bottom: number;
  bold?: boolean;
}) {
  const weight = bold ? "font-bold" : "font-medium";
  return (
    <span className="flex flex-col items-center text-nevo-navy">
      <span className={cn("text-[30px] leading-none sm:text-[40px]", weight)}>
        {top}
      </span>
      <span className="my-[3px] h-0.5 w-[22px] bg-nevo-navy sm:w-7" />
      <span className={cn("text-[30px] leading-none sm:text-[40px]", weight)}>
        {bottom}
      </span>
    </span>
  );
}

/** The requested/auto-surfaced hint - a calm pill above the response. */
function HintPill({ text }: { text: string }) {
  return (
    <div className="mx-auto mt-4 flex w-max max-w-full items-center gap-2.5 rounded-full bg-nevo-cream-elevated px-[18px] py-2.5 shadow-elevation-1 motion-safe:animate-nevo-reveal">
      <span className="size-[7px] shrink-0 rounded-full bg-nevo-violet" />
      <span className="text-sm leading-[1.4] text-nevo-near-black">{text}</span>
    </div>
  );
}

/** "Need a hint?" - grows to medium weight once the student has missed. */
function HintLink({
  attempts,
  onClick,
}: {
  attempts: number;
  onClick: () => void;
}) {
  return (
    <p className="mt-4 text-center">
      <button
        type="button"
        onClick={onClick}
        className={cn(
          "cursor-pointer text-[13px] text-nevo-violet",
          attempts >= 1 ? "font-medium" : "font-normal",
        )}
      >
        Need a hint?
      </button>
    </p>
  );
}

/** Kinesthetic final step - tap quarter tiles into the total bar until it fills. */
function ManipulativeTray({
  parts,
  sum,
  placed,
  onPlace,
}: {
  parts: number;
  sum: number;
  placed: number;
  onPlace: () => void;
}) {
  const remaining = Math.max(0, sum - placed);
  return (
    <>
      <div className="mt-[18px] rounded-[12px] bg-nevo-cream-elevated p-[18px] shadow-elevation-1 sm:p-6">
        <span className="font-mono text-[10px] tracking-[0.06em] text-nevo-near-black/50 uppercase">
          The total
        </span>
        <div className="mt-3 flex gap-[5px]">
          {Array.from({ length: parts }).map((_, i) => {
            const on = i < placed;
            return (
              <span
                key={i}
                className={cn(
                  "h-[34px] flex-1 rounded-md transition-colors duration-200",
                  on
                    ? "bg-nevo-navy"
                    : "border-2 border-dashed border-nevo-navy/30 bg-nevo-near-black/[0.05]",
                )}
              />
            );
          })}
        </div>
      </div>
      {remaining > 0 && (
        <div className="mt-4 flex items-center justify-center gap-3">
          {Array.from({ length: remaining }).map((_, i) => (
            <button
              key={i}
              type="button"
              onClick={onPlace}
              className="h-[52px] min-w-[72px] cursor-pointer rounded-[12px] border-2 border-nevo-violet bg-nevo-violet/14 text-base font-semibold text-nevo-navy shadow-elevation-1 transition-transform active:scale-[0.98]"
            >
              + {1}/{parts}
            </button>
          ))}
        </div>
      )}
    </>
  );
}

/** Audio narration layer - reads the current step aloud; the text always stays. */
function NarrationBar({ onReplay }: { onReplay?: () => void }) {
  const [playing, setPlaying] = useState(false);
  const [pct, setPct] = useState(0);
  const timer = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => () => {
    if (timer.current) clearInterval(timer.current);
  }, []);

  const toggle = () => {
    if (playing) {
      if (timer.current) clearInterval(timer.current);
      setPlaying(false);
      return;
    }
    if (pct >= 100) onReplay?.();
    setPct((p) => (p >= 100 ? 0 : p));
    setPlaying(true);
    // TODO(audio): play the produced per-step narration asset (17b §9).
    timer.current = setInterval(() => {
      setPct((p) => {
        if (p + 2.2 >= 100) {
          if (timer.current) clearInterval(timer.current);
          setPlaying(false);
          return 0;
        }
        return p + 2.2;
      });
    }, 140);
  };

  const bars = [6, 10, 13, 8, 14, 10, 12, 7, 13, 9, 11, 14, 8, 12, 10, 7, 13, 9, 11, 8];
  const played = pct / 100;

  return (
    <div className="mb-4 flex items-center gap-3 rounded-[12px] bg-nevo-cream-elevated p-2.5 shadow-elevation-1">
      <button
        type="button"
        aria-label={playing ? "Pause narration" : "Play narration"}
        onClick={toggle}
        className="flex size-[42px] shrink-0 cursor-pointer items-center justify-center rounded-full bg-nevo-navy text-nevo-cream transition-transform active:scale-[0.98]"
      >
        {playing ? (
          <Pause className="size-[18px]" fill="currentColor" strokeWidth={0} />
        ) : (
          <Play className="ml-0.5 size-[18px]" fill="currentColor" strokeWidth={0} />
        )}
      </button>
      <div className="flex min-w-0 flex-1 flex-col gap-1.5">
        <div className="flex items-center gap-2">
          <span className="text-[13px] font-semibold text-nevo-near-black">
            Read this step aloud
          </span>
          <span className="font-mono text-[10px] tracking-[0.04em] text-nevo-near-black/50 uppercase">
            · Text stays
          </span>
        </div>
        <div className="flex h-3.5 items-end gap-0.5">
          {bars.map((h, i) => (
            <span
              key={i}
              className="w-[3px] shrink-0 rounded-full bg-nevo-navy transition-opacity duration-150"
              style={{ height: `${h}px`, opacity: (i + 1) / bars.length <= played ? 0.95 : 0.28 }}
            />
          ))}
        </div>
      </div>
    </div>
  );
}
