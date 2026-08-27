"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { askNevoApi, asUuid } from "@/lib/api";
import { getToken } from "@/lib/auth/session";
import {
  ASK_NEVO_CONTEXTS,
  CANNOT_HELP_LINE,
  contextForPath,
  OUT_OF_SCOPE,
  stripForPath,
} from "@/lib/mocks/teacherAskNevo";
import { randomId } from "@/lib/utils";
import { useHasSession } from "@/hooks/useHasSession";
import { MOCK_TEACHER } from "./teacherNav";

/**
 * Ask Nevo (`Nevo Teacher Ask`) - a reusable overlay dropped onto every
 * console screen, not a standalone surface. Rebuilt against the rewritten
 * component frame: the launcher is a labelled pill rather than a circle, the
 * panel is a full-height right-edge sheet, and a violet context strip under
 * the header names what the teacher is looking at.
 *
 * Live-first: the assistant is asked before the canned turn, capped so a cold
 * backend can't hang the drawer, and a stand-in answer says it is one.
 *
 * The frame's thinking beat is 850ms (0 under reduced motion); the live cap
 * runs alongside it so a fast answer still lands after the beat.
 */

const THINKING_MS = 850;
const LIVE_TIMEOUT_MS = 15000;

const SHEET = "w-[460px] xl:w-[468px]";

type Turn =
  | { kind: "question"; text: string }
  | {
      kind: "answer";
      text: string;
      action?: { label: string; href: string };
      /** Canned stand-in shown after a live attempt failed. */
      sample?: boolean;
    }
  | { kind: "cannothelp" };

const SPARKLE = (size: number) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor" aria-hidden>
    <path d="M12 2l1.6 4.8L18 8.4l-4.4 1.6L12 15l-1.6-5L6 8.4l4.4-1.6z" />
    <circle cx="18.5" cy="17.5" r="2.2" />
  </svg>
);

export function AskNevo() {
  const pathname = usePathname() ?? "";
  const threadId = useRef(randomId());
  const [open, setOpen] = useState(false);
  const signedIn = useHasSession();
  const [draft, setDraft] = useState("");
  const [turns, setTurns] = useState<Turn[]>([]);
  const [thinking, setThinking] = useState(false);
  const alive = useRef(true);
  const timers = useRef<ReturnType<typeof setTimeout>[]>([]);
  const endRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const pending = timers.current;
    alive.current = true;
    return () => {
      alive.current = false;
      pending.forEach(clearTimeout);
    };
  }, []);

  const context = contextForPath(pathname);
  const data = ASK_NEVO_CONTEXTS[context];
  const strip = stripForPath(context, pathname);

  // Closing resets the transcript, per the frame.
  const close = () => {
    setOpen(false);
    setTurns([]);
    setDraft("");
    setThinking(false);
  };

  const cannedFor = (question: string): Turn => {
    if (OUT_OF_SCOPE.test(question)) return { kind: "cannothelp" };
    return { kind: "answer", text: data.answer, action: data.action };
  };

  const ask = (raw: string) => {
    const question = raw.trim();
    if (!question || thinking) return;
    setDraft("");
    setTurns((ts) => [...ts, { kind: "question", text: question }]);
    setThinking(true);
    requestAnimationFrame(() => endRef.current?.scrollIntoView({ block: "end" }));

    const reduced =
      typeof window !== "undefined" &&
      window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;
    const beat = new Promise<void>((resolve) =>
      timers.current.push(setTimeout(resolve, reduced ? 0 : THINKING_MS)),
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
          ? { kind: "answer", text: res.answer }
          : { ...cannedFor(question), sample: Boolean(getToken()) },
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
      {!open && (
        <button
          type="button"
          aria-label="Ask Nevo"
          title="Ask Nevo"
          onClick={() => setOpen(true)}
          className="fixed right-6 bottom-6 z-30 flex h-[52px] cursor-pointer items-center gap-2.5 rounded-full bg-nevo-navy px-[22px] text-[15px] font-medium text-nevo-cream shadow-[0_8px_32px_rgba(0,0,0,0.16)] transition-[transform,filter] duration-[140ms] hover:brightness-108 active:scale-105"
        >
          {SPARKLE(22)}
          Ask Nevo
        </button>
      )}

      {open && (
        <>
          <div
            onClick={close}
            className="fixed inset-0 z-40 bg-nevo-near-black/28 motion-safe:animate-in motion-safe:fade-in-0 motion-safe:duration-200"
          />
          <aside
            role="dialog"
            aria-modal="true"
            aria-label="Ask Nevo"
            className={`fixed inset-y-0 right-0 z-50 flex flex-col bg-nevo-cream shadow-[-8px_0_32px_rgba(0,0,0,0.16)] motion-safe:animate-nevo-sheet-r ${SHEET}`}
          >
            {/* Header */}
            <div className="flex shrink-0 items-center justify-between border-b border-nevo-near-black/8 px-[22px] pt-5 pb-4">
              <div className="flex items-center gap-[11px]">
                <span className="flex size-8 items-center justify-center rounded-full bg-nevo-navy text-nevo-cream">
                  {SPARKLE(17)}
                </span>
                <div className="flex flex-col">
                  <span className="text-[18px] leading-[1.1] font-medium tracking-[-0.01em] text-nevo-near-black">
                    Ask Nevo
                  </span>
                  {/* The school name is a fixture; a real session gives us a
                      school_id uuid and nothing that resolves it. */}
                  {!signedIn && (
                    <span className="mt-0.5 text-[12.5px] text-nevo-near-black/68">
                      {MOCK_TEACHER.school}
                    </span>
                  )}
                </div>
              </div>
              <button
                type="button"
                aria-label="Close"
                onClick={close}
                className="flex size-[34px] cursor-pointer items-center justify-center rounded-lg transition-transform duration-[120ms] active:scale-[0.98]"
              >
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden>
                  <path d="M6 6l12 12M18 6L6 18" stroke="#2b2b2f" strokeWidth="2" strokeLinecap="round" />
                </svg>
              </button>
            </div>

            {/* Context strip - what the teacher is looking at */}
            <div className="flex shrink-0 items-center gap-[9px] border-b border-nevo-violet/18 bg-nevo-violet/10 px-[22px] py-[11px]">
              <span className="shrink-0 text-nevo-navy">
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
                  <path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7-10-7-10-7z" />
                  <circle cx="12" cy="12" r="2.6" />
                </svg>
              </span>
              <span className="text-[12.5px] leading-[1.35] text-nevo-navy">
                {strip}
              </span>
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
                    {data.chips.map((chip) => (
                      <button
                        key={chip}
                        type="button"
                        onClick={() => ask(chip)}
                        className="flex cursor-pointer items-center gap-2.5 rounded-xl border-[1.5px] border-nevo-violet/60 bg-nevo-violet/6 px-[15px] py-3 text-left text-[14px] leading-[1.35] text-nevo-navy transition-[transform,background-color] duration-[120ms] hover:bg-nevo-violet/14 active:scale-[0.98]"
                      >
                        <span className="shrink-0 text-nevo-navy/55">→</span>
                        {chip}
                      </button>
                    ))}
                  </div>
                </>
              ) : (
                <div className="flex flex-col">
                  {turns.map((t, i) =>
                    t.kind === "question" ? (
                      <div key={i} className={i > 0 ? "mt-3.5 flex justify-end" : "flex justify-end"}>
                        <div className="max-w-[82%] rounded-[14px_14px_4px_14px] bg-nevo-navy px-[15px] py-[11px]">
                          <p className="text-[14.5px] leading-[1.45] text-nevo-cream">
                            {t.text}
                          </p>
                        </div>
                      </div>
                    ) : t.kind === "answer" ? (
                      <div key={i} className="mt-3.5 flex justify-start">
                        <div className="max-w-[88%] rounded-[14px_14px_14px_4px] border border-nevo-violet/35 bg-nevo-violet/15 px-4 py-3.5">
                          <p className="text-[14.5px] leading-[1.6] text-nevo-near-black">
                            {t.text}
                          </p>
                          {t.sample && (
                            <p className="mt-2.5 text-[12px] leading-[1.45] text-nevo-near-black/55 italic">
                              We couldn&rsquo;t reach Nevo just now, so this is
                              a sample answer.
                            </p>
                          )}
                          {t.action && (
                            <div className="mt-3 flex flex-wrap gap-[9px]">
                              <Link
                                href={t.action.href}
                                onClick={close}
                                className="inline-flex h-9 cursor-pointer items-center gap-[7px] rounded-[9px] bg-nevo-navy px-3.5 text-[13px] font-medium text-nevo-cream transition-[transform,filter] duration-[120ms] hover:brightness-93 active:scale-[0.98]"
                              >
                                {t.action.label}
                              </Link>
                            </div>
                          )}
                        </div>
                      </div>
                    ) : (
                      <div key={i} className="mt-3.5 flex flex-col items-start">
                        <div className="max-w-[88%] rounded-[14px_14px_14px_4px] border border-nevo-violet/35 bg-nevo-violet/15 px-4 py-3.5">
                          <p className="text-[14.5px] leading-[1.6] text-nevo-near-black">
                            {CANNOT_HELP_LINE}
                          </p>
                        </div>
                        <Link
                          href="/teacher/connect"
                          onClick={close}
                          className="mt-2.5 ml-1 inline-flex cursor-pointer items-center gap-[7px] text-[13px] font-medium text-nevo-violet transition-transform duration-[120ms] active:scale-[0.98]"
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
                    <div className="mt-3.5 flex flex-col items-start">
                      <div className="flex items-center gap-1.5 rounded-[14px_14px_14px_4px] border border-nevo-violet/35 bg-nevo-violet/15 px-4 py-3.5">
                        {[0, 160, 320].map((delay) => (
                          <span
                            key={delay}
                            style={{ animationDelay: `${delay}ms` }}
                            className="size-1.5 rounded-full bg-nevo-navy motion-safe:animate-nevo-dot"
                          />
                        ))}
                      </div>
                      <span className="mt-2 ml-1 text-[12.5px] text-nevo-near-black/55">
                        {"Nevo is thinking…"}
                      </span>
                    </div>
                  )}
                  <div ref={endRef} />
                </div>
              )}
            </div>

            {/* Input */}
            <div className="shrink-0 border-t border-nevo-near-black/8 px-[18px] pt-3.5 pb-[18px]">
              <div className="flex h-[46px] items-center gap-2 rounded-full border-[1.5px] border-nevo-near-black/16 bg-nevo-cream pr-2 pl-4">
                <input
                  value={draft}
                  onChange={(e) => setDraft(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      e.preventDefault();
                      ask(draft);
                    }
                  }}
                  placeholder={"Ask about a student, class, or lesson"}
                  className="min-w-0 flex-1 border-none bg-transparent text-[14.5px] text-nevo-near-black outline-none"
                />
                {/* Visual affordance only in the frame - no recording state. */}
                <span
                  aria-label="Speak your question"
                  className="flex size-[26px] shrink-0 items-center justify-center text-nevo-near-black"
                >
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
                    <rect x="9" y="3" width="6" height="11" rx="3" />
                    <path d="M5 11a7 7 0 0 0 14 0" />
                    <path d="M12 18v3" />
                  </svg>
                </span>
                <button
                  type="button"
                  aria-label="Send"
                  onClick={() => ask(draft)}
                  className="flex size-[34px] shrink-0 cursor-pointer items-center justify-center rounded-full bg-nevo-navy transition-transform duration-[120ms] active:scale-[0.98]"
                >
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#f7f1e6" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
                    <path d="M22 2L11 13" />
                    <path d="M22 2l-7 20-4-9-9-4z" />
                  </svg>
                </button>
              </div>
            </div>
          </aside>
        </>
      )}
    </>
  );
}
