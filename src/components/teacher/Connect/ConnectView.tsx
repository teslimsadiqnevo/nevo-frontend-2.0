"use client";

import { useEffect, useRef, useState } from "react";
import { useSearchParams } from "next/navigation";
import { IllustrationWrapper } from "@/components/shared/IllustrationWrapper";
import { useConnectThreads } from "@/hooks/useConnectThreads";
import {
  COMPOSE_STUDENTS,
  type ComposeStudent,
  type Message,
} from "@/lib/mocks/teacherConnect";
import { studentSlug } from "@/lib/mocks/teacherStudents";
import { cn } from "@/lib/utils";
import { ComposeModal } from "./ComposeModal";

/**
 * C10 Connect - individual threads between a teacher and their students, and
 * the compose flow for starting a new one. No class-wide broadcast in v1.
 *
 * Two states: a thread, and the empty state. Parents moved to their own
 * portal in the 25 Aug drop, so the include toggle, the violet parent bubble
 * and the no-parent-contact note are all gone from here.
 *
 * EMPTY STATE: C10 draws its own ("No conversations yet") but C14 A4 draws a
 * different one for the same state - illustration, warmer heading and a New
 * message CTA. C14 governs, as it has on the previous two slices; flagged.
 *
 * Sending follows C14 B4: the bubble lands in the thread with a pop, a toast
 * confirms, and the thread stays open.
 *
 * Live from `/api/messages/*` - see `useConnectThreads`. The thread list has
 * no message bodies, so opening a thread fetches it; sending posts and shows
 * the message the backend stored rather than an optimistic copy. Recipients
 * in compose are the teacher's real students, gathered from their class
 * rosters, because a compose list of invented children on a screen that sends
 * messages is the worst possible place for one.
 */

const TOAST_MS = 3000;

const PlusIcon = ({ size = 18 }: { size?: number }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
    <path d="M12 5v14" />
    <path d="M5 12h14" />
  </svg>
);

function Bubble({ m, isNew }: { m: Message; isNew?: boolean }) {
  if (m.from === "teacher") {
    return (
      <div className="flex justify-end">
        <div
          className={cn(
            "max-w-[62%] rounded-[12px_12px_4px_12px] bg-nevo-navy px-4 py-3",
            isNew && "motion-safe:animate-nevo-pop",
          )}
        >
          <p className="text-[14.5px] leading-[1.5] text-nevo-cream">
            <span className="xl:hidden">{m.textTablet ?? m.text}</span>
            <span className="hidden xl:inline">{m.text}</span>
          </p>
          {m.time && (
            <div className="mt-[5px] flex items-center justify-end gap-[5px]">
              <span className="text-[11px] text-nevo-cream/60">{m.time}</span>
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" aria-hidden className="text-nevo-cream/60">
                <path d="M5 12.5l4.2 4.2L19 7" />
              </svg>
            </div>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="flex justify-start">
      <div className="max-w-[62%] rounded-[12px_12px_12px_4px] bg-nevo-cream-elevated px-4 py-3">
        {m.label && (
          <span className="inline-flex items-center gap-[5px] text-[11.5px] font-semibold text-nevo-near-black/50">
            {m.label}
          </span>
        )}
        <p className="mt-1 text-[14.5px] leading-[1.5] text-nevo-near-black">
          <span className="xl:hidden">{m.textTablet ?? m.text}</span>
          <span className="hidden xl:inline">{m.text}</span>
        </p>
      </div>
    </div>
  );
}

export function ConnectView() {
  const { threads, sample, loading, openThread, send: sendLive } =
    useConnectThreads();
  const [activeId, setActiveId] = useState<string | null>(null);
  const [draft, setDraft] = useState("");
  // "Message <name>" on a student profile or session panel lands here with a
  // slug. Seeded in the initialiser rather than an effect: the link is always a
  // fresh mount from another route, and this keeps the modal open on first
  // paint instead of flashing the thread list first.
  const params = useSearchParams();
  const linkedStudent = COMPOSE_STUDENTS.find(
    (s) => studentSlug(s.name) === params.get("student"),
  )?.name;
  // An unknown slug still opens compose - the teacher can search - rather than
  // swallowing the click and looking broken.
  const [composeOpen, setComposeOpen] = useState(
    Boolean(params.get("student")),
  );
  const [presetStudent, setPresetStudent] = useState<string | undefined>(
    linkedStudent,
  );
  const [toast, setToast] = useState("");
  const [newestId, setNewestId] = useState<string | null>(null);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const endRef = useRef<HTMLDivElement>(null);
  /** Monotonic id source - Date.now() is impure and the lint rule rejects it. */
  const seq = useRef(0);
  const nextId = () => `sent-${(seq.current += 1)}`;

  useEffect(
    () => () => {
      if (timer.current) clearTimeout(timer.current);
    },
    [],
  );

  // The list arrives asynchronously, so "the first thread" is derived rather
  // than assigned - setting it from an effect would be a setState during
  // render's shadow, which this codebase rules out.
  const active = threads.find((t) => t.id === activeId) ?? threads[0] ?? null;

  // The list endpoint carries no message bodies, so opening one fetches it.
  useEffect(() => {
    if (active) openThread(active.id);
  }, [active, openThread]);

  const selectThread = (id: string) => {
    setActiveId(id);
    openThread(id);
  };

  const flashToast = (text: string) => {
    setToast(text);
    if (timer.current) clearTimeout(timer.current);
    timer.current = setTimeout(() => setToast(""), TOAST_MS);
  };

  /**
   * C14 B4: the bubble lands, a toast confirms, the thread stays open.
   *
   * The bubble shown is the message the backend stored, not an optimistic
   * copy - a send that fails says so rather than leaving a message on screen
   * that does not exist.
   */
  const deliver = async (
    to: { recipientId: string; recipientType: "student" | "class" },
    text: string,
    toast = true,
  ) => {
    const threadId = await sendLive(to, text);
    if (!threadId) {
      flashToast("That didn’t send – try again");
      return;
    }
    setActiveId(threadId);
    setNewestId(nextId());
    if (toast) flashToast("Message sent");
    requestAnimationFrame(() =>
      endRef.current?.scrollIntoView({ block: "end" }),
    );
  };

  const send = () => {
    const text = draft.trim();
    if (!text || !active?.recipientId) return;
    setDraft("");
    void deliver(
      {
        recipientId: active.recipientId,
        recipientType: active.recipientType === "class" ? "class" : "student",
      },
      text,
    );
  };

  const sendFromCompose = (student: ComposeStudent, text: string) => {
    setPresetStudent(undefined);
    if (!student.studentId) return;
    void deliver(
      { recipientId: student.studentId, recipientType: "student" },
      text,
      false,
    );
  };

  const newMessageButton = (compact?: boolean) => (
    <button
      type="button"
      onClick={() => setComposeOpen(true)}
      className={cn(
        "inline-flex shrink-0 cursor-pointer items-center gap-2 rounded-[10px] bg-nevo-navy font-semibold text-nevo-cream transition-[filter] hover:brightness-93",
        compact
          ? "h-10 px-4 text-[13.5px] xl:h-11 xl:px-5 xl:text-[14.5px]"
          : "h-12 gap-[9px] px-[22px] text-[14.5px] xl:h-[50px] xl:px-6 xl:text-[15px]",
      )}
    >
      <PlusIcon size={compact ? 16 : 17} />
      {compact ? (
        <>
          <span className="xl:hidden">New</span>
          <span className="hidden xl:inline">New message</span>
        </>
      ) : (
        "New message"
      )}
    </button>
  );

  return (
    <div className="relative flex min-h-full flex-1 flex-col">
      {/* Page head */}
      <div className="flex shrink-0 items-center justify-between px-7 pt-[22px] pb-4 xl:px-8 xl:pt-7 xl:pb-5">
        <div className="min-w-0">
          <h2 className="text-[21px] font-semibold tracking-[-0.015em] text-nevo-near-black xl:text-2xl">
            Connect
          </h2>
          {sample && (
            <p className="mt-1 text-[13px] leading-[1.5] text-nevo-near-black/55 italic">
              We couldn&rsquo;t reach your messages, so these are samples.
            </p>
          )}
        </div>
        {newMessageButton(true)}
      </div>

      {loading ? (
        <div className="flex min-h-0 flex-1 border-t border-nevo-near-black/8">
          <div className="w-[260px] shrink-0 space-y-2 border-r border-nevo-near-black/8 p-3 xl:w-[330px]">
            {[0, 1, 2, 3].map((i) => (
              <div
                key={i}
                className="h-[58px] animate-pulse rounded-[10px] bg-nevo-cream-elevated"
              />
            ))}
          </div>
          <div className="flex-1" />
        </div>
      ) : threads.length === 0 ? (
        /* C14 A4 - the governing empty state. */
        <div className="flex flex-1 items-center justify-center border-t border-nevo-near-black/8 p-10 xl:p-12">
          <div className="flex max-w-[380px] flex-col items-center text-center xl:max-w-[420px]">
            <IllustrationWrapper
              src="/illustrations/empty-teacher-connect.png"
              alt="Two figures sitting side by side"
              width={512}
              height={512}
              className="w-[250px] xl:w-[300px]"
            />
            <h3 className="mt-5 text-xl font-semibold tracking-[-0.01em] text-nevo-near-black xl:mt-[22px] xl:text-[21px]">
              Connect with your students
            </h3>
            <p className="mt-2.5 text-[15px] leading-[1.55] text-nevo-near-black/66 xl:mt-[11px] xl:text-[15.5px]">
              <span className="xl:hidden">
                Send a note, or reply when they reach out. Threads will live
                here.
              </span>
              <span className="hidden xl:inline">
                Send a student an encouraging note, or reply when they reach
                out. Threads you start will live here.
              </span>
            </p>
            <div className="mt-[22px] xl:mt-6">{newMessageButton()}</div>
          </div>
        </div>
      ) : (
        <div className="flex min-h-0 flex-1 border-t border-nevo-near-black/8">
          {/* Thread list */}
          <div className="w-[260px] shrink-0 overflow-y-auto border-r border-nevo-near-black/8 p-3 xl:w-[330px]">
            {threads.map((t) => (
              <button
                key={t.id}
                type="button"
                onClick={() => selectThread(t.id)}
                aria-current={t.id === activeId}
                className={cn(
                  "mb-0.5 flex w-full cursor-pointer items-center gap-2.5 rounded-[10px] px-3 py-2.5 text-left transition-colors xl:gap-3 xl:px-3.5 xl:py-3",
                  t.id === activeId
                    ? "bg-nevo-navy/9"
                    : "hover:bg-nevo-navy/5",
                )}
              >
                <span className="flex size-10 shrink-0 items-center justify-center rounded-full bg-nevo-navy/10 text-[13px] font-semibold text-nevo-navy">
                  {t.initials}
                </span>
                <span className="min-w-0 flex-1">
                  <span className="flex items-baseline justify-between gap-2">
                    <span className="text-[14.5px] font-semibold text-nevo-near-black">
                      {t.studentName}
                    </span>
                    <span className="shrink-0 text-[11.5px] text-nevo-near-black/45">
                      {t.time}
                    </span>
                  </span>
                  <span className="mt-[3px] block truncate text-[13px] leading-[1.4] text-nevo-near-black/60">
                    {t.preview}
                  </span>
                </span>
              </button>
            ))}
          </div>

          {/* Thread */}
          {active && (
            <div className="flex min-w-0 flex-1 flex-col">
              <div className="flex shrink-0 items-center justify-between gap-4 border-b border-nevo-near-black/8 px-6 py-4 xl:px-7 xl:py-[18px]">
                <div className="flex items-center gap-3">
                  <span className="flex size-[38px] shrink-0 items-center justify-center rounded-full bg-nevo-navy text-[13px] font-semibold text-nevo-cream">
                    {active.initials}
                  </span>
                  <div>
                    <span className="text-base font-semibold text-nevo-near-black">
                      {active.studentName}
                    </span>
                    <div className="mt-px text-[12.5px] text-nevo-near-black/55">
                      {active.className}
                    </div>
                  </div>
                </div>
              </div>

              <div className="flex min-h-0 flex-1 flex-col justify-end gap-3.5 overflow-y-auto px-6 py-6 xl:px-7">
                {active.messages.map((m) => (
                  <Bubble key={m.id} m={m} isNew={m.id === newestId} />
                ))}
                <div ref={endRef} />
              </div>

              {/* A fixture thread has nobody to send to. Rather than a send
                  button that quietly does nothing, the composer says so. */}
              {!active.recipientId ? (
                <div className="shrink-0 border-t border-nevo-near-black/8 px-6 py-4 xl:px-7">
                  <p className="text-[13.5px] leading-[1.5] text-nevo-near-black/60">
                    This is a sample conversation. Replying will work once we
                    can reach your messages again.
                  </p>
                </div>
              ) : (
              <div className="flex shrink-0 items-center gap-3 border-t border-nevo-near-black/8 px-6 py-4 xl:px-7">
                <input
                  value={draft}
                  onChange={(e) => setDraft(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && !e.shiftKey) {
                      e.preventDefault();
                      send();
                    }
                  }}
                  placeholder="Write a message…"
                  aria-label={`Message ${active.studentName}`}
                  className="h-12 flex-1 rounded-[10px] border-[1.5px] border-nevo-near-black/14 bg-nevo-cream-elevated px-4 text-[14.5px] text-nevo-near-black outline-none transition-colors focus:border-nevo-navy"
                />
                <button
                  type="button"
                  onClick={send}
                  disabled={!draft.trim()}
                  aria-label="Send"
                  className={cn(
                    "flex size-12 shrink-0 items-center justify-center rounded-[10px]",
                    draft.trim()
                      ? "cursor-pointer bg-nevo-navy text-nevo-cream transition-[filter] hover:brightness-93"
                      : "cursor-not-allowed bg-nevo-navy/18 text-nevo-near-black/40",
                  )}
                >
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
                    <path d="M22 2L11 13" />
                    <path d="M22 2l-7 20-4-9-9-4z" />
                  </svg>
                </button>
              </div>
              )}
            </div>
          )}
        </div>
      )}

      {composeOpen && (
        <ComposeModal
          presetStudent={presetStudent}
          onClose={() => {
            setComposeOpen(false);
            setPresetStudent(undefined);
          }}
          onSend={sendFromCompose}
        />
      )}

      {/* C14 NevoToast */}
      {toast && (
        <div
          role="status"
          className="fixed top-5 left-1/2 z-[60] flex -translate-x-1/2 items-center gap-2.5 rounded-full bg-nevo-navy py-3 pr-[22px] pl-[15px] shadow-[0_12px_32px_rgba(0,0,0,0.22)] motion-safe:animate-nevo-pop xl:top-6"
        >
          <span className="flex size-[22px] shrink-0 items-center justify-center rounded-full bg-nevo-cream/20 text-nevo-cream">
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
              <path d="M20 6L9 17l-5-5" />
            </svg>
          </span>
          <span className="text-[14.5px] font-semibold whitespace-nowrap text-nevo-cream">
            {toast}
          </span>
        </div>
      )}
    </div>
  );
}
