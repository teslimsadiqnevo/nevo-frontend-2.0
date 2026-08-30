"use client";

import {
  createContext,
  useCallback,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { notificationsApi, type Notification } from "@/lib/api/notifications";
import { getToken } from "@/lib/auth/session";
import { useHasSession } from "@/hooks/useHasSession";

export interface NotificationItem {
  id: string;
  /** Plain-language line ("A new lesson is ready for you"). */
  text: string;
  /** Compact age label ("2h", "1d"). */
  ago: string;
  read?: boolean;
}

export interface NotificationContextValue {
  unreadCount: number;
  notifications: NotificationItem[];
  refresh: () => void;
}

export const NotificationContext = createContext<
  NotificationContextValue | undefined
>(undefined);

/**
 * Board 28's demo items - the signed-out designed screens only.
 *
 * A signed-in student whose feed fails sees NOTHING rather than these. "Ms
 * Okafor sent you a message" is a claim about a real teacher and a message
 * that does not exist; an empty bell is merely quiet, which is the same rule
 * the teacher console follows.
 */
const MOCK_NOTIFICATIONS: NotificationItem[] = [
  { id: "n1", text: "A new lesson is ready for you", ago: "2h" },
  { id: "n2", text: "Ms Okafor sent you a message", ago: "1d", read: true },
];

/** The frame's compact stamp: "2h", "1d". */
function ago(iso: string): string {
  const mins = Math.floor((Date.now() - new Date(iso).getTime()) / 60_000);
  if (mins < 1) return "now";
  if (mins < 60) return `${mins}m`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days}d`;
  return `${Math.floor(days / 7)}w`;
}

function toItem(n: Notification): NotificationItem {
  return {
    // The feed carries a title and a description; the bell shows one line,
    // and the description is the sentence.
    id: n.notificationId,
    text: n.description || n.title,
    ago: ago(n.createdAt),
    read: n.read,
  };
}

export function NotificationProvider({ children }: { children: ReactNode }) {
  const signedIn = useHasSession();
  const [feed, setFeed] = useState<Notification[] | null>(null);
  const [unread, setUnread] = useState(0);
  /** Bumped by `refresh` to re-run the fetch. */
  const [nonce, setNonce] = useState(0);

  useEffect(() => {
    if (!getToken()) return;
    let cancelled = false;
    void notificationsApi
      .list()
      .then((res) => {
        if (cancelled) return;
        setFeed(res.notifications);
        setUnread(res.unreadCount);
      })
      .catch(() => {
        // An unreachable feed is an empty bell, never the fixtures.
        if (!cancelled) {
          setFeed([]);
          setUnread(0);
        }
      });
    return () => {
      cancelled = true;
    };
  }, [nonce]);

  const refresh = useCallback(() => setNonce((n) => n + 1), []);

  const value = useMemo<NotificationContextValue>(() => {
    if (!signedIn) {
      return {
        notifications: MOCK_NOTIFICATIONS,
        unreadCount: MOCK_NOTIFICATIONS.filter((n) => !n.read).length,
        refresh,
      };
    }
    return {
      notifications: (feed ?? []).map(toItem),
      unreadCount: unread,
      refresh,
    };
  }, [signedIn, feed, unread, refresh]);

  return (
    <NotificationContext.Provider value={value}>
      {children}
    </NotificationContext.Provider>
  );
}
