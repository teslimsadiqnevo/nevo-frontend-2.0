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
import { useCurrentUser } from "@/hooks/useCurrentUser";
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

const SHEET = "w-[460px] xl:w-[468px]";

type Turn =
  | { kind: "question"; text: string }
  | {
      kind: "answer";
      text: string;
      action?: { label: string; href: string };
      /** Canned stand-in shown after a live attempt failed. */
      sample?: boolean;
      /** Present only on a REAL answer - what the vote is cast against. */
      interactionId?: string;
      vote?: 1 | -1;
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
  const identity = useCurrentUser();
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
    /*
     * NO RACE. This used to run the question against a 15s cap and take
     * whichever finished first, so a real answer arriving at 15.1s was thrown
     * away and a CANNED one shown in its place. A teacher who asked something
     * hard - the questions most worth asking - was the most likely to get a
     * stand-in instead of the answer Nevo had actually produced.
     *
     * Same bug as the notification feed and the four hooks in PR #148. Only a
     * genuine failure falls back, and it says so.
     */
    const live = askNevoApi
      .ask({
        role: "teacher",
        currentPage: pathname,
        contextIds: { threadId: asUuid(threadId.current) },
        question,
      })
      .catch(() => null);

    void Promise.all([live, beat]).then(([res]) => {
      if (!alive.current) return;
      setTurns((ts) => [
        ...ts,
        res
          ? {
              kind: "answer",
              text: res.answer,
              // Kept so the vote below has something to post against; a
              // canned answer has no interaction and gets no vote.
              interactionId: res.interaction_id,
            }
          : { ...cannedFor(question), sample: Boolean(getToken()) },
      ]);
      setThinking(false);
      requestAnimationFrame(() =>
        endRef.current?.scrollIntoView({ block: "end" }),
      );
    });
  };

  /**
   * C01's helpfulness vote. Optimistic on purpose - the teacher's own mark is
   * the point, and a failed write should not snatch it back - but it is only
   * ever offered on a REAL answer, so a vote always has an interaction behind
   * it. Toggling the same thumb clears it, per the frame.
   */
  const vote = (index: number, value: 1 | -1) => {
    setTurns((ts) =>
      ts.map((t, i) =>
        i === index && t.kind === "answer"
          ? { ...t, vote: t.vote === value ? undefined : value }
          : t,
      ),
    );
    const turn = turns[index];
    if (turn?.kind !== "answer" || !turn.interactionId) return;
    if (turn.vote === value) return; // clearing - nothing to record
    void askNevoApi
      .recordHelpfulness(turn.interactionId, value === 1)
      .catch(() => {});
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
                  {/* Real for a live session; the fixture only backs the
                      signed-out preview of the frame. */}
                  {(signedIn ? identity?.school : MOCK_TEACHER.school) && (
                    <span className="mt-0.5 text-[12.5px] text-nevo-near-black/68">
                      {signedIn ? identity?.school : MOCK_TEACHER.school}
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
                          {t.interactionId && (
                            <div className="mt-[11px] flex items-center justify-end gap-1 border-t border-nevo-near-black/9 pt-[9px]">
                              {([1, -1] as const).map((v) => {
                                const on = t.vote === v;
                                return (
                                  <button
                                    key={v}
                                    type="button"
                                    aria-label={v === 1 ? "Helpful" : "Not helpful"}
                                    aria-pressed={on}
                                    title={v === 1 ? "Helpful" : "Not helpful"}
                                    onClick={() => vote(i, v)}
                                    className="inline-flex size-[30px] cursor-pointer items-center justify-center rounded-lg transition-transform duration-[120ms] active:scale-[0.98]"
                                  >
                                    <svg
                                      width="19"
                                      height="19"
                                      viewBox="0 0 24 24"
                                      fill={on ? "#9a9ccb" : "none"}
                                      stroke={on ? "#9a9ccb" : "rgba(43,43,47,0.4)"}
                                      strokeWidth="1.7"
                                      strokeLinecap="round"
                                      strokeLinejoin="round"
                                      aria-hidden
                                    >
                                      {v === 1 ? (
                                        <path d="M14 9V5a3 3 0 0 0-3-3l-4 9v11h11.28a2 2 0 0 0 2-1.7l1.38-9a2 2 0 0 0-2-2.3zM7 22H4a2 2 0 0 1-2-2v-7a2 2 0 0 1 2-2h3" />
                                      ) : (
                                        <path d="M10 15v4a3 3 0 0 0 3 3l4-9V2H5.72a2 2 0 0 0-2 1.7l-1.38 9a2 2 0 0 0 2 2.3zm7-13h2.67A2.31 2.31 0 0 1 22 4v7a2.31 2.31 0 0 1-2.33 2H17" />
                                      )}
                                    </svg>
                                  </button>
                                );
                              })}
                            </div>
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
                        {/* Design deleted "Message your school admin" from
                            this state on 31 Aug: Connect messages STUDENTS,
                            so the link went somewhere that could not do what
                            it offered. Plain text now, per the frame. */}
                        <p className="mt-2.5 ml-1 text-[13px] leading-[1.5] text-nevo-near-black/60">
                          Your school admin looks after that side of things.
                        </p>
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
