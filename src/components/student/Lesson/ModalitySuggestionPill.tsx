"use client";

import { useEffect, useRef, useState } from "react";
import { MODALITY, type Modality } from "@/lib/constants";
import { cn } from "@/lib/utils";

/** Opens a beat after the segment settles, so it never competes with the content. */
const OPEN_DELAY_MS = 1500;
/** Then withdraws on its own - an offer, never a demand. */
const DISMISS_AFTER_MS = 5000;
/** The accepted beat: pill fills navy, then the modality switches (frame 17 §C3). */
const ACCEPT_BEAT_MS = 300;

/** Frame copy - one conversational question, tailored to the offered channel. */
const INVITATION: Record<Modality, string> = {
  [MODALITY.TEXT]: "Want to read this one instead?",
  [MODALITY.VISUAL]: "Want to try this as a diagram?",
  [MODALITY.AUDIO]: "Want to try listening to this one?",
  [MODALITY.INTERACTIVE]: "Want to work through this hands-on?",
};

/**
 * The system's one modality suggestion for a segment (Lesson Player frame 17,
 * §C3 component states). Hidden by default - never a control row. One calm pill
 * slides down below the top bar; the **whole pill is the accept target**, with a
 * 44×44 dismiss "×" on its trailing edge (touch-first). Accepting fills the pill
 * navy for ~300ms before the modality switches; dismissing (or the 5s timeout)
 * fades it away. One suggestion per segment, never chained.
 *
 * Renders absolutely inside a relative anchor under the progress line. Mount
 * one per segment (key on the segment id) - the timers run from mount.
 */
export function ModalitySuggestionPill({
  modality,
  onAccept,
  onDismiss,
}: {
  modality: Modality;
  /** Student took the offer - switch to `modality` (fires after the beat). */
  onAccept: () => void;
  /** Declined, or the pill timed out. Either way the offer is spent. */
  onDismiss: () => void;
}) {
  const [open, setOpen] = useState(false);
  const [accepting, setAccepting] = useState(false);

  const hideTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const acceptTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    const show = setTimeout(() => setOpen(true), OPEN_DELAY_MS);
    hideTimer.current = setTimeout(onDismiss, OPEN_DELAY_MS + DISMISS_AFTER_MS);
    return () => {
      clearTimeout(show);
      if (hideTimer.current) clearTimeout(hideTimer.current);
      if (acceptTimer.current) clearTimeout(acceptTimer.current);
    };
  }, [onDismiss]);

  const accept = () => {
    if (accepting) return;
    if (hideTimer.current) clearTimeout(hideTimer.current);
    setAccepting(true);
    acceptTimer.current = setTimeout(onAccept, ACCEPT_BEAT_MS);
  };

  const dismiss = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (hideTimer.current) clearTimeout(hideTimer.current);
    onDismiss();
  };

  if (!open) return null;

  return (
    <div className="pointer-events-none absolute inset-x-0 top-3 z-10 flex justify-center px-4">
      <div
        role="button"
        tabIndex={0}
        onClick={accept}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") {
            e.preventDefault();
            accept();
          }
        }}
        className={cn(
          "pointer-events-auto inline-flex max-w-[290px] cursor-pointer items-center gap-3 rounded-full py-1 pr-2 pl-5 transition-[background-color,box-shadow] duration-300 ease-out outline-none focus-visible:ring-[3px] focus-visible:ring-nevo-navy/35 motion-safe:animate-in motion-safe:fade-in-0 motion-safe:slide-in-from-top-2 motion-safe:duration-200 motion-safe:ease-out",
          accepting
            ? "bg-nevo-navy shadow-[0_8px_24px_rgba(59,63,110,0.28)]"
            : "bg-nevo-cream-elevated shadow-[0_8px_24px_rgba(0,0,0,0.14)]",
        )}
      >
        <span
          className={cn(
            "text-sm leading-[1.4] transition-colors duration-300 ease-out",
            accepting ? "text-nevo-cream" : "text-nevo-near-black",
          )}
        >
          {INVITATION[modality]}
        </span>
        <button
          type="button"
          aria-label="Dismiss"
          onClick={dismiss}
          disabled={accepting}
          className={cn(
            "flex size-11 shrink-0 cursor-pointer items-center justify-center rounded-full transition-opacity duration-200",
            accepting && "pointer-events-none opacity-0",
          )}
        >
          <svg
            width="12"
            height="12"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.4"
            strokeLinecap="round"
            className="text-nevo-near-black/40"
          >
            <line x1="5" y1="5" x2="19" y2="19" />
            <line x1="19" y1="5" x2="5" y2="19" />
          </svg>
        </button>
      </div>
    </div>
  );
}
