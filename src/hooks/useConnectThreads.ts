"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import {
  messagesApi,
  type ChatMessage,
  type MessageThread,
  type RecipientType,
} from "@/lib/api/messages";
import { getSession, getToken } from "@/lib/auth/session";
import { THREADS, type Message } from "@/lib/mocks/teacherConnect";
import { useHasSession } from "./useHasSession";

/**
 * Connect's conversations, live from `/api/messages/*`.
 *
 * The thread list arrives without its messages, so a thread's body is fetched
 * when it is first opened and kept thereafter. Sending posts to
 * `POST /api/messages`, which finds or creates the school-scoped thread and
 * returns the stored message - so the bubble a teacher sees is the one the
 * backend actually saved, not an optimistic copy of it.
 *
 * WHAT THE CONTRACT DOES NOT CARRY. A thread has a `title` and nothing else
 * identifying: no class, no avatar. The fixtures show a class under each name;
 * a live thread simply does not, rather than guessing which class a student is
 * in.
 *
 * Fixtures back the designed screens when there is no live data, and say so.
 *
 * TODO(api): a class on the thread, and unread state - neither exists.
 */

const LIVE_TIMEOUT_MS = 6000;

export interface ConnectThread {
  id: string;
  studentName: string;
  initials: string;
  /** "" when live - the thread carries no class. */
  className: string;
  preview: string;
  time: string;
  messages: Message[];
  /** Null on fixtures; the send target for a live thread. */
  recipientId: string | null;
  recipientType: RecipientType | (string & {});
  /** Whether the body has been fetched yet. */
  loaded: boolean;
}

function initialsOf(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length >= 2) {
    return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
  }
  return (parts[0] ?? "?").slice(0, 2).toUpperCase();
}

/** The frame's compact list stamp: "2m", "4h", "Tue". */
export function shortStamp(iso: string): string {
  const then = new Date(iso).getTime();
  const mins = Math.floor((Date.now() - then) / 60_000);
  if (mins < 1) return "now";
  if (mins < 60) return `${mins}m`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days}d`;
  return new Date(iso).toLocaleDateString("en-GB", {
    day: "numeric",
    month: "short",
  });
}

function clockStamp(iso: string): string {
  return new Date(iso).toLocaleTimeString("en-GB", {
    hour: "2-digit",
    minute: "2-digit",
  });
}

function toThread(t: MessageThread): ConnectThread {
  return {
    id: t.threadId,
    studentName: t.title,
    initials: initialsOf(t.title),
    className: "",
    preview: t.latestPreview ?? "",
    time: shortStamp(t.lastMessageAt),
    messages: [],
    recipientId: t.recipientId,
    recipientType: t.recipientType,
    loaded: false,
  };
}

function toMessage(m: ChatMessage, selfId: string | undefined): Message {
  const mine = Boolean(selfId && m.senderId === selfId);
  return {
    id: m.messageId,
    from: mine ? "teacher" : "student",
    label: mine ? undefined : (m.senderName ?? undefined),
    text: m.content,
    time: clockStamp(m.createdAt),
  };
}

const FIXTURE_THREADS: ConnectThread[] = THREADS.map((t) => ({
  ...t,
  recipientId: null,
  recipientType: "student",
  loaded: true,
}));

export interface ConnectState {
  threads: ConnectThread[];
  live: boolean;
  sample: boolean;
  loading: boolean;
  /** Fetch a thread's messages the first time it is opened. */
  openThread: (threadId: string) => void;
  /** Send into an existing thread, or start one with a student. */
  send: (
    to: { recipientId: string; recipientType: RecipientType },
    content: string,
  ) => Promise<string | null>;
}

export function useConnectThreads(): ConnectState {
  const [live, setLive] = useState<ConnectThread[] | null>(null);
  const [failed, setFailed] = useState(false);
  const signedIn = useHasSession();
  const loading = signedIn && live === null && !failed;
  const selfId = getSession()?.userId;

  useEffect(() => {
    if (!getToken()) return;
    let cancelled = false;
    const timers: ReturnType<typeof setTimeout>[] = [];
    const timeout = new Promise<null>((resolve) => {
      timers.push(setTimeout(() => resolve(null), LIVE_TIMEOUT_MS));
    });
    void Promise.race([messagesApi.threads().catch(() => null), timeout]).then(
      (res) => {
        if (cancelled) return;
        if (res) setLive(res.threads.map(toThread));
        else setFailed(true);
      },
    );
    return () => {
      cancelled = true;
      timers.forEach(clearTimeout);
    };
  }, []);

  // Which bodies we have already asked for. A ref, not state, so that opening
  // a thread does not setState during render or inside an effect body - the
  // fetch's own callback is the only thing that updates.
  const requested = useRef<Set<string>>(new Set());

  const openThread = useCallback(
    (threadId: string) => {
      if (!getToken() || requested.current.has(threadId)) return;
      requested.current.add(threadId);
      void messagesApi
        .thread(threadId)
        .then((body) => {
          setLive(
            (cur) =>
              cur?.map((x) =>
                x.id === threadId
                  ? {
                      ...x,
                      loaded: true,
                      messages: body.messages.map((m) => toMessage(m, selfId)),
                    }
                  : x,
              ) ?? cur,
          );
        })
        .catch(() => {
          // Let it be retried: the thread shows an empty body rather than a
          // half-written one, and reopening asks again.
          requested.current.delete(threadId);
        });
    },
    [selfId],
  );

  const send = useCallback(
    async (
      to: { recipientId: string; recipientType: RecipientType },
      content: string,
    ): Promise<string | null> => {
      try {
        const saved = await messagesApi.send({ ...to, content });
        const msg = toMessage(saved, selfId);
        setLive((ts) => {
          const existing = ts?.find((t) => t.id === saved.threadId);
          if (!ts) return ts;
          if (existing) {
            return ts.map((t) =>
              t.id === saved.threadId
                ? {
                    ...t,
                    preview: `You: ${content}`,
                    time: "now",
                    messages: [...t.messages, msg],
                  }
                : t,
            );
          }
          return [
            {
              id: saved.threadId,
              studentName: saved.senderName ?? "New conversation",
              initials: initialsOf(saved.senderName ?? "?"),
              className: "",
              preview: `You: ${content}`,
              time: "now",
              messages: [msg],
              recipientId: to.recipientId,
              recipientType: to.recipientType,
              loaded: true,
            },
            ...ts,
          ];
        });
        return saved.threadId;
      } catch {
        return null;
      }
    },
    [selfId],
  );

  if (live === null) {
    return {
      threads: FIXTURE_THREADS,
      live: false,
      sample: failed,
      loading,
      openThread,
      send,
    };
  }
  return { threads: live, live: true, sample: false, loading, openThread, send };
}
