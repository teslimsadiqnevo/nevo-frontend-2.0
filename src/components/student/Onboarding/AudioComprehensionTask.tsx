"use client";

import { useEffect, useRef, useState } from "react";
import { Book, Globe, Leaf, Play, RotateCcw, type LucideIcon } from "lucide-react";
import { cn, now } from "@/lib/utils";
import { IllustrationWrapper } from "@/components/shared";
import { ONBOARDING_SIGNAL_TYPES } from "@/lib/constants";
import type { TrackEvent } from "@/hooks";
import { SequenceShell } from "./SequenceShell";

// Simple, text-free answer images (audio-visual matching, no labels).
const OPTIONS: { id: string; Icon: LucideIcon }[] = [
  { id: "book", Icon: Book },
  { id: "ball", Icon: Globe },
  { id: "leaf", Icon: Leaf },
];

const BAR_COUNT = 7;

/**
 * Activity 2 — Audio Comprehension Moment (UI/UX spec). A short narrated clip
 * with a calm listening illustration + waveform, then text-free answer options.
 * The audio is the instruction (no prompt). No correction is ever shown.
 * Generates the audio-channel-preference signal.
 */
export function AudioComprehensionTask({
  onComplete,
  track,
}: {
  onComplete?: () => void;
  track?: TrackEvent;
}) {
  const [phase, setPhase] = useState<"pre" | "playing" | "post">("pre");
  const [selected, setSelected] = useState<string | null>(null);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const onCompleteRef = useRef(onComplete);
  const trackRef = useRef(track);
  const startedAt = useRef(0);
  const plays = useRef(0);
  useEffect(() => {
    onCompleteRef.current = onComplete;
    trackRef.current = track;
  }, [onComplete, track]);
  useEffect(() => {
    startedAt.current = now();
    trackRef.current?.(ONBOARDING_SIGNAL_TYPES.ACTIVITY_START, {
      activity: "audio_comprehension",
    });
    return () => {
      if (timer.current) clearTimeout(timer.current);
    };
  }, []);

  const play = () => {
    if (timer.current) clearTimeout(timer.current);
    plays.current += 1;
    setSelected(null);
    setPhase("playing");
    // TODO(audio): play the real narrated clip; reveal options on `ended`.
    timer.current = setTimeout(() => setPhase("post"), 2600);
  };

  const pick = (id: string) => {
    setSelected(id);
    // The audio channel signal: what they chose, how many replays, response time.
    trackRef.current?.(ONBOARDING_SIGNAL_TYPES.AUDIO_RESPONSE, {
      choice: id,
      replays: Math.max(0, plays.current - 1),
      responseMs: now() - startedAt.current,
    });
    trackRef.current?.(ONBOARDING_SIGNAL_TYPES.ACTIVITY_COMPLETE, {
      activity: "audio_comprehension",
      totalMs: now() - startedAt.current,
    });
    window.setTimeout(() => onCompleteRef.current?.(), 700);
  };

  const playing = phase === "playing";
  const canReplay = phase !== "pre";

  return (
    <SequenceShell filledDots={2}>
      <div className="flex min-h-0 flex-1 flex-col">
        <div className="flex flex-1 flex-col items-center justify-center">
          <IllustrationWrapper
            src="/illustrations/activity-audio.png"
            alt="A figure listening"
            width={672}
            height={753}
            priority
            motion={playing ? "breathe" : "none"}
            className="w-[150px]"
          />

          {/* Waveform — animates while playing, calm otherwise */}
          <div className="mt-5 flex h-9 items-end gap-[5px]">
            {Array.from({ length: BAR_COUNT }).map((_, i) => (
              <span
                key={i}
                className="w-1 rounded-full bg-nevo-violet"
                style={
                  playing
                    ? {
                        height: 36,
                        transformOrigin: "bottom",
                        animation: `nevo-bar ${620 + i * 40}ms ease-in-out infinite`,
                        animationDelay: `${i * 70}ms`,
                      }
                    : {
                        height: 36,
                        transformOrigin: "bottom",
                        transform: "scaleY(0.28)",
                        opacity: 0.5,
                      }
                }
              />
            ))}
          </div>

          {/* Controls: replay · play · spacer (for symmetry) */}
          <div className="mt-5 flex items-center gap-5">
            <button
              type="button"
              aria-label="Replay"
              disabled={!canReplay}
              onClick={play}
              className={cn(
                "flex size-11 items-center justify-center rounded-full transition-colors",
                canReplay
                  ? "cursor-pointer text-nevo-navy hover:bg-nevo-navy/6"
                  : "cursor-not-allowed text-nevo-near-black/30",
              )}
            >
              <RotateCcw className="size-[22px]" strokeWidth={2} />
            </button>

            <button
              type="button"
              aria-label={playing ? "Playing" : "Play"}
              onClick={play}
              className="flex size-20 cursor-pointer items-center justify-center rounded-full bg-nevo-navy shadow-[0_6px_20px_rgba(59,63,110,0.3)] transition-transform active:scale-95"
            >
              <Play
                className="ml-1 size-7 text-nevo-cream"
                fill="currentColor"
                strokeWidth={0}
              />
            </button>

            <span className="size-11" aria-hidden />
          </div>
        </div>

        {/* Answer options — appear after the clip finishes */}
        <div className="flex min-h-[150px] shrink-0 items-start justify-center gap-3.5 pb-6">
          {phase === "post" &&
            OPTIONS.map((o, i) => {
              const OptionIcon = o.Icon;
              return (
                <button
                  key={o.id}
                  type="button"
                  aria-label={`Answer ${o.id}`}
                  onClick={() => pick(o.id)}
                  className={cn(
                    "flex size-24 cursor-pointer items-center justify-center rounded-[12px] border-2 bg-nevo-cream-elevated text-nevo-navy shadow-elevation-1 motion-safe:animate-in motion-safe:fade-in motion-safe:slide-in-from-bottom-2 motion-safe:duration-300",
                    selected === o.id ? "border-nevo-navy" : "border-transparent",
                  )}
                  style={{ animationDelay: `${i * 100}ms` }}
                >
                  <OptionIcon className="size-11" strokeWidth={2} />
                </button>
              );
            })}
        </div>
      </div>
    </SequenceShell>
  );
}
