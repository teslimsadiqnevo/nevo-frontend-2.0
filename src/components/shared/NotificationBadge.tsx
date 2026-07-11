import * as React from "react";
import { Bell } from "lucide-react";

import { cn } from "@/lib/utils";

/**
 * Notification badge (Design System v2 §6). Bell in a cream tile; a quiet violet
 * 6px dot signals unread — never a numbered red badge.
 */
function NotificationBadge({
  unread = false,
  className,
  ...props
}: React.ComponentProps<"button"> & { unread?: boolean }) {
  return (
    <button
      type="button"
      aria-label={unread ? "Notifications, unread" : "Notifications"}
      className={cn(
        "relative flex size-11 cursor-pointer items-center justify-center rounded-[8px] bg-nevo-cream text-nevo-near-black shadow-elevation-1 transition-colors hover:bg-nevo-cream-elevated",
        className,
      )}
      {...props}
    >
      <Bell className="size-6" strokeWidth={1.75} />
      {unread && (
        <span className="absolute top-1.5 right-1.5 size-1.5 rounded-full bg-nevo-violet" />
      )}
    </button>
  );
}

export { NotificationBadge };
