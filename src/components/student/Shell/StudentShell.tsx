"use client";

import Image from "next/image";
import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import { BottomNav, Sidebar } from "@/components/shared";
import { AskNevo } from "@/components/student/AskNevo/AskNevo";
import { TEXT_ZOOM, useAccessibility } from "@/context/AccessibilityContext";
import { MOCK_STUDENT, STUDENT_NAV } from "./studentNav";

/**
 * Student App shell (Product Arch B.5). Wraps the daily-experience tabs in the
 * left `Sidebar` (tablet/desktop) or `BottomNav` (mobile). Full-screen flows —
 * onboarding and the immersive Lesson Player — render bare, with no chrome
 * ("no in-lesson sidebar").
 *
 * The shell is a fixed-height viewport frame: the sidebar/nav stay put while only
 * the content region scrolls.
 */
export function StudentShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname() ?? "";
  const { textSize } = useAccessibility();

  // Sidebar defaults collapsed (matches the server render, so no hydration
  // mismatch), then opens on desktop after mount. Tablet stays collapsed for room.
  const [collapsed, setCollapsed] = useState(true);
  useEffect(() => {
    // Client-only media read, once on mount — the deliberate way to pick a
    // hydration-safe default (server can't know the viewport width).
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setCollapsed(!window.matchMedia("(min-width: 1024px)").matches);
  }, []);

  if (isFullScreen(pathname)) return <>{children}</>;

  const activeHref = STUDENT_NAV.find(
    (item) => pathname === item.href || pathname.startsWith(`${item.href}/`),
  )?.href;

  return (
    <div className="flex h-[100dvh] bg-nevo-cream text-nevo-near-black">
      {/* Sidebar — tablet & desktop */}
      <div className="hidden shrink-0 md:block">
        <Sidebar
          items={STUDENT_NAV}
          activeHref={activeHref}
          user={MOCK_STUDENT}
          collapsed={collapsed}
          onToggle={setCollapsed}
        />
      </div>

      <div className="flex min-w-0 flex-1 flex-col">
        {/* Top bar — mobile only (logo + avatar) */}
        <header className="flex h-[60px] shrink-0 items-center justify-between px-5 md:hidden">
          <Image
            src="/brand/nevo-wordmark.png"
            alt="Nevo"
            width={344}
            height={116}
            priority
            className="h-[14px] w-auto"
          />
          <span className="flex size-10 items-center justify-center rounded-full bg-nevo-navy text-sm font-semibold text-nevo-cream">
            {MOCK_STUDENT.initials}
          </span>
        </header>

        {/* Only the content region scrolls; the sidebar/nav stay fixed.
            The Text Size preference is applied here as a numeric `zoom`
            (`zoom: var(...)` isn't supported, so it's read from context). */}
        <main
          className="min-h-0 flex-1 overflow-y-auto"
          style={{ zoom: TEXT_ZOOM[textSize] }}
        >
          {children}
        </main>

        {/* Bottom nav — mobile only */}
        <div className="shrink-0 px-3 pb-3 md:hidden">
          <BottomNav items={STUDENT_NAV} activeHref={activeHref} />
        </div>
      </div>

      {/* Ask Nevo (26) — always reachable from the tabs, never interruptive. */}
      <AskNevo />
    </div>
  );
}

/** Onboarding and the lesson player (`/student/lessons/<id>`) run without chrome. */
function isFullScreen(pathname: string): boolean {
  if (pathname.startsWith("/student/onboarding")) return true;
  // Only the bare lesson route is the immersive player; its sub-routes (e.g.
  // `/summary`) are ordinary in-shell screens and keep the sidebar/nav. The
  // review session (37d) reuses the player wholesale, so it runs bare too.
  if (/^\/student\/lessons\/[^/]+\/?$/.test(pathname)) return true;
  if (/^\/student\/lessons\/[^/]+\/review-session\/?$/.test(pathname)) return true;
  // Feedback + Change PIN are full-screen views with their own back chevron
  // (Nevo Student App: `feedback` / `changepin`).
  if (pathname === "/student/profile/feedback") return true;
  if (pathname === "/student/profile/pin") return true;
  return false;
}
