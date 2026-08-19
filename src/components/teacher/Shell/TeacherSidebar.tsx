"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { cn } from "@/lib/utils";
import { MOCK_TEACHER, TEACHER_NAV, type TeacherNavItem } from "./teacherNav";

/**
 * Teacher nav rail (`Nevo Teacher Sidebar` frame) - 240px expanded, 64px
 * collapsed, the same rail at every size: tablet opens collapsed, desktop
 * expanded (the C-screen docs' tablet variants render `collapsed`), and the
 * chevron toggles either way. Five tabs, the notification bell with its quiet
 * violet dot, and the teacher identity row.
 *
 * Icons are the frame's own 22px strokes, ported verbatim - they are close to
 * lucide's but not identical, and the frame is the authority.
 */

const STROKE = {
  width: 22,
  height: 22,
  viewBox: "0 0 24 24",
  fill: "none",
  stroke: "currentColor",
  strokeWidth: 1.9,
  strokeLinecap: "round",
  strokeLinejoin: "round",
} as const;

const ICONS: Record<TeacherNavItem["name"], React.ReactNode> = {
  Home: (
    <svg {...STROKE} aria-hidden>
      <path d="M3 11l9-7 9 7" />
      <path d="M5 10v10h14V10" />
    </svg>
  ),
  Classes: (
    <svg {...STROKE} aria-hidden>
      <circle cx="9" cy="8" r="3" />
      <path d="M3.5 20a5.5 5.5 0 0 1 11 0" />
      <path d="M16 6.5a3 3 0 0 1 0 6" />
      <path d="M17.5 20a5.5 5.5 0 0 0-3-4.9" />
    </svg>
  ),
  Library: (
    <svg {...STROKE} aria-hidden>
      <path d="M4 5a2 2 0 0 1 2-2h12v16H6a2 2 0 0 0-2 2z" />
      <path d="M4 19a2 2 0 0 1 2-2h12" />
      <path d="M9 7h6" />
    </svg>
  ),
  Insights: (
    <svg {...STROKE} aria-hidden>
      <path d="M12 3a5 5 0 0 0-3 9c.6.5 1 1.2 1 2h4c0-.8.4-1.5 1-2a5 5 0 0 0-3-9z" />
      <path d="M10 20h4" />
      <path d="M10.5 17h3" />
    </svg>
  ),
  Connect: (
    <svg {...STROKE} aria-hidden>
      <path d="M21 12a8 8 0 0 1-11.6 7.1L4 20l1-4.5A8 8 0 1 1 21 12z" />
    </svg>
  ),
};

const BELL_ICON = (
  <svg {...STROKE} aria-hidden>
    <path d="M18 8a6 6 0 0 0-12 0c0 7-3 9-3 9h18s-3-2-3-9" />
    <path d="M13.7 21a2 2 0 0 1-3.4 0" />
  </svg>
);

/** Row shell shared by tabs, the bell and the collapse control. */
function rowClass(expanded: boolean, extra?: string) {
  return cn(
    "relative flex h-[46px] shrink-0 cursor-pointer items-center gap-3.5 rounded-[10px] transition-colors duration-[130ms]",
    expanded ? "px-3.5" : "justify-center px-0",
    extra,
  );
}

export function TeacherSidebar({
  hasNotifications = true,
}: {
  /** Quiet violet dot on the bell. TODO(api): from the notifications seam. */
  hasNotifications?: boolean;
}) {
  const pathname = usePathname();
  // Desktop opens expanded, tablet collapsed (frame: tablet variants are
  // `collapsed`); the breakpoint re-asserts the default, the chevron is free.
  const [expanded, setExpanded] = useState(true);
  useEffect(() => {
    const mq = window.matchMedia("(min-width: 1280px)");
    const sync = () => setExpanded(mq.matches);
    sync();
    mq.addEventListener("change", sync);
    return () => mq.removeEventListener("change", sync);
  }, []);

  const collapsed = !expanded;

  return (
    <aside
      className={cn(
        "flex h-full shrink-0 flex-col overflow-hidden border-r border-nevo-near-black/6 bg-nevo-cream-elevated py-6 transition-[width] duration-200 ease-in-out",
        collapsed ? "w-16 px-3" : "w-60 px-4",
      )}
    >
      {/* Logo - wordmark crop expanded, icon crop collapsed (padded 1080² files) */}
      <div className={cn("flex items-center", expanded ? "px-2" : "justify-center")}>
        {expanded ? (
          <span className="relative block h-[17px] w-[58px] overflow-hidden">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src="/brand/logo-wordmark-purple.png"
              alt="Nevo"
              className="absolute block h-[169px] w-[169px] max-w-none -translate-x-[61px] -translate-y-[81px]"
            />
          </span>
        ) : (
          <span className="relative block size-[22px] overflow-hidden">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src="/brand/logo-icon-purple.png"
              alt="Nevo"
              className="absolute block h-[86px] w-[86px] max-w-none -translate-x-[32px] -translate-y-[35px]"
            />
          </span>
        )}
      </div>

      {/* Tabs */}
      <nav className="mt-8 flex flex-1 flex-col gap-1">
        {TEACHER_NAV.map((item) => {
          const on = pathname.startsWith(item.href);
          return (
            <Link
              key={item.name}
              href={item.href}
              title={item.name}
              aria-current={on ? "page" : undefined}
              className={cn(
                rowClass(expanded),
                on ? "bg-nevo-navy/8" : "hover:bg-nevo-navy/5",
              )}
            >
              {on && (
                <span className="absolute inset-y-[9px] left-0 w-[3px] rounded-full bg-nevo-violet" />
              )}
              <span
                className={cn(
                  "flex size-10 shrink-0 items-center justify-center rounded-[10px]",
                  on ? "bg-nevo-navy text-nevo-cream" : "text-nevo-near-black/72",
                )}
              >
                {ICONS[item.name]}
              </span>
              {expanded && (
                <span
                  className={cn(
                    "text-[15px] tracking-[-0.005em]",
                    on
                      ? "font-semibold text-nevo-near-black"
                      : "font-medium text-nevo-near-black/78",
                  )}
                >
                  {item.name}
                </span>
              )}
            </Link>
          );
        })}
      </nav>

      {/* Notifications */}
      <Link
        href="/teacher/notifications"
        title="Notifications"
        className={cn(rowClass(expanded), "hover:bg-nevo-navy/5")}
      >
        <span className="relative flex size-10 shrink-0 items-center justify-center rounded-[10px] text-nevo-near-black/72">
          {BELL_ICON}
          {hasNotifications && (
            <span
              className={cn(
                "absolute top-[9px] size-2 rounded-full border-2 border-nevo-cream-elevated bg-nevo-violet",
                expanded ? "left-9" : "left-1/2",
              )}
            />
          )}
        </span>
        {expanded && (
          <span className="text-[15px] font-medium text-nevo-near-black/78">
            Notifications
          </span>
        )}
      </Link>

      {/* Collapse toggle */}
      <button
        type="button"
        onClick={() => setExpanded((e) => !e)}
        aria-expanded={expanded}
        aria-label={expanded ? "Collapse sidebar" : "Expand sidebar"}
        className={cn(rowClass(expanded), "hover:bg-nevo-navy/6")}
      >
        <span className="flex size-10 shrink-0 items-center justify-center rounded-[10px] text-nevo-near-black/55">
          <svg {...STROKE} strokeWidth={2} aria-hidden>
            {expanded ? <path d="M15 6l-6 6 6 6" /> : <path d="M9 6l6 6-6 6" />}
          </svg>
        </span>
        {expanded && (
          <span className="text-[15px] font-medium text-nevo-near-black/68">
            Collapse
          </span>
        )}
      </button>

      <div className="mx-1 mt-2.5 h-px shrink-0 bg-nevo-near-black/8" />

      {/* Teacher identity - opens Profile & Settings */}
      <Link
        href="/teacher/profile"
        title="Profile and settings"
        className={cn(
          "mt-2.5 flex cursor-pointer items-center gap-3 rounded-[10px] py-2 transition-colors duration-[130ms] hover:bg-nevo-navy/5",
          expanded ? "px-2.5" : "justify-center px-0",
        )}
      >
        <span className="flex size-9 shrink-0 items-center justify-center rounded-full bg-nevo-navy text-[13px] font-semibold tracking-[0.02em] text-nevo-cream">
          {MOCK_TEACHER.initials}
        </span>
        {expanded && (
          <span className="flex min-w-0 flex-col">
            <span className="truncate text-sm font-semibold text-nevo-near-black">
              {MOCK_TEACHER.name}
            </span>
            <span className="text-xs whitespace-nowrap text-nevo-near-black/55">
              {MOCK_TEACHER.role}
            </span>
          </span>
        )}
      </Link>
    </aside>
  );
}
