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
  /** The headline ("A new lesson is ready"). */
  title: string;
  /**
   * The sentence under it. The feed carries BOTH a title and a description,
   * and this used to collapse them to `description || title` - so every
   * notification arrived with half of it discarded, and which half depended
   * on whether the backend had written a description.
   */
  text?: string;
  /** Compact age label ("2h", "1d"). */
  ago: string;
  read?: boolean;
  /** Where tapping the row goes. Nullable in the contract: a row without one
   *  is not a link and must not pretend to be. */
  href?: string | null;
}

export interface NotificationContextValue {
  unreadCount: number;
  notifications: NotificationItem[];
  /**
   * The feed could not be read. Kept apart from an empty feed: "Nothing new
   * right now" is a claim, and it is the wrong one when we simply could not
   * ask.
   */
  failed: boolean;
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
  {
    id: "n1",
    title: "A new lesson is ready",
    text: "Adding Fractions is waiting for you",
    ago: "2h",
  },
  {
    id: "n2",
    title: "Ms Okafor sent you a message",
    text: "Lovely work on your fractions today",
    ago: "1d",
    read: true,
  },
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
    id: n.notificationId,
    // Both, on two lines - see `NotificationItem.text`. A description equal to
    // the title is not a second line, it is the same line twice.
    title: n.title,
    text: n.description && n.description !== n.title ? n.description : undefined,
    ago: ago(n.createdAt),
    read: n.read,
    href: n.navigatesTo,
  };
}

export function NotificationProvider({ children }: { children: ReactNode }) {
  const signedIn = useHasSession();
  const [feed, setFeed] = useState<Notification[] | null>(null);
  const [unread, setUnread] = useState(0);
  const [failed, setFailed] = useState(false);
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
        setFailed(false);
      })
      .catch(() => {
        // Never the fixtures - but not a silent empty bell either. The panel
        // says it could not load rather than claiming there is nothing new.
        if (!cancelled) {
          setFeed([]);
          setUnread(0);
          setFailed(true);
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
        failed: false,
        refresh,
      };
    }
    return {
      notifications: (feed ?? []).map(toItem),
      unreadCount: unread,
      failed,
      refresh,
    };
  }, [signedIn, feed, unread, failed, refresh]);

  return (
    <NotificationContext.Provider value={value}>
      {children}
    </NotificationContext.Provider>
  );
}
