"use client";

import { useEffect, useRef, useState } from "react";
import { ChevronLeft, Send } from "lucide-react";
import { cn } from "@/lib/utils";
import { THREADS, type Message, type Thread } from "./connectData";

/** Simulated delivery latency for an optimistic message. */
const DELIVER_MS = 1100;

/**
 * Connect Tab (screen 25) — the student's messages with their teacher (and,
 * once the teacher adds one, a parent). Two panes on tablet/desktop (thread list
 * + conversation); a single pane with a back button on mobile.
 *
 * v1 is a UI shell over mock threads — sending is optimistic and delivery is
 * simulated. TODO(api): real threads, messages, and send.
 */
export function ConnectTab() {
  // Messages live in state so sending/delivery can update them.
  const [threads, setThreads] = useState<Thread[]>(THREADS);
  const [activeId, setActiveId] = useState<string>(THREADS[0].id);
  // Mobile only: which pane is showing.
  const [mobileView, setMobileView] = useState<"list" | "thread">("list");
  const [draft, setDraft] = useState("");

  const timers = useRef<ReturnType<typeof setTimeout>[]>([]);
  const nextId = useRef(0);
  useEffect(() => {
    const active = timers.current;
    return () => active.forEach(clearTimeout);
  }, []);

  const active = threads.find((t) => t.id === activeId) ?? threads[0];

  const setMessages = (threadId: string, fn: (m: Message[]) => Message[]) =>
    setThreads((ts) =>
      ts.map((t) =>
        t.id === threadId ? { ...t, messages: fn(t.messages) } : t,
      ),
    );

  const deliverLater = (threadId: string, msgId: string) => {
    timers.current.push(
      setTimeout(
        () =>
          setMessages(threadId, (m) =>
            m.map((x) => (x.id === msgId ? { ...x, status: "delivered" } : x)),
          ),
        DELIVER_MS,
      ),
    );
  };

  const send = () => {
    const text = draft.trim();
    if (!text) return;
    const id = `m-${nextId.current++}`;
    setMessages(active.id, (m) => [
      ...m,
      { id, who: "me", text, status: "sending" },
    ]);
    setDraft("");
    deliverLater(active.id, id);
  };

  const retry = (msgId: string) => {
    setMessages(active.id, (m) =>
      m.map((x) => (x.id === msgId ? { ...x, status: "sending" } : x)),
    );
    deliverLater(active.id, msgId);
  };

  const openThread = (id: string) => {
    setActiveId(id);
    setThreads((ts) =>
      ts.map((t) => (t.id === id ? { ...t, unread: false } : t)),
    );
    setMobileView("thread");
  };

  return (
    <div className="flex h-full min-h-0">
      {/* Thread list — always on md+, on mobile only in list view */}
      <aside
        className={cn(
          "w-full shrink-0 flex-col border-nevo-near-black/8 md:flex md:w-[300px] md:border-r",
          mobileView === "list" ? "flex" : "hidden",
        )}
      >
        <div className="px-5 pt-5 pb-3">
          <h1 className="text-[22px] font-semibold tracking-[-0.01em] text-nevo-near-black">
            Connect
          </h1>
        </div>
        <div className="min-h-0 flex-1 overflow-y-auto px-3">
          {threads.map((thread) => (
            <button
              key={thread.id}
              type="button"
              onClick={() => openThread(thread.id)}
              aria-current={thread.id === activeId}
              className={cn(
                "mb-0.5 flex w-full items-center gap-3 rounded-[12px] p-3 text-left transition-colors",
                thread.id === activeId
                  ? "bg-nevo-violet/16"
                  : "hover:bg-nevo-near-black/[0.04]",
              )}
            >
              <Avatar thread={thread} />
              <span className="min-w-0 flex-1">
                <span className="flex items-center gap-1.5">
                  <span className="text-[15px] font-medium text-nevo-near-black">
                    {thread.name}
                  </span>
                  {thread.unread && (
                    <span className="size-1.5 rounded-full bg-nevo-violet" />
                  )}
                </span>
                <span className="mt-0.5 block truncate text-[13px] text-nevo-near-black/60">
                  {thread.messages[thread.messages.length - 1]?.text}
                </span>
              </span>
            </button>
          ))}
        </div>
      </aside>

      {/* Conversation — always on md+, on mobile only in thread view */}
      <section
        className={cn(
          "min-w-0 flex-1 flex-col md:flex",
          mobileView === "thread" ? "flex" : "hidden",
        )}
      >
        <header className="relative flex h-14 shrink-0 items-center justify-center border-b border-nevo-near-black/8">
          <button
            type="button"
            aria-label="Back to messages"
            onClick={() => setMobileView("list")}
            className="absolute left-2 flex size-11 items-center justify-center rounded-[10px] transition-colors hover:bg-nevo-near-black/[0.06] md:hidden"
          >
            <ChevronLeft className="size-6 text-nevo-near-black" strokeWidth={2} />
          </button>
          <span className="text-base font-medium text-nevo-near-black">
            {active.name}
          </span>
        </header>

        <div className="flex min-h-0 flex-1 flex-col gap-2.5 overflow-y-auto p-5">
          {active.messages.map((message) => (
            <MessageBubble
              key={message.id}
              message={message}
              onRetry={() => retry(message.id)}
            />
          ))}
        </div>

        <div className="flex shrink-0 items-center gap-2.5 border-t border-nevo-near-black/8 px-4 py-3">
          <input
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                send();
              }
            }}
            placeholder="Type a message"
            aria-label={`Message ${active.name}`}
            className="h-11 flex-1 rounded-full border-[1.5px] border-nevo-near-black/16 bg-nevo-cream px-4 text-[15px] text-nevo-near-black outline-none transition-colors focus:border-nevo-navy"
          />
          <button
            type="button"
            aria-label="Send"
            onClick={send}
            className="flex size-11 shrink-0 cursor-pointer items-center justify-center rounded-full bg-nevo-navy text-nevo-cream transition-transform active:scale-[0.98]"
          >
            <Send className="size-5" strokeWidth={2} />
          </button>
        </div>
      </section>
    </div>
  );
}

function Avatar({ thread }: { thread: Thread }) {
  return (
    <span
      className={cn(
        "flex size-10 shrink-0 items-center justify-center rounded-full text-sm font-semibold text-nevo-cream",
        thread.accent === "navy" ? "bg-nevo-navy" : "bg-nevo-violet",
      )}
    >
      {thread.initials}
    </span>
  );
}

function MessageBubble({
  message,
  onRetry,
}: {
  message: Message;
  onRetry: () => void;
}) {
  const me = message.who === "me";
  return (
    <div
      className={cn(
        "flex flex-col gap-1 motion-safe:animate-in motion-safe:fade-in-0 motion-safe:slide-in-from-bottom-1 motion-safe:duration-300",
        me ? "items-end" : "items-start",
      )}
    >
      <div
        className={cn(
          "max-w-[75%] rounded-2xl px-3.5 py-2.5 text-[15px] leading-[1.4] text-nevo-near-black",
          me
            ? "rounded-br-[5px] bg-nevo-navy/15"
            : "rounded-bl-[5px] border border-nevo-violet/50 bg-nevo-cream",
          message.status === "failed" && "opacity-60",
        )}
      >
        {message.text}
      </div>
      {me && message.status !== "none" && (
        <MessageStatusLine message={message} onRetry={onRetry} />
      )}
    </div>
  );
}

function MessageStatusLine({
  message,
  onRetry,
}: {
  message: Message;
  onRetry: () => void;
}) {
  if (message.status === "sending") {
    return (
      <span className="flex items-center gap-1.5 px-1 text-xs text-nevo-near-black/50">
        <span className="block size-3 rounded-full border-2 border-nevo-navy/25 border-t-nevo-navy motion-safe:animate-spin motion-safe:[animation-duration:700ms]" />
        Sending…
      </span>
    );
  }
  if (message.status === "delivered") {
    return (
      <span className="px-1 text-xs text-nevo-near-black/45">Delivered</span>
    );
  }
  // failed — warm, never alarming; tap to retry.
  return (
    <button
      type="button"
      onClick={onRetry}
      className="flex cursor-pointer items-center gap-1.5 px-1 text-xs text-nevo-violet"
    >
      <span className="size-1.5 rounded-full bg-nevo-violet" />
      Didn&apos;t send — tap to try again
    </button>
  );
}
