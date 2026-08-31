"use client";

import { useCallback, useEffect, useState } from "react";
import {
  notificationsApi,
  type Notification,
} from "@/lib/api/notifications";
import { getToken } from "@/lib/auth/session";
import {
  TEACHER_NOTIFICATIONS,
  type NotificationKind,
  type TeacherNotification,
} from "@/lib/mocks/teacherNotifications";
import { useHasSession } from "./useHasSession";

/**
 * The bell's feed, from `GET /api/notifications`.
 *
 * The response carries `unreadCount` alongside the rows, so the badge is read
 * from the same call rather than polling `/unread-count`.
 *
 * `type` has no enum in the spec, so `kindOf` maps what the C13 frame drew and
 * anything unrecognised falls back to `done`'s neutral mark. A type the
 * backend adds tomorrow renders as a plain row rather than an empty square.
 *
 * Fixtures back the designed panel when there is no session; a signed-in
 * teacher whose feed fails sees an empty bell rather than invented events,
 * because a fabricated "Tunde stopped partway through a lesson" is a claim
 * about a real child.
 *
 * TODO(design): the API sends `navigatesTo` per row and the frame draws rows
 * as inert; also `title` and `description` where the frame has one line.
 */


/** The frame's five marks, matched on what the type string contains. */
function kindOf(type: string): NotificationKind {
  const t = type.toLowerCase();
  if (t.includes("message") || t.includes("reply")) return "message";
  if (t.includes("flag") || t.includes("alert") || t.includes("concern")) {
    return "flag";
  }
  if (t.includes("support") || t.includes("senco") || t.includes("escalat")) {
    return "support";
  }
  if (t.includes("class") || t.includes("enrol") || t.includes("roster")) {
    return "klass";
  }
  return "done";
}

function relative(iso: string): string {
  const mins = Math.floor((Date.now() - new Date(iso).getTime()) / 60_000);
  if (mins < 1) return "Just now";
  if (mins < 60) return `${mins} min ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours} ${hours === 1 ? "hour" : "hours"} ago`;
  const days = Math.floor(hours / 24);
  if (days === 1) return "Yesterday";
  if (days < 7) return `${days} days ago`;
  return new Date(iso).toLocaleDateString("en-GB", {
    day: "numeric",
    month: "long",
  });
}

function toRow(n: Notification): TeacherNotification {
  return {
    id: n.notificationId,
    kind: kindOf(n.type),
    // The frame is one sentence; `description` is the sentence and `title`
    // the label above it, so the sentence wins when there is one.
    text: n.description || n.title,
    time: relative(n.createdAt),
    unread: !n.read,
  };
}

export interface TeacherNotificationsState {
  notes: TeacherNotification[];
  unreadCount: number;
  live: boolean;
  /** The read failed. NEVER the same thing as an empty feed. */
  failed: boolean;
  markAllRead: () => void;
}

export function useTeacherNotifications(): TeacherNotificationsState {
  const [feed, setFeed] = useState<Notification[] | null>(null);
  const [unread, setUnread] = useState(0);
  const [failed, setFailed] = useState(false);
  const signedIn = useHasSession();

  /*
   * NO RACE, NO CAP. This hook used to run the feed against a 6s timeout and
   * take whichever finished first - so a response arriving at 6.1s was
   * DISCARDED and rendered as "Nothing new right now.", with the unread dot
   * cleared, on the one surface that tells a teacher a child needs attention.
   * The backend's own ordinary range is 1.0-5.6s, so the cap sat inside the
   * normal distribution.
   *
   * That is the exact bug removed from four other hooks in PR #148, and this
   * hook - written afterwards - reintroduced it. The rule from that fix
   * stands: a slow read is still a real read, and only a FAILED one may be
   * reported as such. Failure and emptiness are different states and must
   * read differently.
   */
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
        // Empty rather than fixtures - these rows name real children - but
        // flagged as failed so the panel can say so.
        if (cancelled) return;
        setFeed([]);
        setUnread(0);
        setFailed(true);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const markAllRead = useCallback(() => {
    if (!getToken()) {
      setFeed((f) => f?.map((n) => ({ ...n, read: true })) ?? f);
      setUnread(0);
      return;
    }
    void notificationsApi
      .markAllRead()
      .then(() => {
        setFeed((f) => f?.map((n) => ({ ...n, read: true })) ?? f);
        setUnread(0);
      })
      .catch(() => {
        // Leave the badge alone: claiming they are read when the server still
        // has them unread is worse than the dot staying put.
      });
  }, []);

  if (!signedIn) {
    const notes = TEACHER_NOTIFICATIONS;
    return {
      notes,
      unreadCount: notes.filter((n) => n.unread).length,
      live: false,
      failed: false,
      markAllRead,
    };
  }

  return {
    notes: (feed ?? []).map(toRow),
    unreadCount: unread,
    live: true,
    failed,
    markAllRead,
  };
}
