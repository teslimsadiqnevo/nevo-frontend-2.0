"use client";

import { useEffect, useState } from "react";
import { Sparkles, X } from "lucide-react";
import { MODALITY, type Modality } from "@/lib/constants";

/** Opens a beat after the segment settles, so it never competes with the content. */
const OPEN_DELAY_MS = 1500;
/** Then withdraws on its own — an offer, never a demand. */
const DISMISS_AFTER_MS = 5000;

const INVITATION: Record<Modality, string> = {
  [MODALITY.TEXT]: "Want to read this instead?",
  [MODALITY.VISUAL]: "Want to see this as a picture?",
  [MODALITY.AUDIO]: "Want to listen instead?",
  [MODALITY.INTERACTIVE]: "Want to try this yourself?",
};

/**
 * The system's one modality suggestion for a segment (Lesson Player B.7). Nevo
 * offers another way in; it never switches on the student's behalf and never
 * chains a second suggestion. Violet + sparkle marks it as system-originated,
 * matching the Adaptive Toggle Bar's `system` look.
 *
 * Mount one per segment (key on the segment id) — the timers run from mount.
 */
export function ModalitySuggestionPill({
  modality,
  onAccept,
  onDismiss,
}: {
  modality: Modality;
  /** Student took the offer — switch to `modality`. */
  onAccept: () => void;
  /** Declined, or the pill timed out. Either way the offer is spent. */
  onDismiss: () => void;
}) {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const show = setTimeout(() => setOpen(true), OPEN_DELAY_MS);
    const hide = setTimeout(onDismiss, OPEN_DELAY_MS + DISMISS_AFTER_MS);
    return () => {
      clearTimeout(show);
      clearTimeout(hide);
    };
  }, [onDismiss]);

  if (!open) return null;

  return (
    <div className="pointer-events-none fixed inset-x-0 bottom-24 z-20 flex justify-center px-4">
      <div
        role="status"
        className="pointer-events-auto flex items-center gap-1 rounded-full bg-nevo-cream-elevated py-1.5 pr-1.5 pl-4 shadow-elevation-2 motion-safe:animate-nevo-reveal"
      >
        <Sparkles
          className="size-4 shrink-0 text-nevo-violet"
          fill="currentColor"
          strokeWidth={0}
        />
        <p className="px-2 text-[15px] font-medium text-nevo-near-black">
          {INVITATION[modality]}
        </p>
        <button
          type="button"
          onClick={onAccept}
          className="cursor-pointer rounded-full bg-nevo-navy px-4 py-2 text-[15px] font-medium text-nevo-cream transition-[filter] hover:brightness-110"
        >
          Yes
        </button>
        <button
          type="button"
          aria-label="No thanks"
          onClick={onDismiss}
          className="flex size-9 cursor-pointer items-center justify-center rounded-full text-nevo-near-black/50 transition-colors hover:bg-nevo-near-black/[0.06]"
        >
          <X className="size-4" strokeWidth={2} />
        </button>
      </div>
    </div>
  );
}
