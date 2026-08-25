"use client";

import { useContext, useEffect, useRef, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { Mic, MessageCircle, Send } from "lucide-react";
import { Sheet, SheetContent, SheetTitle } from "@/components/ui/sheet";
import { NevoKeyboard, useNevoKeyboardDock } from "@/components/shared";
import { askNevoApi, asUuid } from "@/lib/api";
import { LessonContext } from "@/context/LessonContext";
import { useAuth } from "@/hooks";
import { cn, randomId } from "@/lib/utils";

/** The minimum "Nevo is thinking" beat - real answers never land jarringly
 *  fast, and the mock fallback keeps its original calm pacing. */
const LIVE_TIMEOUT_MS = 15000;
const THINKING_MS = 1600;
/** Mic toast lifetime. */
const TOAST_MS = 3200;

/**
 * Device-native speech recognition (SCRUM-51): v1 delegates entirely to the
 * OS recogniser via the Web Speech API - no Nevo voice model, no API key, no
 * audio ever stored. A Nevo-owned model is v2.
 */
interface SpeechRecognitionLike {
  continuous: boolean;
  interimResults: boolean;
  onresult: ((e: SpeechResultEventLike) => void) | null;
  onerror: ((e: { error?: string }) => void) | null;
  onend: (() => void) | null;
  start: () => void;
  stop: () => void;
}
interface SpeechResultEventLike {
  resultIndex: number;
  results: ArrayLike<{ isFinal: boolean; 0: { transcript: string } }>;
}
function speechRecognitionCtor(): (new () => SpeechRecognitionLike) | null {
  const w = window as unknown as {
    SpeechRecognition?: new () => SpeechRecognitionLike;
    webkitSpeechRecognition?: new () => SpeechRecognitionLike;
  };
  return w.SpeechRecognition ?? w.webkitSpeechRecognition ?? null;
}

const PROMPTS = ["Explain this differently", "Give me a hint", "I'm stuck"];

interface Message {
  who: "user" | "nevo";
  text: string;
  /** The hands-to-teacher reply carries its action (frame's cannot-help state). */
  teacherAction?: boolean;
  /** Backend interaction id - carried for the helpfulness vote once the
   *  frame set gains that control (endpoint is live, UI is flagged to design). */
  interactionId?: string;
  /** A canned stand-in shown because the live assistant didn't answer. */
  sample?: boolean;
}

/**
 * Mock reply engine - calm, canned, and honest about its limits. Now the
 * FALLBACK: the live assistant answers first (`askNevoApi.ask`); without a
 * session (or on any failure) the drawer answers from here so it never goes
 * silent. The cannot-help boundary stays: anything for the teacher is handed
 * to the teacher, never absorbed.
 */
function replyFor(text: string): Message {
  const t = text.toLowerCase();
  if (t.includes("teacher"))
    return {
      who: "nevo",
      text: "That's something your teacher can help with best. Would you like me to let them know?",
      teacherAction: true,
    };
  if (t.includes("different") || t.includes("explain"))
    return {
      who: "nevo",
      text: "Sure! Think of a fraction like slices of pizza. If you have 1 out of 4 slices, that's one quarter. Want to try one together?",
    };
  if (t.includes("hint"))
    return {
      who: "nevo",
      text: "Here's a nudge: look at the bottom numbers first. When they match, you're already halfway there.",
    };
  if (t.includes("stuck"))
    return {
      who: "nevo",
      text: "That's okay - stuck is where the learning happens. Tell me the part that feels muddy and we'll take it slowly.",
    };
  return {
    who: "nevo",
    text: "Let's look at that together. Can you tell me a bit more about what you're working on?",
  };
}

/**
 * Ask Nevo (screen 26 / `Nevo Ask Nevo Frame`) - one drawer, every state.
 * Always reachable from the app tabs, never interruptive: a docked button on
 * mobile, a corner pill on desktop, opening a full-width bottom sheet (mobile)
 * or right side drawer (tablet/desktop). Suggested prompts, conversation,
 * "Nevo is thinking" dots, the cannot-help hand-to-teacher state, Nevo
 * Keyboard entry (A.12) and the microphone flow with a calm denied toast.
 */
export function AskNevo() {
  const router = useRouter();
  const pathname = usePathname();
  const { user } = useAuth();
  // Tolerant read: the drawer lives in the tab shell, OUTSIDE the lesson
  // route's LessonProvider - the strict useLesson() would throw there. When a
  // provider is present (future in-player drawer), the active lesson scopes
  // the question.
  const lessonId = useContext(LessonContext)?.lessonId ?? null;
  // One conversation thread per mount - continuity for the backend assistant.
  const threadId = useRef(randomId());
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [thinking, setThinking] = useState(false);
  const [input, setInput] = useState("");
  const [recording, setRecording] = useState(false);
  const [toast, setToast] = useState<string | null>(null);
  const kb = useNevoKeyboardDock();
  const threadRef = useRef<HTMLDivElement | null>(null);
  const timers = useRef<ReturnType<typeof setTimeout>[]>([]);
  const recognition = useRef<SpeechRecognitionLike | null>(null);
  // Text committed before/between utterances; interim results render after it.
  const transcriptBase = useRef("");

  const alive = useRef(true);

  useEffect(() => {
    const t = timers.current;
    alive.current = true;
    return () => {
      alive.current = false;
      t.forEach(clearTimeout);
      recognition.current?.stop();
    };
  }, []);

  const later = (fn: () => void, ms: number) => {
    timers.current.push(setTimeout(fn, ms));
  };

  const send = (raw?: string) => {
    const text = (raw ?? input).trim();
    if (!text || thinking) return; // pressable, not disabled - an empty send just rests
    setInput("");
    recognition.current?.stop();
    setRecording(false);
    setMessages((m) => [...m, { who: "user", text }]);
    setThinking(true);

    // Live assistant first; the mock engine answers when the backend can't
    // (no session yet, offline). The answer lands no earlier than the
    // thinking beat, so a fast response never arrives jarringly.
    const beat = new Promise<void>((resolve) => later(resolve, THINKING_MS));
    // Capped: a cold backend must never leave the dots spinning forever -
    // the mock engine answers instead.
    const live = askNevoApi
      .ask({
        role: "student",
        currentPage: pathname,
        contextIds: {
          studentId: asUuid(user?.id),
          lessonId: asUuid(lessonId),
          threadId: asUuid(threadId.current),
        },
        question: text,
      })
      .catch(() => null);
    const answer = Promise.race([
      live,
      new Promise<null>((resolve) => later(() => resolve(null), LIVE_TIMEOUT_MS)),
    ]);
    void Promise.all([answer, beat]).then(([res]) => {
      if (!alive.current) return;
      setMessages((m) => [
        ...m,
        res
          ? { who: "nevo", text: res.answer, interactionId: res.interaction_id }
          : // Say so. A student cannot tell a canned reply from real tutoring,
            // and they are the last person who should have to.
            { ...replyFor(text), sample: true },
      ]);
      setThinking(false);
    });
  };

  // Scroll the newest message into view.
  useEffect(() => {
    threadRef.current?.scrollTo({ top: threadRef.current.scrollHeight });
  }, [messages, thinking]);

  const showToast = (message: string) => {
    setToast(message);
    later(() => setToast(null), TOAST_MS);
  };

  const toggleMic = () => {
    if (recording) {
      // Stop = transcription complete; the text waits for review before send
      // (never auto-sent - SCRUM-51).
      recognition.current?.stop();
      setRecording(false);
      return;
    }
    const Ctor = speechRecognitionCtor();
    if (!Ctor) {
      showToast("Voice input isn't available on this device.");
      return;
    }
    const rec = new Ctor();
    rec.continuous = true;
    rec.interimResults = true;
    transcriptBase.current = input.trim() ? `${input.trim()} ` : "";
    rec.onresult = (e) => {
      let interim = "";
      for (let i = e.resultIndex; i < e.results.length; i++) {
        const r = e.results[i];
        if (r.isFinal) transcriptBase.current += `${r[0].transcript.trim()} `;
        else interim += r[0].transcript;
      }
      setInput((transcriptBase.current + interim).trimStart());
    };
    rec.onerror = (e) => {
      if (e.error === "not-allowed" || e.error === "service-not-allowed")
        showToast("Microphone access needed. Check your device settings.");
      setRecording(false);
    };
    rec.onend = () => setRecording(false);
    recognition.current = rec;
    try {
      rec.start();
      setRecording(true);
    } catch {
      showToast("Voice input isn't available on this device.");
    }
  };

  return (
    <>
      {/* Idle affordances - docked button (mobile), corner pill (desktop). */}
      <button
        type="button"
        aria-label="Ask Nevo"
        onClick={() => setOpen(true)}
        className="fixed right-[18px] bottom-[82px] z-30 flex size-[52px] cursor-pointer items-center justify-center rounded-full bg-nevo-navy text-nevo-cream shadow-[0_6px_20px_rgba(43,43,47,0.22)] transition-[filter,transform] hover:brightness-108 active:scale-[0.96] md:hidden"
      >
        <MessageCircle className="size-6" strokeWidth={2} />
      </button>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="fixed right-6 bottom-6 z-30 hidden h-11 cursor-pointer items-center gap-2 rounded-full bg-nevo-navy px-[18px] text-sm font-medium text-nevo-cream shadow-[0_6px_20px_rgba(43,43,47,0.22)] transition-[filter,transform] hover:brightness-108 active:scale-[0.98] md:flex"
      >
        <MessageCircle className="size-[18px]" strokeWidth={2} />
        Ask Nevo
      </button>

      <Sheet open={open} onOpenChange={setOpen}>
        <SheetContent
          side="bottom"
          aria-describedby={undefined}
          // The `!` marks out-shout the stock data-[side=bottom] variants
          // (class + attribute selectors), same as the preview sheet.
          className="flex h-[88%] flex-col gap-0 rounded-t-[20px] border-0! bg-nevo-cream p-0 text-nevo-near-black shadow-[0_-8px_32px_rgba(0,0,0,0.16)] sm:inset-x-auto! sm:top-0! sm:right-0! sm:left-auto! sm:h-full! sm:w-[412px] sm:rounded-none! sm:shadow-[-8px_0_32px_rgba(0,0,0,0.16)] lg:w-[460px]"
        >
          {/* Header */}
          <div className="flex h-14 shrink-0 items-center border-b border-nevo-near-black/8 px-5">
            <SheetTitle className="text-[17px] font-semibold text-nevo-near-black">
              Ask Nevo
            </SheetTitle>
          </div>

          {/* Thread */}
          <div ref={threadRef} className="min-h-0 flex-1 overflow-y-auto p-5">
            <p className="mb-3 text-[15px] font-medium text-nevo-near-black">
              What can I help with?
            </p>
            <div className="flex flex-wrap gap-2">
              {PROMPTS.map((prompt) => (
                <button
                  key={prompt}
                  type="button"
                  onClick={() => send(prompt)}
                  className="inline-flex h-11 cursor-pointer items-center rounded-full border-[1.5px] border-nevo-violet/70 px-3.5 text-[13px] text-nevo-navy transition-colors hover:bg-nevo-violet/10 active:scale-[0.98]"
                >
                  {prompt}
                </button>
              ))}
            </div>

            <div className="mt-4 flex flex-col gap-3">
              {messages.map((message, i) =>
                message.who === "user" ? (
                  <div key={i} className="flex justify-end">
                    <div className="max-w-[82%] rounded-2xl rounded-br-[5px] bg-nevo-navy/15 px-3.5 py-2.5 text-[15px] leading-[1.4]">
                      {message.text}
                    </div>
                  </div>
                ) : (
                  <div key={i} className="flex justify-start">
                    <div className="flex max-w-[88%] flex-col gap-3 rounded-2xl rounded-bl-[5px] bg-nevo-violet/22 px-3.5 py-3 text-[15px] leading-[1.5]">
                      {message.text}
                      {message.sample && (
                        <span className="text-[12.5px] leading-[1.4] text-nevo-near-black/60 italic">
                          I couldn&rsquo;t connect just now, so this is a
                          sample answer.
                        </span>
                      )}
                      {message.teacherAction && (
                        <button
                          type="button"
                          onClick={() => router.push("/student/connect")}
                          className="inline-flex h-10 cursor-pointer items-center gap-2 self-start rounded-[10px] bg-nevo-navy px-4 text-sm font-medium text-nevo-cream transition-[filter] hover:brightness-108 active:scale-[0.98]"
                        >
                          <MessageCircle className="size-4" strokeWidth={2} />
                          Message my teacher
                        </button>
                      )}
                    </div>
                  </div>
                ),
              )}
              {thinking && (
                <div className="flex flex-col items-start gap-2">
                  <div className="flex items-center gap-1.5 rounded-2xl rounded-bl-[5px] bg-nevo-violet/22 px-4 py-3.5">
                    {[0, 160, 320].map((delay) => (
                      <span
                        key={delay}
                        className="block size-[7px] rounded-full bg-nevo-navy motion-safe:animate-nevo-dot"
                        style={{ animationDelay: `${delay}ms` }}
                      />
                    ))}
                  </div>
                  <span className="ml-1 text-[13px] text-nevo-near-black/55">
                    Nevo is thinking…
                  </span>
                </div>
              )}
            </div>
          </div>

          {/* Composer */}
          <div className="relative shrink-0 border-t border-nevo-near-black/8 px-4 py-3">
            <div
              className={cn(
                "flex h-11 items-center gap-1 rounded-full border-[1.5px] bg-nevo-cream pl-3.5 transition-colors",
                kb.open || recording
                  ? "border-nevo-navy"
                  : "border-nevo-near-black/16",
              )}
            >
              <input
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onFocus={kb.onFocus}
                onBlur={kb.onBlur}
                onKeyDown={(e) => {
                  if (e.key === "Enter") send();
                }}
                // A.12: the Nevo Keyboard drives entry on touch; hardware
                // keyboards still type on desktop.
                inputMode="none"
                placeholder={recording ? "Listening…" : "Ask a question"}
                aria-label="Ask a question"
                className={cn(
                  "min-w-0 flex-1 bg-transparent text-[15px] outline-none placeholder:text-nevo-near-black/40",
                  recording && "placeholder:text-nevo-near-black/50",
                )}
              />
              <button
                type="button"
                aria-label={recording ? "Stop listening" : "Speak your question"}
                aria-pressed={recording}
                onClick={toggleMic}
                className={cn(
                  "flex size-11 shrink-0 cursor-pointer items-center justify-center",
                  recording
                    ? "text-nevo-violet motion-safe:animate-nevo-mic-pulse"
                    : "text-nevo-near-black",
                )}
              >
                <Mic className="size-5" strokeWidth={2} />
              </button>
              <button
                type="button"
                aria-label="Send"
                onClick={() => send()}
                className="flex size-11 shrink-0 cursor-pointer items-center justify-center"
              >
                <span className="flex size-8 items-center justify-center rounded-full bg-nevo-navy text-nevo-cream transition-[filter] hover:brightness-108">
                  <Send className="size-4" strokeWidth={2} />
                </span>
              </button>
            </div>

            {/* Mic denied/unavailable - a calm toast, never an error state. */}
            {toast && (
              <div className="absolute inset-x-4 bottom-[70px] z-10 rounded-[10px] bg-nevo-navy px-3.5 py-3 text-[13px] leading-[1.45] text-nevo-cream shadow-[0_8px_32px_rgba(0,0,0,0.16)] motion-safe:animate-in motion-safe:fade-in-0 motion-safe:slide-in-from-bottom-1 motion-safe:duration-200">
                {toast}
              </div>
            )}
          </div>

          {kb.open && (
            <NevoKeyboard
              layout="qwerty"
              onKey={(c) => setInput((v) => v + c)}
              onBackspace={() => setInput((v) => v.slice(0, -1))}
              onReturn={() => {
                kb.close();
                send();
              }}
              className="shrink-0 lg:hidden"
            />
          )}
        </SheetContent>
      </Sheet>
    </>
  );
}
