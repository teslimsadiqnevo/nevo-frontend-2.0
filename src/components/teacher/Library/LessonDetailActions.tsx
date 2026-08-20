"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";

/**
 * Lesson-detail header actions (C06b). "Assign to a class" flashes the
 * component frame's toast until the C07i assignment screen lands; "Edit"
 * routes into the upload flow. Pressable, never disabled.
 */
export function LessonDetailActions({ compact = false }: { compact?: boolean }) {
  const [toast, setToast] = useState("");
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(
    () => () => {
      if (timer.current) clearTimeout(timer.current);
    },
    [],
  );

  const flash = (text: string) => {
    if (timer.current) clearTimeout(timer.current);
    setToast(text);
    timer.current = setTimeout(() => setToast(""), 2600);
  };

  const h = compact ? "h-[42px] text-sm" : "h-11 text-[14.5px]";

  return (
    <>
      <div className="flex items-center gap-2.5">
        <button
          type="button"
          onClick={() =>
            // TODO(screen): route to C07i Lesson Assignment once built.
            flash("Assigned. Students will see it on their next sign-in.")
          }
          className={`inline-flex cursor-pointer items-center rounded-[10px] bg-nevo-navy px-5 font-semibold text-nevo-cream transition-[filter,transform] hover:brightness-93 active:scale-[0.99] ${h}`}
        >
          Assign to a class
        </button>
        <Link
          href="/teacher/lessons/upload"
          className={`inline-flex cursor-pointer items-center rounded-[10px] border-[1.5px] border-nevo-navy/35 px-[18px] font-medium text-nevo-navy transition-[background-color,transform] hover:bg-nevo-navy/6 active:scale-[0.99] ${h}`}
        >
          Edit
        </Link>
      </div>
      {toast && (
        <div
          role="status"
          className="mt-5 flex max-w-[660px] items-center gap-3 rounded-[12px] bg-nevo-violet/20 px-[18px] py-3.5 motion-safe:animate-in motion-safe:fade-in-0 motion-safe:duration-200"
        >
          <span className="flex size-[26px] shrink-0 items-center justify-center rounded-full bg-nevo-navy">
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#f7f1e6" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
              <path d="M20 6L9 17l-5-5" />
            </svg>
          </span>
          <span className="text-[14.5px] text-nevo-near-black">{toast}</span>
        </div>
      )}
    </>
  );
}
