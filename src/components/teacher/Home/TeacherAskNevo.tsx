"use client";

import { useEffect, useRef, useState } from "react";
import { usePathname } from "next/navigation";
import { askNevoApi } from "@/lib/api";
import { teacherAnswerFor } from "@/lib/mocks/teacherHome";
import { cn, randomId } from "@/lib/utils";

/** The frame's answer beat; live replies never land faster than this. */
const THINKING_MS = 400;

const SUGGESTIONS = [
  "What needs my attention today?",
  "Why is this student flagged?",
  "What should I prioritise first?",
];

function Sparkle({ size, className }: { size: number; className?: string }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="currentColor"
      className={className}
      aria-hidden
    >
      <path d="M12 2l1.6 4.8L18 8.4l-4.4 1.6L12 15l-1.6-5L6 8.4l4.4-1.6z" />
      <circle cx="18.5" cy="17.5" r="2.2" />
    </svg>
  );
}

/**
 * Teacher Ask Nevo (`Nevo Teacher Home` frame) - the navy sparkle FAB opening
 * a right-side drawer: context line, three suggestion chips, one answer card,
 * and a pill input. Live-first via the assistant seam (teacher role); the
 * frame's canned replies answer when the backend can't, so the drawer never
 * goes silent. The richer C15 screen reconciles later.
 */
export function TeacherAskNevo({ schoolName }: { schoolName: string }) {
  const pathname = usePathname();
  const threadId = useRef(`thread-${randomId()}`);
  const [open, setOpen] = useState(false);
  const [draft, setDraft] = useState("");
  const [answer, setAnswer] = useState("");
  const [thinking, setThinking] = useState(false);
  const alive = useRef(true);
  const timers = useRef<ReturnType<typeof setTimeout>[]>([]);

  useEffect(() => {
    const t = timers.current;
    alive.current = true;
    return () => {
      alive.current = false;
      t.forEach(clearTimeout);
    };
  }, []);

  const close = () => {
    setOpen(false);
    setAnswer("");
    setDraft("");
  };

  const ask = (raw: string) => {
    const question = raw.trim();
    if (!question || thinking) return;
    setDraft("");
    setThinking(true);
    const beat = new Promise<void>((resolve) =>
      timers.current.push(setTimeout(resolve, THINKING_MS)),
    );
    const live = askNevoApi
      .ask({
        role: "teacher",
        currentPage: pathname,
        contextIds: { threadId: threadId.current },
        question,
      })
      .catch(() => null);
    void Promise.all([live, beat]).then(([res]) => {
      if (!alive.current) return;
      setAnswer(res ? res.answer : teacherAnswerFor(question));
      setThinking(false);
    });
  };

  return (
    <>
      {/* FAB - 56px desktop, 52px tablet */}
      <button
        type="button"
        aria-label="Ask Nevo"
        title="Ask Nevo"
        onClick={() => setOpen(true)}
        className="fixed right-5 bottom-5 z-30 flex size-13 cursor-pointer items-center justify-center rounded-full bg-nevo-navy text-nevo-cream shadow-[0_8px_32px_rgba(0,0,0,0.16)] transition-[filter] duration-[120ms] hover:brightness-112 xl:right-6 xl:bottom-6 xl:size-14"
      >
        <Sparkle size={25} />
      </button>

      {open && (
        <>
          <div
            aria-hidden
            onClick={close}
            className="fixed inset-0 z-40 bg-nevo-near-black/28 motion-safe:animate-in motion-safe:fade-in-0 motion-safe:duration-200"
          />
          <div
            role="dialog"
            aria-label="Ask Nevo"
            className="fixed inset-y-0 right-0 z-50 flex w-[600px] max-w-full flex-col bg-nevo-cream shadow-[-8px_0_32px_rgba(0,0,0,0.16)] motion-safe:animate-in motion-safe:slide-in-from-right motion-safe:duration-300 motion-safe:ease-nevo-slide xl:w-[468px]"
          >
            {/* Head */}
            <div className="flex shrink-0 items-center justify-between border-b border-nevo-near-black/8 px-[22px] pt-5 pb-4">
              <div className="flex items-center gap-[11px]">
                <span className="flex size-8 shrink-0 items-center justify-center rounded-full bg-nevo-navy text-nevo-cream">
                  <Sparkle size={17} />
                </span>
                <span className="flex flex-col">
                  <span className="text-lg leading-[1.1] font-medium tracking-[-0.01em] text-nevo-near-black">
                    Ask Nevo
                  </span>
                  <span className="mt-0.5 text-[12.5px] text-nevo-near-black/68">
                    {schoolName}
                  </span>
                </span>
              </div>
              <button
                type="button"
                aria-label="Close"
                onClick={close}
                className="flex size-[34px] cursor-pointer items-center justify-center rounded-lg text-nevo-near-black transition-colors hover:bg-nevo-navy/6"
              >
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden>
                  <path d="M6 6l12 12M18 6L6 18" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                </svg>
              </button>
            </div>

            {/* Body */}
            <div className="min-h-0 flex-1 overflow-y-auto p-[22px]">
              <p className="mb-1.5 text-[15px] font-semibold text-nevo-near-black">
                What can I help you see today?
              </p>
              <p className="mb-4 text-[13.5px] leading-[1.5] text-nevo-near-black/72">
                Ask about your morning, a flagged student, or where to start.
              </p>
              <div className="flex flex-col gap-[9px]">
                {SUGGESTIONS.map((text) => (
                  <button
                    key={text}
                    type="button"
                    onClick={() => ask(text)}
                    className="flex cursor-pointer items-center gap-2.5 rounded-[12px] border-[1.5px] border-nevo-violet/60 bg-nevo-violet/6 px-[15px] py-3 text-left text-sm leading-[1.35] text-nevo-navy transition-colors hover:bg-nevo-violet/12"
                  >
                    <span className="shrink-0 text-nevo-navy/55">→</span>
                    {text}
                  </button>
                ))}
              </div>
              {(answer || thinking) && (
                <div className="mt-4 flex items-start gap-2.5 rounded-[12px] bg-nevo-violet/14 px-4 py-3.5">
                  <Sparkle size={16} className="mt-px shrink-0 text-nevo-navy" />
                  <p
                    role="status"
                    className={cn(
                      "text-sm leading-[1.55] text-nevo-near-black",
                      thinking && "text-nevo-near-black/50",
                    )}
                  >
                    {thinking ? "Thinking…" : answer}
                  </p>
                </div>
              )}
            </div>

            {/* Foot */}
            <div className="shrink-0 border-t border-nevo-near-black/8 px-[18px] pt-3.5 pb-[18px]">
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  ask(draft);
                }}
                className="flex h-[46px] items-center gap-2.5 rounded-full border-[1.5px] border-nevo-near-black/16 bg-nevo-cream py-0 pr-2 pl-4"
              >
                <input
                  value={draft}
                  onChange={(e) => setDraft(e.target.value)}
                  placeholder="Ask about a student, class, or lesson"
                  className="min-w-0 flex-1 bg-transparent text-[14.5px] text-nevo-near-black outline-none placeholder:text-nevo-near-black/45"
                />
                <button
                  type="submit"
                  aria-label="Send"
                  className="flex size-[34px] shrink-0 cursor-pointer items-center justify-center rounded-full bg-nevo-navy text-nevo-cream"
                >
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
                    <path d="M22 2L11 13" />
                    <path d="M22 2l-7 20-4-9-9-4z" />
                  </svg>
                </button>
              </form>
            </div>
          </div>
        </>
      )}
    </>
  );
}
