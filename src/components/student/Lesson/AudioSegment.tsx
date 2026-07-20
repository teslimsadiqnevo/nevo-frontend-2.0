"use client";

import { useEffect, useRef, useState } from "react";
import { ChevronDown, Pause, Play } from "lucide-react";
import { cn } from "@/lib/utils";
import type { AudioContent } from "@/lib/types";

/** The frame's waveform silhouette — 24 bars, explicit px heights. */
const BAR_HEIGHTS = [
  10, 16, 22, 14, 26, 18, 30, 20, 12, 24, 28, 16, 22, 32, 18, 12, 26, 20, 14,
  28, 22, 16, 10, 24,
];

function clock(sec: number): string {
  const m = Math.floor(sec / 60);
  const s = Math.round(sec % 60);
  return `${m}:${s.toString().padStart(2, "0")}`;
}

/**
 * Audio modality (Lesson Player frame 17) — a narration card with a violet
 * waveform, navy progress line and time, plus a transcript disclosure. Real
 * narration assets are producer-generated (TODO(audio)); until then playback is
 * simulated so the UI shell and signals (replay, transcript open) can be
 * exercised.
 */
export function AudioSegment({ content }: { content: AudioContent }) {
  const duration = content.durationSec ?? 40;
  const [playing, setPlaying] = useState(false);
  const [pct, setPct] = useState(0);
  const [transcriptOpen, setTranscriptOpen] = useState(false);
  const timer = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => () => {
    if (timer.current) clearInterval(timer.current);
  }, []);

  const stop = () => {
    if (timer.current) clearInterval(timer.current);
    timer.current = null;
  };

  const toggle = () => {
    if (playing) {
      stop();
      setPlaying(false);
      return;
    }
    // TODO(audio): play the real narrated clip; drive `pct` from timeupdate.
    setPct((p) => (p >= 100 ? 0 : p));
    setPlaying(true);
    const step = 100 / (duration * 10); // ~10 ticks/sec
    timer.current = setInterval(() => {
      setPct((p) => {
        if (p + step >= 100) {
          stop();
          setPlaying(false);
          return 100;
        }
        return p + step;
      });
    }, 100);
  };

  const played = (pct / 100) * duration;

  return (
    <article>
      {content.heading && (
        <h2 className="text-[22px] font-semibold leading-[1.3] tracking-[-0.01em] text-nevo-near-black sm:text-[26px] lg:text-[28px]">
          {content.heading}
        </h2>
      )}
      {content.intro && (
        <p className="mt-4 text-base leading-[1.6] text-nevo-near-black/82 sm:text-[18px] lg:text-[19px]">
          {content.intro}
        </p>
      )}

      <div className="mt-[22px] flex flex-col gap-[18px] rounded-[12px] bg-nevo-cream-elevated p-[22px] shadow-elevation-1">
        <div className="flex items-center gap-3.5">
          <button
            type="button"
            aria-label={playing ? "Pause" : "Play"}
            onClick={toggle}
            className="flex size-[52px] shrink-0 cursor-pointer items-center justify-center rounded-full bg-nevo-navy text-nevo-cream transition-transform active:scale-[0.98]"
          >
            {playing ? (
              <Pause className="size-5" fill="currentColor" strokeWidth={0} />
            ) : (
              <Play className="ml-0.5 size-5" fill="currentColor" strokeWidth={0} />
            )}
          </button>
          <div className="min-w-0 flex-1">
            {content.title && (
              <p className="text-[15px] font-semibold text-nevo-near-black">
                {content.title}
              </p>
            )}
            <span className="text-[13px] text-nevo-near-black/60">
              {clock(played)} / {clock(duration)}
            </span>
          </div>
        </div>

        {/* Waveform — bottom-aligned violet bars; opacity tracks the played fraction */}
        <div className="flex h-9 items-end gap-[3px]">
          {BAR_HEIGHTS.map((h, i) => {
            const on = (i + 1) / BAR_HEIGHTS.length <= pct / 100;
            return (
              <span
                key={i}
                className="w-1 shrink-0 rounded-full bg-nevo-violet transition-opacity duration-200"
                style={{ height: `${h}px`, opacity: on ? 1 : 0.3 }}
              />
            );
          })}
        </div>

        <div className="h-[5px] w-full overflow-hidden rounded-full bg-nevo-near-black/12">
          <div
            className="h-full rounded-full bg-nevo-navy transition-[width] duration-[180ms] ease-linear"
            style={{ width: `${pct}%` }}
          />
        </div>
      </div>

      {/* Transcript disclosure */}
      <button
        type="button"
        aria-expanded={transcriptOpen}
        onClick={() => setTranscriptOpen((o) => !o)}
        className="mt-3.5 flex cursor-pointer items-center gap-2 text-sm font-medium text-nevo-navy"
      >
        <ChevronDown
          className={cn(
            "size-4 transition-transform duration-[180ms]",
            transcriptOpen && "rotate-180",
          )}
          strokeWidth={2}
        />
        {transcriptOpen ? "Hide transcript" : "Show transcript"}
      </button>
      {transcriptOpen && (
        <div className="mt-3 rounded-[12px] bg-nevo-violet/8 p-[18px]">
          <p className="text-base leading-[1.7] text-nevo-near-black/82 sm:text-[18px] lg:text-[19px]">
            {content.transcript}
          </p>
        </div>
      )}
    </article>
  );
}
