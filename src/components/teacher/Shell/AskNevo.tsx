"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { askNevoApi, asUuid } from "@/lib/api";
import { getToken } from "@/lib/auth/session";
import {
  ASK_NEVO_CONTEXTS,
  CANNOT_HELP_LINE,
  OUT_OF_SCOPE,
  contextForPath,
  contextLineForPath,
} from "@/lib/mocks/teacherAskNevo";
import { teacherAnswerFor } from "@/lib/mocks/teacherHome";
import { cn, randomId } from "@/lib/utils";

/** The frame's answer beat; live replies never land faster than this. */
const THINKING_MS = 900;
/** How long the live assistant may take before the canned turn answers -
 *  the backend's cold start can run to a minute, and the drawer must never
 *  sit on "thinking" that long. */
// A cold backend can take tens of seconds; 4s meant the drawer served a
// canned answer as if it were real on nearly every cold start.
const LIVE_TIMEOUT_MS = 15000;

type Turn =
  | { kind: "question"; text: string }
  | {
      kind: "answer";
      text: string;
      actions: { label: string; href: string }[];
      /** Canned stand-in shown after a live attempt failed. */
      sample?: boolean;
    }
  | { kind: "cannothelp" };

function Sparkle({ size }: { size: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor" aria-hidden>
      <path d="M12 2l1.6 4.8L18 8.4l-4.4 1.6L12 15l-1.6-5L6 8.4l4.4-1.6z" />
      <circle cx="18.5" cy="17.5" r="2.2" />
    </svg>
  );
}

/**
 * Ask Nevo, teacher side (C15) - the navy sparkle button, bottom-right at a
 * 24px inset on every console surface, opening the context-aware drawer:
 * what it greets with, suggests and answers follows the page it was opened
 * from (home, a student, insights, a connect draft, the library).
 *
 * Live-first via the assistant seam; the frame's canned turns answer when the
 * backend can't, so the drawer never goes silent. Requests outside the
 * assistant's remit get the gentle recovery and a hand-off, never an error.
 *
 * Supersedes the lighter `Nevo Teacher Home` drawer this component started
 * as; the C15 deltas are the per-context data, the transcript turns with
 * action pills, the cannothelp state, and the 640px tablet sheet.
 */
export function AskNevo() {
  const pathname = usePathname();
  const threadId = useRef(randomId());
  const [open, setOpen] = useState(false);
  const [draft, setDraft] = useState("");
  const [turns, setTurns] = useState<Turn[]>([]);
  const [thinking, setThinking] = useState(false);
  const alive = useRef(true);
  const timers = useRef<ReturnType<typeof setTimeout>[]>([]);
  const endRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const t = timers.current;
    alive.current = true;
    return () => {
      alive.current = false;
      t.forEach(clearTimeout);
    };
  }, []);

  const context = contextForPath(pathname);
  const data = ASK_NEVO_CONTEXTS[context];
  const contextLine = contextLineForPath(context, pathname);

  const close = () => {
    setOpen(false);
    setTurns([]);
    setDraft("");
    setThinking(false);
  };

  const cannedFor = (question: string): Turn => {
    if (OUT_OF_SCOPE.test(question)) return { kind: "cannothelp" };
    const q = question.trim().toLowerCase();
    if (q === data.question.toLowerCase() || data.chips.some((c) => c.toLowerCase() === q)) {
      return { kind: "answer", text: data.answer, actions: data.actions };
    }
    // Generic keyword fallback, kept from the Home-era drawer.
    return { kind: "answer", text: teacherAnswerFor(question), actions: [] };
  };

  const ask = (raw: string) => {
    const question = raw.trim();
    if (!question || thinking) return;
    setDraft("");
    setTurns((ts) => [...ts, { kind: "question", text: question }]);
    setThinking(true);
    requestAnimationFrame(() => endRef.current?.scrollIntoView({ block: "end" }));
    const beat = new Promise<void>((resolve) =>
      timers.current.push(setTimeout(resolve, THINKING_MS)),
    );
    const live = Promise.race([
      askNevoApi
        .ask({
          role: "teacher",
          currentPage: pathname,
          contextIds: { threadId: asUuid(threadId.current) },
          question,
        })
        .catch(() => null),
      new Promise<null>((resolve) =>
        timers.current.push(setTimeout(() => resolve(null), LIVE_TIMEOUT_MS)),
      ),
    ]);
    void Promise.all([live, beat]).then(([res]) => {
      if (!alive.current) return;
      setTurns((ts) => [
        ...ts,
        res
          ? { kind: "answer", text: res.answer, actions: [] }
          : // A stand-in answer says so when we actually tried to reach the
            // assistant - it must never read as Nevo's own judgement.
            { ...cannedFor(question), sample: Boolean(getToken()) },
      ]);
      setThinking(false);
      requestAnimationFrame(() =>
        endRef.current?.scrollIntoView({ block: "end" }),
      );
    });
  };

  const showEntry = turns.length === 0 && !thinking;

  return (
    <>
      {/* Floating button - bottom-right, 24px inset (C15). */}
      <button
        type="button"
        aria-label="Ask Nevo"
        title="Ask Nevo"
        onClick={() => setOpen(true)}
        className="fixed right-6 bottom-6 z-30 flex size-14 cursor-pointer items-center justify-center rounded-full bg-nevo-navy text-nevo-cream shadow-[0_8px_32px_rgba(0,0,0,0.16)] transition-[filter] duration-[120ms] hover:brightness-112"
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
            className="fixed inset-y-0 right-0 z-50 flex w-[640px] max-w-full flex-col bg-nevo-cream shadow-[-8px_0_32px_rgba(0,0,0,0.16)] motion-safe:animate-in motion-safe:slide-in-from-right motion-safe:duration-300 xl:w-[468px]"
          >
            {/* Head - sparkle, title, the surface it was opened from */}
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
                    {contextLine}
                  </span>
                </span>
              </div>
              <button
                type="button"
                aria-label="Close"
                onClick={close}
                className="flex size-[34px] cursor-pointer items-center justify-center rounded-lg text-nevo-near-black transition-colors hover:bg-nevo-near-black/5"
              >
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden>
                  <path d="M6 6l12 12M18 6L6 18" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                </svg>
              </button>
            </div>

            {/* Body */}
            <div className="min-h-0 flex-1 overflow-y-auto p-[22px]">
              {showEntry ? (
                <>
                  <p className="mb-1.5 text-[15px] font-semibold text-nevo-near-black">
                    {data.lead}
                  </p>
                  <p className="mb-4 text-[13.5px] leading-[1.5] text-nevo-near-black/72">
                    {data.sub}
                  </p>
                  <div className="flex flex-col gap-[9px]">
                    {data.chips.map((c) => (
                      <button
                        key={c}
                        type="button"
                        onClick={() => ask(c)}
                        className="flex cursor-pointer items-center gap-2.5 rounded-xl border-[1.5px] border-nevo-violet/60 bg-nevo-violet/6 px-[15px] py-3 text-left text-sm leading-[1.35] text-nevo-navy transition-colors hover:bg-nevo-violet/12"
                      >
                        <span className="shrink-0 text-nevo-navy/55">&rarr;</span>
                        {c}
                      </button>
                    ))}
                  </div>
                </>
              ) : (
                <div className="flex flex-col">
                  {turns.map((t, i) =>
                    t.kind === "question" ? (
                      <div key={i} className={cn("flex justify-end", i > 0 && "mt-3.5")}>
                        <div className="max-w-[82%] rounded-[12px_12px_4px_12px] bg-nevo-navy/15 px-[15px] py-3">
                          <p className="text-[14.5px] leading-[1.45] text-nevo-near-black">
                            {t.text}
                          </p>
                        </div>
                      </div>
                    ) : t.kind === "answer" ? (
                      <div key={i} className="mt-3.5 flex justify-start">
                        <div className="max-w-[88%] rounded-[12px_12px_12px_4px] border border-nevo-violet/35 bg-nevo-violet/15 px-4 py-3.5">
                          <p className="text-[14.5px] leading-[1.6] text-nevo-near-black">
                            {t.text}
                          </p>
                          {t.sample && (
                            <p className="mt-2.5 text-[12px] leading-[1.45] text-nevo-near-black/55 italic">
                              We couldn&rsquo;t reach Nevo just now, so this is
                              a sample answer.
                            </p>
                          )}
                          {t.actions.length > 0 && (
                            <div className="mt-3 flex flex-wrap gap-[9px]">
                              {t.actions.map((a) => (
                                <Link
                                  key={a.label}
                                  href={a.href}
                                  onClick={close}
                                  className="inline-flex h-9 cursor-pointer items-center gap-[7px] rounded-[9px] bg-nevo-navy px-3.5 text-[13px] font-medium text-nevo-cream transition-[filter] hover:brightness-93"
                                >
                                  {a.label}
                                </Link>
                              ))}
                            </div>
                          )}
                        </div>
                      </div>
                    ) : (
                      <div key={i}>
                        <div className="mt-3.5 flex justify-start">
                          <div className="max-w-[88%] rounded-[12px_12px_12px_4px] border border-nevo-violet/35 bg-nevo-violet/15 px-4 py-3.5">
                            <p className="text-[14.5px] leading-[1.6] text-nevo-near-black">
                              {CANNOT_HELP_LINE}
                            </p>
                          </div>
                        </div>
                        {/* The hand-off, quiet and violet - never an error. */}
                        <Link
                          href="/teacher/connect"
                          onClick={close}
                          className="mt-2.5 ml-1 inline-flex cursor-pointer items-center gap-1.5 text-[13px] text-nevo-violet transition-colors hover:text-nevo-navy"
                        >
                          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
                            <path d="M21 12a8 8 0 0 1-11.6 7.1L4 20l1-4.5A8 8 0 1 1 21 12z" />
                          </svg>
                          Message your school admin
                        </Link>
                      </div>
                    ),
                  )}
                  {thinking && (
                    <>
                      <div className="mt-3.5 flex justify-start">
                        <div className="flex items-center gap-1.5 rounded-[12px_12px_12px_4px] border border-nevo-violet/35 bg-nevo-violet/15 px-4 py-3.5">
                          {[0, 160, 320].map((delay) => (
                            <span
                              key={delay}
                              className="block size-[7px] rounded-full bg-nevo-navy motion-safe:animate-nevo-dot"
                              style={{ animationDelay: `${delay}ms` }}
                            />
                          ))}
                        </div>
                      </div>
                      <p className="mt-2 ml-1 text-[12.5px] text-nevo-near-black/65">
                        Nevo is thinking&hellip;
                      </p>
                    </>
                  )}
                  <div ref={endRef} />
                </div>
              )}
            </div>

            {/* Input */}
            <div className="shrink-0 border-t border-nevo-near-black/8 px-[18px] pt-3.5 pb-[18px]">
              <div className="flex h-[46px] items-center gap-2.5 rounded-full border-[1.5px] border-nevo-near-black/16 bg-nevo-cream py-0 pr-2 pl-4">
                <input
                  value={draft}
                  onChange={(e) => setDraft(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      e.preventDefault();
                      ask(draft);
                    }
                  }}
                  placeholder="Ask about a student, class, or lesson"
                  aria-label="Ask Nevo"
                  className="min-w-0 flex-1 bg-transparent text-[14.5px] text-nevo-near-black outline-none placeholder:text-nevo-near-black/55"
                />
                <button
                  type="button"
                  aria-label="Send"
                  onClick={() => ask(draft)}
                  disabled={!draft.trim() || thinking}
                  className={cn(
                    "flex size-8 shrink-0 items-center justify-center rounded-full",
                    draft.trim() && !thinking
                      ? "cursor-pointer bg-nevo-navy text-nevo-cream transition-[filter] hover:brightness-93"
                      : "cursor-not-allowed bg-nevo-navy/18 text-nevo-near-black/40",
                  )}
                >
                  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
                    <path d="M22 2L11 13" />
                    <path d="M22 2l-7 20-4-9-9-4z" />
                  </svg>
                </button>
              </div>
            </div>
          </div>
        </>
      )}
    </>
  );
}
