"use client";

import { useState } from "react";
import { ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";

/**
 * Affective-state UI pieces (37b, Intelligence Layer). Not new screens - small
 * modulations the player composes onto the segment it is already showing while
 * an inferred state holds. Nothing here labels the student; every piece reads
 * as the lesson being helpful, not the system diagnosing.
 */

/** Boredom: the escalation offer above the content. TODO(api): acceptance asks
 *  the backend for a step up; until then the tap simply spends the offer. */
export function BoredomOfferPill({ onSpent }: { onSpent: () => void }) {
  return (
    <div className="mb-4 flex justify-center">
      <button
        type="button"
        onClick={onSpent}
        className="inline-flex h-11 cursor-pointer items-center rounded-[22px] border-[1.5px] border-nevo-violet/50 bg-nevo-cream-elevated px-[18px] text-[13px] font-medium text-nevo-navy transition-transform active:scale-[0.98]"
      >
        Ready for something harder?
      </button>
    </div>
  );
}

/**
 * Confusion: "Which part is unclear?" opens the Socratic panel - 2-3 guided
 * questions that think the idea through rather than handing the answer over.
 * The panel never blocks (no scrim) and carries its own visible 44px dismiss.
 */
export function ConfusionSupport({ prompts }: { prompts: string[] }) {
  const [open, setOpen] = useState(false);

  return (
    <>
      <div className="mb-4 flex justify-center">
        <button
          type="button"
          aria-expanded={open}
          onClick={() => setOpen(true)}
          className="inline-flex h-11 cursor-pointer items-center rounded-[22px] bg-nevo-cream-elevated px-[18px] text-[13px] text-nevo-near-black transition-transform active:scale-[0.98]"
        >
          Which part is unclear?
        </button>
      </div>
      {open && (
        <div className="fixed inset-x-0 bottom-0 z-30 rounded-t-[16px] bg-[#e5dfd3] px-[22px] pt-2 pb-[22px] shadow-[0_-8px_28px_rgba(43,43,47,0.14)] motion-safe:animate-in motion-safe:slide-in-from-bottom-4 motion-safe:duration-300 motion-safe:ease-nevo-slide">
          <div className="mx-auto w-full max-w-[560px]">
            <div className="flex items-center justify-between">
              <span className="text-[15px] font-semibold text-nevo-near-black">
                Let&apos;s think it through
              </span>
              <button
                type="button"
                aria-label="Close"
                onClick={() => setOpen(false)}
                className="-mr-2 flex size-11 cursor-pointer items-center justify-center rounded-full text-nevo-navy transition-colors hover:bg-nevo-navy/8"
              >
                <ChevronDown className="size-5" strokeWidth={2.2} />
              </button>
            </div>
            {/* Guided questions - 40px+ rows. Design specifies them as targets;
                what a tap leads to is undefined until Ask Nevo integration, so
                they read as prompts for now. */}
            <div className="mt-2 flex flex-col gap-2.5">
              {prompts.map((prompt) => (
                <div
                  key={prompt}
                  className="flex min-h-10 items-center rounded-[10px] bg-nevo-cream px-4 py-2 text-[13.5px] leading-[1.45] text-nevo-near-black"
                >
                  {prompt}
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </>
  );
}

/** Frustration: the unrequested hint - a calm card, never an alarm. */
export function FrustrationHint({ hint }: { hint: string }) {
  return (
    <div className="mt-4 rounded-[8px] border-l-[3px] border-nevo-violet bg-[#e5dfd3] p-4">
      <p className="text-[14px] leading-[1.55] text-nevo-near-black sm:text-[15px]">
        {hint}
      </p>
    </div>
  );
}

/** Anxiety helper: the dim treatment for secondary chrome (40%, 400ms). */
export function affectDim(anxious: boolean): string {
  return cn(
    "transition-opacity duration-[400ms]",
    anxious && "opacity-40",
  );
}
