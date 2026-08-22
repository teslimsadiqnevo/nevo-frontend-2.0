"use client";

import { useEffect, useState } from "react";

/**
 * C.8b Share with Learning Support - the escalation sheet over the profile.
 * A note goes to the SENCo with the student's recent picture; the tone stays
 * plain and non-clinical, and nothing here is scored or coloured as an alarm.
 *
 * Post-send behaviour follows C14 Teacher State Patterns B5 (sheet dismisses,
 * toast confirms, a quiet note settles under the student's name) rather than
 * the older component frame's in-sheet success panel - flagged to design.
 *
 * Cancel discards the draft, so reopening always starts empty (the component
 * frame's `closeShare` clears the note).
 */
export function ShareSheet({
  studentName,
  onCancel,
  onSend,
}: {
  studentName: string;
  onCancel: () => void;
  onSend: (note: string) => void;
}) {
  const [note, setNote] = useState("");
  const firstName = studentName.split(" ")[0];

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onCancel();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onCancel]);

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-nevo-near-black/28 p-6 motion-safe:animate-in motion-safe:fade-in-0 motion-safe:duration-200"
      onClick={onCancel}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-label={`Share ${firstName} with Learning Support`}
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-[500px] rounded-2xl bg-nevo-cream p-7 shadow-[0_8px_32px_rgba(0,0,0,0.16)] motion-safe:animate-in motion-safe:zoom-in-95 motion-safe:duration-200 xl:max-w-[520px] xl:p-8"
      >
        <h2 className="text-xl font-semibold tracking-[-0.01em] text-nevo-near-black xl:text-[22px]">
          {`Share ${firstName} with Learning Support`}
        </h2>
        <p className="mt-[9px] text-[14.5px] leading-[1.55] text-nevo-near-black/68 xl:mt-2.5 xl:text-[15px]">
          {`A note goes to your SENCo along with ${firstName}'s recent picture. They'll take it from here.`}
        </p>
        <label className="mt-5 block text-[13px] font-semibold text-nevo-near-black/70 xl:mt-[22px] xl:text-[13.5px]">
          What are you noticing?
          <textarea
            value={note}
            onChange={(e) => setNote(e.target.value)}
            placeholder="A sentence or two is plenty&hellip;"
            className="mt-2 h-[110px] w-full resize-none rounded-xl border-[1.5px] border-nevo-near-black/16 bg-nevo-cream-elevated px-[15px] py-[13px] text-[14.5px] leading-[1.5] font-normal text-nevo-near-black transition-colors focus:border-nevo-navy focus:outline-none xl:h-[120px] xl:px-4 xl:py-3.5 xl:text-[15px]"
          />
        </label>
        <div className="mt-[18px] flex gap-3 xl:mt-5">
          <button
            type="button"
            onClick={onCancel}
            className="flex h-[50px] flex-1 cursor-pointer items-center justify-center rounded-[10px] border-[1.5px] border-nevo-navy/30 text-[14.5px] font-medium text-nevo-navy transition-colors hover:bg-nevo-navy/6 xl:h-[52px] xl:text-[15px]"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={() => onSend(note)}
            className="flex h-[50px] flex-1 cursor-pointer items-center justify-center rounded-[10px] bg-nevo-navy text-[14.5px] font-semibold text-nevo-cream transition-[filter] hover:brightness-93 xl:h-[52px] xl:text-[15px]"
          >
            Send to Learning Support
          </button>
        </div>
      </div>
    </div>
  );
}
