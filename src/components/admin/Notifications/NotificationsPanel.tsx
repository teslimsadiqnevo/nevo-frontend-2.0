"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { notificationsApi, type Notification } from "@/lib/api/notifications";
import { cn } from "@/lib/utils";
import { ROW_DIVIDER } from "../Roster/primitives";
import { NotificationRow } from "./NotificationRow";

/**
 * D13.2 The panel - the quick read.
 *
 * The last handful of things, scannable in about ten seconds, with a route
 * into whatever needs doing. Anchored to the sidebar's Notifications row, not
 * to a header: the admin layer has no top chrome, and SCRUM-100 settles this
 * explicitly - "the ticket's 'header icon' wording is superseded by this
 * decision rather than the other way round".
 *
 * Geometry is the frame's: 380px wide, 520px tall at most, anchored bottom
 * left against the rail, with the list scrolling inside a fixed header and
 * footer.
 *
 * Mark-all-read SETTLES to "All read" rather than disappearing - the action
 * stays where it was so the reader is not left wondering whether they clicked
 * it.
 */

const MAX_ROWS = 6;

export function NotificationsPanel({
  onClose,
  onReadStateChanged,
}: {
  onClose: () => void;
  /** Lets the rail drop its dot the moment the last unread is cleared. */
  onReadStateChanged: () => void;
}) {
  const [rows, setRows] = useState<Notification[] | null>(null);
  const [allRead, setAllRead] = useState(false);
  const [now, setNow] = useState(0);
  const panel = useRef<HTMLDivElement>(null);

  useEffect(() => {
    notificationsApi
      .list({ limit: MAX_ROWS, offset: 0 })
      .then((feed) => {
        setRows(feed.notifications);
        setAllRead(feed.unreadCount === 0);
        setNow(Date.now());
      })
      .catch(() => setRows([]));
  }, []);

  // Escape and an outside press both close it; the rail's own button is
  // excluded by `data-notification-toggle` so clicking it does not close and
  // immediately reopen.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    const onDown = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      if (panel.current?.contains(target)) return;
      if (target.closest("[data-notification-toggle]")) return;
      onClose();
    };
    document.addEventListener("keydown", onKey);
    document.addEventListener("mousedown", onDown);
    return () => {
      document.removeEventListener("keydown", onKey);
      document.removeEventListener("mousedown", onDown);
    };
  }, [onClose]);

  const markAllRead = () => {
    setAllRead(true);
    setRows((prev) => prev?.map((n) => ({ ...n, read: true })) ?? prev);
    notificationsApi
      .markAllRead()
      .then(onReadStateChanged)
      .catch(() => setAllRead(false));
  };

  const onRead = (id: string) => {
    setRows((prev) =>
      prev?.map((n) => (n.notificationId === id ? { ...n, read: true } : n)) ?? prev,
    );
    notificationsApi.markRead(id).then(onReadStateChanged).catch(() => undefined);
  };

  return (
    <div
      ref={panel}
      role="dialog"
      aria-label="Notifications"
      className="fixed bottom-6 left-6 z-50 flex max-h-[520px] w-[380px] flex-col overflow-hidden rounded-2xl bg-nevo-cream shadow-[0_12px_40px_rgba(0,0,0,0.22)] motion-safe:animate-nevo-rise"
    >
      <div className="flex flex-none items-center justify-between gap-3 border-b border-nevo-near-black/8 px-5 pb-3.5 pt-[18px]">
        <span className="text-base font-semibold text-nevo-near-black">
          Notifications
        </span>
        <button
          type="button"
          onClick={markAllRead}
          disabled={allRead}
          className={cn(
            "text-[13px] font-semibold transition-opacity",
            allRead
              ? "cursor-default text-nevo-near-black/40"
              : "cursor-pointer text-nevo-navy hover:opacity-75",
          )}
        >
          {allRead ? "All read" : "Mark all read"}
        </button>
      </div>

      <div className="min-h-0 flex-1 overflow-y-auto">
        {rows === null ? (
          <div className="space-y-3 p-5">
            <div className="h-12 animate-pulse rounded-lg bg-nevo-near-black/[0.06]" />
            <div className="h-12 animate-pulse rounded-lg bg-nevo-near-black/[0.06]" />
          </div>
        ) : rows.length === 0 ? (
          <div className="px-5 py-10 text-center">
            <p className="m-0 text-[15px] font-semibold text-nevo-near-black">
              You&rsquo;re all caught up
            </p>
            <p className="m-0 mt-2 text-[13.5px] leading-[1.55] text-nevo-near-black/62">
              Anything worth telling you - within what you look after - will
              show up here.
            </p>
          </div>
        ) : (
          rows.map((n, i) => (
            <NotificationRow
              key={n.notificationId}
              notification={n}
              archived={false}
              compact
              now={now}
              className={cn(i < rows.length - 1 && ROW_DIVIDER)}
              onRead={onRead}
            />
          ))
        )}
      </div>

      <div className="flex-none border-t border-nevo-near-black/8 px-5 py-3.5 text-center">
        <Link
          href="/admin/notifications"
          onClick={onClose}
          className="text-[13px] font-semibold text-nevo-navy hover:opacity-75"
        >
          See everything
        </Link>
      </div>
    </div>
  );
}
