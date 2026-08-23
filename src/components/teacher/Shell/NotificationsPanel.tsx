"use client";

import { useEffect } from "react";
import type {
  NotificationKind,
  TeacherNotification,
} from "@/lib/mocks/teacherNotifications";
import { cn } from "@/lib/utils";

/**
 * C13 Notifications - a calm reverse-chronological popover from the sidebar
 * bell. A badge dot, never a count; each line is one brief sentence; unread
 * carries a soft violet tint, not bold shouting.
 *
 * Positioned fixed at the frame's own coordinates (the rail clips absolute
 * children). Rows are not clickable - the frame gives them no destination.
 */

const KIND_ICON: Record<NotificationKind, React.ReactNode> = {
  flag: (
    <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <path d="M3 7l5 4 4-3 4 5 5-6" />
    </svg>
  ),
  message: (
    <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <path d="M21 12a8 8 0 0 1-11.6 7.1L4 20l1-4.5A8 8 0 1 1 21 12z" />
    </svg>
  ),
  done: (
    <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <path d="M20 6L9 17l-5-5" />
    </svg>
  ),
  support: (
    <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <path d="M22 2L11 13" />
      <path d="M22 2l-7 20-4-9-9-4z" />
    </svg>
  ),
  klass: (
    <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <circle cx="9" cy="8" r="3" />
      <path d="M3.5 20a5.5 5.5 0 0 1 11 0" />
    </svg>
  ),
};

export function NotificationsPanel({
  notes,
  onMarkAllRead,
  onClose,
}: {
  notes: TeacherNotification[];
  onMarkAllRead: () => void;
  onClose: () => void;
}) {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  const hasUnread = notes.some((n) => n.unread);
  const empty = notes.length === 0;

  return (
    <>
      <div aria-hidden onClick={onClose} className="fixed inset-0 z-40" />
      <div
        role="dialog"
        aria-label="Notifications"
        className="fixed bottom-20 left-[88px] z-50 w-[360px] overflow-hidden rounded-xl bg-nevo-cream shadow-[0_8px_32px_rgba(0,0,0,0.16)] motion-safe:animate-in motion-safe:fade-in-0 motion-safe:zoom-in-95 motion-safe:duration-150 xl:bottom-24 xl:left-[200px] xl:w-[380px]"
      >
        <div
          className={cn(
            "border-b border-nevo-near-black/8 px-5 pt-[18px] pb-3.5",
            !empty && "flex items-center justify-between",
          )}
        >
          <h3 className="text-base font-semibold text-nevo-near-black">
            Notifications
          </h3>
          {/* The empty frame's head carries no action. */}
          {!empty && hasUnread && (
            <button
              type="button"
              onClick={onMarkAllRead}
              className="cursor-pointer text-[13px] font-medium text-nevo-navy transition-colors hover:text-nevo-navy/80"
            >
              Mark all read
            </button>
          )}
        </div>

        {empty ? (
          <div className="flex flex-col items-center px-6 py-11 text-center">
            <div className="flex size-14 items-center justify-center rounded-xl bg-nevo-cream-elevated text-nevo-violet">
              <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
                <path d="M18 8a6 6 0 0 0-12 0c0 7-3 9-3 9h18s-3-2-3-9" />
                <path d="M13.7 21a2 2 0 0 1-3.4 0" />
              </svg>
            </div>
            <p className="mt-4 text-[15px] text-nevo-near-black/62">
              Nothing new right now.
            </p>
          </div>
        ) : (
          <div className="max-h-[520px] overflow-y-auto">
            {notes.map((n, i) => (
              <div
                key={n.id}
                className={cn(
                  "flex gap-[11px] px-[18px] py-[13px] xl:gap-[13px] xl:px-5 xl:py-[15px]",
                  n.unread && "bg-nevo-violet/9",
                  i < notes.length - 1 && "border-b border-nevo-near-black/6",
                )}
              >
                <span className="flex size-[34px] shrink-0 items-center justify-center rounded-[9px] bg-nevo-navy/10 text-nevo-navy">
                  {KIND_ICON[n.kind]}
                </span>
                <div className="min-w-0 flex-1">
                  <p className="text-sm leading-[1.45] text-nevo-near-black">
                    {n.text}
                  </p>
                  <span className="mt-[3px] block text-xs text-nevo-near-black/50">
                    {n.time}
                  </span>
                </div>
                {n.unread && (
                  <span className="mt-[5px] size-2 shrink-0 rounded-full bg-nevo-violet" />
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </>
  );
}
