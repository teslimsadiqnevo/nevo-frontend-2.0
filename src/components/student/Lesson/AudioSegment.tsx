"use client";

import { useEffect, useRef, useState } from "react";
import { ChevronDown, Pause, Play } from "lucide-react";
import { cn } from "@/lib/utils";
import type { AudioContent } from "@/lib/types";

const BARS = 24;

function clock(sec: number): string {
  const m = Math.floor(sec / 60);
  const s = Math.round(sec % 60);
  return `${m}:${s.toString().padStart(2, "0")}`;
}

/**
 * Audio modality (Lesson Player) — a narration player with a waveform, progress
 * and time, plus a Show/Hide transcript disclosure. Real narration assets are
 * producer-generated (TODO(audio)); until then playback is simulated so the UI
 * shell and signals (replay, transcript open) can be exercised.
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
    <article className="motion-safe:animate-nevo-reveal">
      <div className="rounded-[12px] bg-nevo-cream-elevated p-5 shadow-elevation-1">
        <div className="flex items-center gap-4">
          <button
            type="button"
            aria-label={playing ? "Pause" : "Play"}
            onClick={toggle}
            className="flex size-13 shrink-0 cursor-pointer items-center justify-center rounded-full bg-nevo-navy text-nevo-cream shadow-[0_4px_14px_rgba(59,63,110,0.28)] transition-transform active:scale-95"
          >
            {playing ? (
              <Pause className="size-5" fill="currentColor" strokeWidth={0} />
            ) : (
              <Play className="ml-0.5 size-5" fill="currentColor" strokeWidth={0} />
            )}
          </button>

          {/* Waveform — bar opacity reflects the played fraction */}
          <div className="flex h-9 flex-1 items-center gap-[3px]">
            {Array.from({ length: BARS }).map((_, i) => {
              const on = i / BARS <= pct / 100;
              const h = 30 + ((i * 7) % 11) * 6; // deterministic, varied
              return (
                <span
                  key={i}
                  className="w-full rounded-full bg-nevo-violet transition-opacity"
                  style={{ height: `${h}%`, opacity: on ? 1 : 0.35 }}
                />
              );
            })}
          </div>
        </div>

        {/* Progress + time */}
        <div className="mt-4 h-1 w-full overflow-hidden rounded-full bg-nevo-navy/12">
          <div
            className="h-full rounded-full bg-nevo-violet"
            style={{ width: `${pct}%` }}
          />
        </div>
        <div className="mt-1.5 flex justify-between font-mono text-[11px] text-nevo-near-black/55">
          <span>{clock(played)}</span>
          <span>{clock(duration)}</span>
        </div>
      </div>

      {/* Transcript disclosure */}
      <button
        type="button"
        aria-expanded={transcriptOpen}
        onClick={() => setTranscriptOpen((o) => !o)}
        className="mt-4 flex cursor-pointer items-center gap-1.5 text-[15px] font-medium text-nevo-navy"
      >
        {transcriptOpen ? "Hide transcript" : "Show transcript"}
        <ChevronDown
          className={cn(
            "size-4 transition-transform",
            transcriptOpen && "rotate-180",
          )}
          strokeWidth={2}
        />
      </button>
      {transcriptOpen && (
        <p className="mt-3 text-base leading-[1.65] text-nevo-near-black/80 motion-safe:animate-nevo-reveal sm:text-[17px]">
          {content.transcript}
        </p>
      )}
    </article>
  );
}
