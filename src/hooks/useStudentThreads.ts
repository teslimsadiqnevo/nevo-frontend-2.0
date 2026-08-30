"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { messagesApi } from "@/lib/api/messages";
import { getSession, getToken } from "@/lib/auth/session";
import { THREADS, type Message, type Thread } from "@/components/student/Connect/connectData";
import { useHasSession } from "./useHasSession";

/**
 * The student's conversations, from `/api/messages/*`.
 *
 * READ ONLY, and not by omission. `POST /api/messages` constrains
 * `recipientType` to `^(student|class)$` - there is no `teacher` value - so a
 * student cannot address their teacher through the messaging contract at all.
 * The model is one-directional today: staff write to a student or a class.
 * Until that changes, the composer says so rather than dropping a child's
 * message into a request that cannot be addressed. Logged as a student
 * blocker.
 *
 * As on the teacher side, the thread list carries no message bodies, so a
 * thread is fetched when first opened and kept. Threads carry no unread
 * state either - the dot is off until an endpoint reports one.
 */

export interface StudentThreads {
  threads: Thread[];
  live: boolean;
  loading: boolean;
  openThread: (threadId: string) => void;
}

function initialsOf(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length >= 2) return (parts[0][0] + parts[1][0]).toUpperCase();
  return (parts[0] ?? "?").slice(0, 2).toUpperCase();
}

export function useStudentThreads(): StudentThreads {
  const signedIn = useHasSession();
  const [live, setLive] = useState<Thread[] | null>(null);
  const [failed, setFailed] = useState(false);
  const requested = useRef<Set<string>>(new Set());
  const selfId = getSession()?.userId;

  useEffect(() => {
    if (!getToken()) return;
    let cancelled = false;
    void messagesApi
      .threads()
      .then((res) => {
        if (cancelled) return;
        setLive(
          res.threads.map((t, i) => ({
            id: t.threadId,
            name: t.title,
            initials: initialsOf(t.title),
            // No accent in the contract; the frame alternates, so we do too.
            accent: i % 2 === 0 ? ("navy" as const) : ("violet" as const),
            // No unread state exists - see the docblock.
            unread: false,
            messages: [],
          })),
        );
      })
      .catch(() => {
        if (!cancelled) setFailed(true);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const openThread = useCallback(
    (threadId: string) => {
      if (!getToken() || requested.current.has(threadId)) return;
      requested.current.add(threadId);
      void messagesApi
        .thread(threadId)
        .then((body) => {
          setLive(
            (cur) =>
              cur?.map((t) =>
                t.id === threadId
                  ? {
                      ...t,
                      messages: body.messages.map<Message>((m) => ({
                        id: m.messageId,
                        who: selfId && m.senderId === selfId ? "me" : "them",
                        text: m.content,
                        status: "none",
                      })),
                    }
                  : t,
              ) ?? cur,
          );
        })
        .catch(() => {
          // Leave it unloaded so reopening retries.
          requested.current.delete(threadId);
        });
    },
    [selfId],
  );

  if (!signedIn) {
    return { threads: THREADS, live: false, loading: false, openThread };
  }
  return {
    threads: live ?? [],
    live: true,
    loading: live === null && !failed,
    openThread,
  };
}
