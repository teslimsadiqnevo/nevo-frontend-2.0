"use client";

import { useEffect, useState } from "react";
import { DENSITY, type Density } from "@/lib/constants";
import type { TextContent } from "@/lib/types";
import { cn } from "@/lib/utils";

/** Attention pause: the continue control surfaces after this hold - no countdown. */
const PAUSE_REVEAL_MS = 4_000;

/**
 * Text modality (Lesson Player frame 17). One heading + a body that reshapes
 * with the active reading density — the SAME segment, not new content. Simplify
 * strips to the fewest words (+ "IN SHORT" callout); Expand adds depth, key-term
 * chips and the "WORD EQUATION" callout; Slower breaks the idea into small
 * numbered step cards under a lead line.
 *
 * UDL accommodations (37c) adjust delivery, never diagnose:
 * - `reading`: the body sits on a softer card, larger and airier (18px,
 *   line-height 2, +0.02em letter-spacing, 95% opacity).
 * - `attention`: multi-sentence bodies become short tap-to-continue parts with
 *   a calm breathing pause between them - no timer pressure anywhere.
 */
export function TextSegment({
  content,
  density,
  reading = false,
  attention = false,
}: {
  content: TextContent;
  density: Density | null;
  reading?: boolean;
  attention?: boolean;
}) {
  const body = (density && content.body[density]) ?? content.body.default;
  const callout = content.callouts?.[density ?? "default"];
  const steps = density === DENSITY.SLOWER ? content.slowerSteps : undefined;
  const keyTerms = density === DENSITY.EXPAND ? content.keyTerms : undefined;

  const bodyType = cn(
    reading
      ? "text-[18px] leading-[2] tracking-[0.02em] text-nevo-near-black/95"
      : "text-base leading-[1.75] text-nevo-near-black/82 sm:text-[18px] lg:text-[19px]",
  );

  const bodyBlock = attention ? (
    <AttentionChunkedBody key={body} body={body} className={bodyType} reading={reading} />
  ) : (
    <p className={cn("mt-4", bodyType, reading && "rounded-[12px] bg-[#e5dfd3] px-5 py-4")}>
      {body}
    </p>
  );

  return (
    <article>
      <h2 className="text-[22px] font-semibold leading-[1.3] tracking-[-0.01em] text-nevo-near-black sm:text-[26px] lg:text-[28px]">
        {content.heading}
      </h2>

      {bodyBlock}

      {steps && steps.length > 0 && (
        <div className="mt-5 flex flex-col gap-3">
          {steps.map((step, i) => (
            <div
              key={i}
              className="flex items-start gap-3.5 rounded-[12px] bg-nevo-cream-elevated px-4.5 py-4 shadow-elevation-1"
            >
              <span className="flex size-[26px] shrink-0 items-center justify-center rounded-full bg-nevo-navy text-sm font-semibold text-nevo-cream">
                {i + 1}
              </span>
              <p className="text-base leading-[1.6] text-nevo-near-black/82 sm:text-[18px] lg:text-[19px]">
                {step}
              </p>
            </div>
          ))}
        </div>
      )}

      {keyTerms && keyTerms.length > 0 && (
        <div className="mt-5 flex flex-wrap gap-2">
          {keyTerms.map((term) => (
            <span
              key={term}
              className="rounded-full bg-nevo-violet/18 px-3 py-1.5 text-[13px] font-medium text-nevo-navy"
            >
              {term}
            </span>
          ))}
        </div>
      )}

      {callout && (
        <div className="mt-[22px] rounded-[12px] bg-nevo-violet/8 p-5">
          <p className="font-mono text-[11px] tracking-[0.06em] text-nevo-navy uppercase">
            {callout.label}
          </p>
          <p className="mt-2.5 text-base leading-[1.7] font-medium text-nevo-near-black sm:text-[18px] lg:text-[19px]">
            {callout.text}
          </p>
          {callout.sub && (
            <p className="mt-1.5 text-[13px] leading-[1.6] text-nevo-near-black/60">
              {callout.sub}
            </p>
          )}
        </div>
      )}
    </article>
  );
}

/** Split into sentences, grouped into at most three short parts. */
function chunk(body: string): string[] {
  const sentences = body.split(/(?<=[.!?])\s+/).filter(Boolean);
  if (sentences.length < 2) return [body];
  const parts = Math.min(3, sentences.length);
  const per = Math.ceil(sentences.length / parts);
  const out: string[] = [];
  for (let i = 0; i < sentences.length; i += per)
    out.push(sentences.slice(i, i + per).join(" "));
  return out;
}

/**
 * The attention accommodation's chunked reading flow (37c): one short part at
 * a time behind a "Tap to continue", with the calm 4-second breathing pause
 * between parts. The continue control simply surfaces when the pause is over -
 * never a countdown, never pressure.
 */
function AttentionChunkedBody({
  body,
  className,
  reading,
}: {
  body: string;
  className: string;
  reading: boolean;
}) {
  const parts = chunk(body);
  const [part, setPart] = useState(0);
  const [pausing, setPausing] = useState(false);
  const [pauseReady, setPauseReady] = useState(false);

  useEffect(() => {
    if (!pausing) return;
    const t = setTimeout(() => setPauseReady(true), PAUSE_REVEAL_MS);
    return () => clearTimeout(t);
  }, [pausing]);

  if (parts.length === 1) {
    return (
      <p className={cn("mt-4", className, reading && "rounded-[12px] bg-[#e5dfd3] px-5 py-4")}>
        {body}
      </p>
    );
  }

  if (pausing) {
    return (
      <div className="mt-6 flex flex-col items-center py-10 text-center motion-safe:animate-in motion-safe:fade-in-0 motion-safe:duration-500">
        <p className="text-[17px] text-nevo-near-black/82">
          Take a breath. Ready when you are.
        </p>
        <button
          type="button"
          onClick={() => {
            setPausing(false);
            setPauseReady(false);
            setPart((p) => p + 1);
          }}
          className={cn(
            "mt-7 flex h-12 cursor-pointer items-center justify-center rounded-[10px] bg-nevo-navy px-8 text-[15px] font-medium text-nevo-cream transition-opacity duration-500",
            pauseReady ? "opacity-100" : "pointer-events-none opacity-0",
          )}
        >
          Continue
        </button>
      </div>
    );
  }

  const last = part === parts.length - 1;
  return (
    <div className="mt-4">
      <span className="font-mono text-[10px] font-semibold tracking-[0.08em] text-nevo-near-black/40 uppercase">
        Part {part + 1} of {parts.length}
      </span>
      <p
        key={part}
        className={cn(
          "mt-2",
          className,
          reading && "rounded-[12px] bg-[#e5dfd3] px-5 py-4",
          "motion-safe:animate-in motion-safe:fade-in-0 motion-safe:duration-300",
        )}
      >
        {parts[part]}
      </p>
      {!last && (
        <button
          type="button"
          onClick={() => setPausing(true)}
          className="mt-5 flex h-11 w-full cursor-pointer items-center justify-center rounded-[10px] bg-nevo-navy/8 px-5 text-[14px] font-medium text-nevo-navy transition-colors hover:bg-nevo-navy/12 active:scale-[0.99]"
        >
          Tap to continue
        </button>
      )}
    </div>
  );
}
