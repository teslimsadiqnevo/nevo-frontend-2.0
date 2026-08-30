"use client";

import { useEffect, useRef, useState } from "react";
import { cn } from "@/lib/utils";

/**
 * Share Feedback (SCRUM-68 · `Nevo Feedback`, role=teacher) - the teacher half
 * of the shared feedback component. The frame calls it a right-docked panel
 * over dimmed content, not a screen; the student half is a full screen because
 * that role is phone-first.
 *
 * Teacher differs from student in two ways the frame sets out: the two type
 * pills are shown (students get no feature requests, and are told why), and the
 * textarea starts taller at 120px.
 *
 * The success check reuses `animate-nevo-pop` rather than the frame's own
 * fbPop, which is a shade slower and starts a shade larger. Every other success
 * check in the product - the one on Set Password most of all - already uses
 * nevo-pop, and two success moments popping differently would read worse than
 * the divergence. Flagged to design.
 *
 * TODO(api): `POST /api/v1/feedback` IS deployed - it is one of the seven
 * endpoints still returning an untyped ack - but this panel is not wired to
 * it yet, so `send` resolves locally, and
 * nothing is transmitted. TODO(design): the sent state both auto-closes at
 * ~1.5s and draws an "Open again" button, which leaves that button barely
 * reachable; built as drawn and raised.
 */

/** The frame's note: "auto-closes ~1.5s in-app". */
const SENT_CLOSE_MS = 1500;

type FeedbackType = "feedback" | "feature";

const PILL_BASE =
  "inline-flex h-9 cursor-pointer items-center rounded-[20px] px-4 text-[13px] transition-[filter,background-color] active:scale-[0.98]";

export function FeedbackPanel({ onClose }: { onClose: () => void }) {
  const [type, setType] = useState<FeedbackType>("feedback");
  const [text, setText] = useState("");
  const [sent, setSent] = useState(false);
  const closeTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(
    () => () => {
      if (closeTimer.current) clearTimeout(closeTimer.current);
    },
    [],
  );

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  const ready = text.trim().length > 0;

  const send = () => {
    if (!ready || sent) return;
    // TODO(api): post to `/api/v1/feedback`, which exists and is unwired.
    setSent(true);
    closeTimer.current = setTimeout(onClose, SENT_CLOSE_MS);
  };

  const openAgain = () => {
    if (closeTimer.current) clearTimeout(closeTimer.current);
    setText("");
    setSent(false);
  };

  const panel =
    "fixed top-1/2 right-6 z-50 flex w-[360px] max-w-[calc(100vw-3rem)] -translate-y-1/2 flex-col rounded-2xl bg-nevo-cream-inset p-6 shadow-[0_20px_56px_rgba(0,0,0,0.2)]";

  return (
    <>
      <div
        aria-hidden
        onClick={onClose}
        className="fixed inset-0 z-40 bg-nevo-near-black/28 motion-safe:animate-in motion-safe:fade-in-0 motion-safe:duration-200"
      />

      {sent ? (
        <div
          role="dialog"
          aria-label="Feedback sent"
          className={cn(
            panel,
            "min-h-[360px] items-center justify-center text-center motion-safe:animate-in motion-safe:fade-in-0 motion-safe:duration-150",
          )}
        >
          <span className="inline-flex size-14 items-center justify-center rounded-full bg-nevo-navy text-nevo-cream motion-safe:animate-nevo-pop">
            <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
              <path d="M20 6L9 17l-5-5" />
            </svg>
          </span>
          <h3 className="mt-4 text-[17px] font-semibold text-nevo-near-black">
            Thank you - that&rsquo;s on its way
          </h3>
          <p className="mt-[7px] text-sm leading-[1.55] text-nevo-near-black/62">
            The panel closes on its own. You can share more any time.
          </p>
          <button
            type="button"
            onClick={openAgain}
            className="mt-[18px] inline-flex h-[38px] cursor-pointer items-center rounded-[10px] border-[1.5px] border-nevo-near-black/18 px-4 text-[13px] font-semibold text-nevo-near-black transition-colors hover:bg-nevo-near-black/5 active:scale-[0.98]"
          >
            Open again
          </button>
        </div>
      ) : (
        <div
          role="dialog"
          aria-modal="true"
          aria-label="Share feedback"
          className={cn(
            panel,
            "min-h-[360px] motion-safe:animate-in motion-safe:fade-in-0 motion-safe:zoom-in-95 motion-safe:duration-150",
          )}
        >
          <div className="flex items-start justify-between">
            <div>
              <h3 className="text-base font-semibold text-nevo-navy">
                Share Feedback
              </h3>
              <p className="mt-2 max-w-[280px] text-[13px] leading-[1.55] text-nevo-near-black/60">
                Help us improve Nevo. Your input shapes what we build next.
              </p>
            </div>
            <button
              type="button"
              onClick={onClose}
              aria-label="Close"
              className="mt-0.5 shrink-0 cursor-pointer text-nevo-near-black/40 transition-colors hover:text-nevo-near-black/70 active:scale-[0.98]"
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden>
                <path d="M6 6l12 12M18 6L6 18" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
              </svg>
            </button>
          </div>

          <div className="mt-4 flex gap-2">
            {(
              [
                ["feedback", "Feedback"],
                ["feature", "Feature Request"],
              ] as const
            ).map(([id, label]) => (
              <button
                key={id}
                type="button"
                aria-pressed={type === id}
                onClick={() => setType(id)}
                className={cn(
                  PILL_BASE,
                  type === id
                    ? "bg-nevo-navy text-nevo-cream"
                    : "bg-nevo-cream-elevated text-nevo-near-black hover:brightness-[0.985]",
                )}
              >
                {label}
              </button>
            ))}
          </div>

          <textarea
            value={text}
            onChange={(e) => setText(e.target.value)}
            aria-label="Your feedback"
            placeholder={
              type === "feature"
                ? "What would make Nevo better?"
                : "What’s on your mind?"
            }
            className="mt-4 min-h-[120px] w-full resize-none rounded-[10px] border border-nevo-near-black/12 bg-nevo-cream-elevated px-3.5 py-3 text-sm leading-[1.5] text-nevo-near-black outline-none transition-colors placeholder:text-nevo-near-black/30 focus:border-nevo-navy"
          />

          <button
            type="button"
            onClick={send}
            className={cn(
              "mt-4 flex h-11 w-full items-center justify-center rounded-[10px] bg-nevo-navy text-[13px] font-semibold text-nevo-cream transition-[filter]",
              ready
                ? "cursor-pointer hover:brightness-[1.06] active:scale-[0.98]"
                : "cursor-default opacity-50",
            )}
          >
            Send Feedback
          </button>
        </div>
      )}
    </>
  );
}
