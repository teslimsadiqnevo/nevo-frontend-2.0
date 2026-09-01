"use client";

import { ArrowRight } from "lucide-react";
import { cn } from "@/lib/utils";
import type { AgeBand } from "@/lib/profiling/bands";
import type { BaselineCapture } from "@/lib/profiling/capture";
import { AvatarBubble, ProfilingShell } from "./ProfilingShell";
import { SettleBadge } from "./GridSpanModule";
import { useTrialRunner } from "./useTrialRunner";

/**
 * Module 2 - Pattern Match + Arrow Flanker (BP-M2: processing speed and
 * attention). 2A: two icons, tap Same or Different as fast as feels right.
 * 2B: tap the direction of the CENTRE arrow, ignoring the flankers. No timer,
 * no score, no right/wrong - a tapped control presses soft-violet and the next
 * trial loads. Icons are navy shapes only (the four-colour system forbids other
 * hues; pairs differ by shape, never colour); the SS band's flankers go violet
 * to sharpen the interference.
 */

/** Band icon pairs for 2A (frame's sets, navy with cream detail). */
const PAIR_ICONS: Record<AgeBand, [string, string]> = {
  p13: [
    '<svg viewBox="0 0 24 24" fill="currentColor"><path d="M12 2l2.9 6.3 6.9.7-5.2 4.6 1.5 6.8L12 17.8 5.9 21.4l1.5-6.8L2.2 9l6.9-.7z"/></svg>',
    '<svg viewBox="0 0 24 24" fill="currentColor"><path d="M2 12c4-6 12-6 16 0-4 6-12 6-16 0z"/><path d="M18 12l4-3v6z"/><circle cx="7" cy="11" r="1.3" fill="#f7f1e6"/></svg>',
  ],
  p46: [
    '<svg viewBox="0 0 24 24" fill="currentColor"><circle cx="12" cy="12" r="9"/></svg>',
    '<svg viewBox="0 0 24 24" fill="currentColor"><path d="M12 3l9 16H3z"/></svg>',
  ],
  jss: [
    '<svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="9" fill="none" stroke="currentColor" stroke-width="2"/><path d="M6 12l6-6M8 16l8-8M12 18l6-6" stroke="currentColor" stroke-width="1.2"/></svg>',
    '<svg viewBox="0 0 24 24"><path d="M12 3l9 16H3z" fill="none" stroke="currentColor" stroke-width="2"/><circle cx="12" cy="10" r="1" fill="currentColor"/><circle cx="10" cy="14.5" r="1" fill="currentColor"/><circle cx="14" cy="14.5" r="1" fill="currentColor"/></svg>',
  ],
  ss: [
    '<svg viewBox="0 0 24 24"><rect x="3" y="3" width="18" height="18" rx="3" fill="none" stroke="currentColor" stroke-width="1.6"/><path d="M8 12h8M13 9l3 3-3 3" fill="none" stroke="currentColor" stroke-width="1.6"/><circle cx="7" cy="7" r="1.2" fill="currentColor"/></svg>',
    '<svg viewBox="0 0 24 24"><rect x="3" y="3" width="18" height="18" rx="3" fill="none" stroke="currentColor" stroke-width="1.6"/><path d="M16 12H8M11 9l-3 3 3 3" fill="none" stroke="currentColor" stroke-width="1.6"/><circle cx="17" cy="7" r="1.2" fill="currentColor"/></svg>',
  ],
};

/** 2A trial script (same/different), 2B trial script (flanker congruency). */
const PATTERN_TRIALS: { same: boolean }[] = [{ same: false }, { same: true }, { same: false }];
const FLANKER_TRIALS: ("congruent" | "incongruent" | "neutral")[] = [
  "congruent",
  "incongruent",
  "incongruent",
];

export function PatternFlankerModule({
  band,
  capture,
  onComplete,
}: {
  band: AgeBand;
  capture?: BaselineCapture;
  onComplete: () => void;
}) {
  const { act, trial, picked, settling, pick } = useTrialRunner({
    module: "pattern_flanker",
    counts: [
      ["pattern", PATTERN_TRIALS.length],
      ["flanker", FLANKER_TRIALS.length],
    ],
    capture,
    onComplete,
  });

  const icons = PAIR_ICONS[band] ?? PAIR_ICONS.p46;
  const patternTrial = PATTERN_TRIALS[Math.min(trial, PATTERN_TRIALS.length - 1)];
  const flankerTrial = FLANKER_TRIALS[Math.min(trial, FLANKER_TRIALS.length - 1)];
  const flankRotate =
    flankerTrial === "incongruent" ? 180 : flankerTrial === "neutral" ? -90 : 0;
  const flankViolet = band === "ss";
  const singleArrow = band === "p13";

  return (
    <ProfilingShell filled={settling ? 2 : 1} active={settling ? -1 : 1}>
      {!settling && (
        <AvatarBubble
          text={
            act === "pattern"
              ? "Same, or different?"
              : "Which way is the middle arrow pointing?"
          }
        />
      )}

      <div className="flex min-h-0 w-full flex-1 flex-col items-center justify-center gap-8 sm:gap-11">
        {settling ? (
          <SettleBadge />
        ) : act === "pattern" ? (
          <>
            <div className="flex flex-col items-center justify-center gap-3.5 sm:flex-row sm:gap-8">
              {[icons[0], patternTrial.same ? icons[0] : icons[1]].map((svg, i) => (
                <div
                  key={`${trial}-${i}`}
                  className="flex h-[150px] w-[300px] items-center justify-center rounded-[12px] border-2 border-nevo-navy bg-nevo-cream sm:size-[180px]"
                >
                  <div
                    className="size-[72px] text-nevo-navy sm:size-[100px]"
                    dangerouslySetInnerHTML={{ __html: svg }}
                  />
                </div>
              ))}
            </div>
            <div className="flex w-full max-w-[300px] flex-col gap-3.5 sm:w-auto sm:max-w-none sm:flex-row">
              <TrialButton label="Same" pressed={picked === 0} onClick={() =>
                  pick(0, {
                    pair: patternTrial.same ? "same" : "different",
                    // Derivable here and nowhere downstream: "Same" is right
                    // when the pair IS the same. The reducer had only speed.
                    correct: patternTrial.same === true,
                  })
                } />
              <TrialButton label="Different" pressed={picked === 1} onClick={() =>
                  pick(1, {
                    pair: patternTrial.same ? "same" : "different",
                    correct: patternTrial.same === false,
                  })
                } />
            </div>
          </>
        ) : (
          <>
            <div className="flex items-center justify-center gap-3 sm:gap-4">
              {(singleArrow ? [2] : [0, 1, 2, 3, 4]).map((pos) => {
                const central = pos === 2;
                return (
                  <ArrowRight
                    key={`${trial}-${pos}`}
                    strokeWidth={central ? 3 : 2.6}
                    className={cn(
                      central
                        ? "size-[50px] text-nevo-navy sm:size-[50px]"
                        : cn(
                            "size-[34px]",
                            flankViolet ? "text-nevo-violet" : "text-nevo-near-black/40",
                          ),
                    )}
                    style={central ? undefined : { transform: `rotate(${flankRotate}deg)` }}
                  />
                );
              })}
            </div>
            <div className="flex w-full max-w-[300px] flex-col gap-4 sm:w-auto sm:max-w-none sm:flex-row">
              <TrialButton
                icon={<ArrowRight className="size-9 rotate-180 text-nevo-navy" strokeWidth={2.6} />}
                label="Left"
                iconOnly
                pressed={picked === 0}
                onClick={() => pick(0, { congruency: flankerTrial })}
              />
              <TrialButton
                icon={<ArrowRight className="size-9 text-nevo-navy" strokeWidth={2.6} />}
                label="Right"
                iconOnly
                pressed={picked === 1}
                onClick={() => pick(1, { congruency: flankerTrial })}
              />
            </div>
          </>
        )}
      </div>
    </ProfilingShell>
  );
}

export function TrialButton({
  label,
  icon,
  iconOnly = false,
  pressed,
  onClick,
  soft = false,
}: {
  label: string;
  icon?: React.ReactNode;
  iconOnly?: boolean;
  pressed: boolean;
  onClick: () => void;
  soft?: boolean;
}) {
  return (
    <button
      type="button"
      aria-label={iconOnly ? label : undefined}
      onClick={onClick}
      className={cn(
        "flex h-14 min-w-[150px] cursor-pointer items-center justify-center rounded-[10px] border-2 transition-[background-color,transform] active:scale-[0.97] sm:w-[180px]",
        soft ? "text-sm font-medium" : "text-base font-semibold",
        pressed
          ? "border-nevo-violet bg-nevo-violet text-nevo-near-black"
          : soft
            ? "border-nevo-violet bg-nevo-cream text-nevo-violet"
            : "border-nevo-navy bg-nevo-cream text-nevo-navy",
      )}
    >
      {icon ?? label}
    </button>
  );
}
