"use client";

import { useState } from "react";
import { Check } from "lucide-react";
import { cn } from "@/lib/utils";
import type { InteractiveContent } from "@/lib/types";

/**
 * Interactive modality (Lesson Player) — work through it: an optional "you'll
 * need" strip, tickable numbered steps, and an outcome card that resolves once
 * every step is done. No score, no right/wrong — just doing.
 */
export function InteractiveSegment({ content }: { content: InteractiveContent }) {
  const [done, setDone] = useState<boolean[]>(() =>
    content.steps.map(() => false),
  );
  const allDone = done.every(Boolean);

  const toggle = (i: number) =>
    setDone((prev) => prev.map((v, idx) => (idx === i ? !v : v)));

  return (
    <article className="motion-safe:animate-nevo-reveal">
      <h2 className="text-[22px] font-semibold leading-[1.3] tracking-[-0.01em] text-nevo-near-black sm:text-[26px] lg:text-[28px]">
        {content.heading}
      </h2>

      {content.needs && content.needs.length > 0 && (
        <div className="mt-4 rounded-[12px] bg-nevo-cream-elevated p-4">
          <p className="font-mono text-[10px] tracking-[0.12em] text-nevo-near-black/45 uppercase">
            You&apos;ll need
          </p>
          <p className="mt-1 text-[15px] text-nevo-near-black">
            {content.needs.join(" · ")}
          </p>
        </div>
      )}

      <ol className="mt-5 flex flex-col gap-2">
        {content.steps.map((step, i) => (
          <li key={i}>
            <button
              type="button"
              aria-pressed={done[i]}
              onClick={() => toggle(i)}
              className={cn(
                "flex w-full cursor-pointer items-center gap-3 rounded-[12px] border-[1.5px] px-4 py-3 text-left transition-colors",
                done[i]
                  ? "border-transparent bg-nevo-violet/15"
                  : "border-nevo-near-black/10 bg-nevo-cream hover:border-nevo-near-black/20",
              )}
            >
              <span
                className={cn(
                  "flex size-6 shrink-0 items-center justify-center rounded-full text-[13px] font-semibold transition-colors",
                  done[i]
                    ? "bg-nevo-navy text-nevo-cream"
                    : "bg-nevo-cream-elevated text-nevo-near-black/60",
                )}
              >
                {done[i] ? <Check className="size-3.5" strokeWidth={2.5} /> : i + 1}
              </span>
              <span className="text-[15px] leading-[1.4] text-nevo-near-black sm:text-base">
                {step}
              </span>
            </button>
          </li>
        ))}
      </ol>

      {/* Outcome — resolves once every step is ticked */}
      <div
        className={cn(
          "mt-5 rounded-[12px] p-4 transition-colors",
          allDone ? "bg-nevo-navy" : "bg-nevo-cream-elevated",
        )}
      >
        <p className="font-mono text-[10px] tracking-[0.12em] uppercase">
          <span className={allDone ? "text-nevo-cream/60" : "text-nevo-near-black/45"}>
            What you should see
          </span>
        </p>
        <p
          className={cn(
            "mt-1 text-[15px] leading-[1.5]",
            allDone ? "text-nevo-cream" : "text-nevo-near-black",
          )}
        >
          {allDone ? content.outcome.done : content.outcome.pending}
        </p>
      </div>
    </article>
  );
}
