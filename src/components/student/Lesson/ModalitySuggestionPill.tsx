"use client";

import { useEffect, useState } from "react";
import { MODALITY, type Modality } from "@/lib/constants";

/** Opens a beat after the segment settles, so it never competes with the content. */
const OPEN_DELAY_MS = 1500;
/** Then withdraws on its own — an offer, never a demand. */
const DISMISS_AFTER_MS = 5000;

/** Frame copy — one conversational question, tailored to the offered channel. */
const INVITATION: Record<Modality, string> = {
  [MODALITY.TEXT]: "Want to read this one instead?",
  [MODALITY.VISUAL]: "Want to try this as a diagram?",
  [MODALITY.AUDIO]: "Want to try listening to this one?",
  [MODALITY.INTERACTIVE]: "Want to work through this hands-on?",
};

/**
 * The system's one modality suggestion for a segment (Lesson Player frame 17).
 * Hidden by default — never a control row. One small calm pill slides down
 * below the top bar (200ms) with two quiet text replies: "Sure" switches the
 * modality, "Not now" dismisses. Auto-dismisses after 5s if ignored; one
 * suggestion per segment, never chained.
 *
 * Renders absolutely inside a relative anchor under the progress line. Mount
 * one per segment (key on the segment id) — the timers run from mount.
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
    <div className="pointer-events-none absolute inset-x-0 top-3 z-10 flex justify-center px-4">
      <div
        role="status"
        className="pointer-events-auto inline-flex max-w-[290px] items-center gap-3.5 rounded-full bg-nevo-cream-elevated py-[9px] pr-2.5 pl-[18px] shadow-[0_8px_24px_rgba(0,0,0,0.14)] motion-safe:animate-in motion-safe:fade-in-0 motion-safe:slide-in-from-top-2 motion-safe:duration-200 motion-safe:ease-out"
      >
        <span className="text-sm leading-[1.4] text-nevo-near-black">
          {INVITATION[modality]}
        </span>
        <span className="flex shrink-0 items-center gap-4">
          <button
            type="button"
            onClick={onAccept}
            className="cursor-pointer py-0.5 text-sm font-medium text-nevo-navy transition-transform active:scale-[0.98]"
          >
            Sure
          </button>
          <button
            type="button"
            onClick={onDismiss}
            className="cursor-pointer py-0.5 text-sm text-nevo-near-black/50 transition-transform active:scale-[0.98]"
          >
            Not now
          </button>
        </span>
      </div>
    </div>
  );
}
