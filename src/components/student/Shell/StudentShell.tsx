"use client";

import Image from "next/image";
import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import { BottomNav, Sidebar } from "@/components/shared";
import { AskNevo } from "@/components/student/AskNevo/AskNevo";
import { TEXT_ZOOM, useAccessibility } from "@/context/AccessibilityContext";
import { useBehaviouralCapture } from "@/hooks";
import { NotificationBell } from "./NotificationBell";
import { OfflineTakeover, useOnline } from "./OfflineTakeover";
import { useHasSession } from "@/hooks/useHasSession";
import { useHydrated } from "@/hooks/useHydrated";
import { useSessionLapse } from "@/hooks/useSessionLapse";
import { useSessionRefresh } from "@/hooks/useSessionRefresh";
import { flushPendingProgress } from "@/lib/lessons/pendingProgress";
import { MOCK_STUDENT, STUDENT_NAV } from "./studentNav";
import { useDisplayName } from "./useDisplayName";

/**
 * Student App shell (Product Arch B.5). Wraps the daily-experience tabs in the
 * left `Sidebar` (tablet/desktop) or `BottomNav` (mobile). Full-screen flows —
 * onboarding and the immersive Lesson Player — render bare, with no chrome
 * ("no in-lesson sidebar").
 *
 * ASK NEVO IS THE EXCEPTION, AND IT IS NOT CHROME. Frame 26 governs it: "always
 * reachable, never interruptive". It was mounted below the full-screen early
 * return, so it sat on every tab and was missing from the one screen where a
 * child actually gets stuck. Its trigger is right-aligned and the player's
 * chevrons are centred, so it costs the player no room and displaces nothing.
 *
 * NOT on the other full-screen routes, and each for its own reason. The daily
 * warm-up is a calibrated baseline activity - offering help inside it would
 * contaminate what it measures. Onboarding has no lesson to ask about and no
 * session to ask with. Feedback and Change PIN are utility screens with their
 * own way back.
 *
 * The shell is a fixed-height viewport frame: the sidebar/nav stay put while only
 * the content region scrolls.
 */
export function StudentShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname() ?? "";
  // SCRUM-76: on-device behavioural timing capture for the affective engine -
  // ephemeral IndexedDB only, purged at session end, never transmitted.
  useBehaviouralCapture(true);
  // Renews the session before it expires. Mounted here rather than on a tab,
  // so it covers the full-screen routes below too - a child mid-lesson is the
  // case that matters, and the one the old behaviour handled worst.
  useSessionRefresh();
  // And when that fails - offline, refused, a bad hour at the backend - say so.
  // Expiry clears the session in place, after which `report()` drops every
  // position the child reaches and no request is made to 401, so nothing else
  // in the app would ever mention it. The route guard only runs on navigation,
  // and a child reading one segment does not navigate.
  useSessionLapse();
  /*
   * Deliver anything a lesson could not save before it was closed.
   *
   * Here rather than only in the player, because a child who gave up on a
   * lesson while offline may never open that lesson again - and their position
   * still belongs on Home's "Pick back up" card. Any student screen is enough.
   */
  useEffect(() => {
    void flushPendingProgress();
  }, []);
  const { textSize } = useAccessibility();
  // The chrome calls the student by their own name, not the fixture's.
  const student = useDisplayName();
  const signedIn = useHasSession();
  // `useHasSession` is the server's answer until hydration, so gating on it
  // alone showed a real child the fixture's "Year 4" for a frame. Same reason
  // `useDisplayName` waits - nobody is described until we know who is looking.
  const hydrated = useHydrated();
  const online = useOnline();
  // Offline takes over network-backed tabs (board 28); Downloads stays
  // reachable - it is where "See saved lessons" points.
  const offlineTakeover = !online && !pathname.startsWith("/student/downloads");

  // Sidebar defaults collapsed (matches the server render, so no hydration
  // mismatch), then opens on desktop after mount. Tablet stays collapsed for room.
  const [collapsed, setCollapsed] = useState(true);
  useEffect(() => {
    // Client-only media read, once on mount — the deliberate way to pick a
    // hydration-safe default (server can't know the viewport width).
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setCollapsed(!window.matchMedia("(min-width: 1024px)").matches);
  }, []);

  if (isFullScreen(pathname)) {
    // Text Size is a reading preference, and the player is where the reading
    // happens - it applies there too, not just in the shell. Onboarding is
    // deliberately excluded: the baseline activities are spatially
    // calibrated, and scaling them would distort what they measure.
    if (pathname.startsWith("/student/onboarding")) return <>{children}</>;
    return (
      <div style={{ zoom: TEXT_ZOOM[textSize] }}>
        {children}
        {isLesson(pathname) && <AskNevo />}
      </div>
    );
  }

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
          // A live student's year group has no source (`users/me` carries
          // none), so the fixture's "Year 4" is dropped rather than shown
          // under their real name. Restored when a year group exists.
          user={{
            ...MOCK_STUDENT,
            ...student,
            subtitle: hydrated && !signedIn ? MOCK_STUDENT.subtitle : undefined,
          }}
          collapsed={collapsed}
          onToggle={setCollapsed}
        />
      </div>

      <div className="relative flex min-w-0 flex-1 flex-col">
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
          <div className="flex items-center gap-1">
            <NotificationBell />
            <span className="flex size-10 items-center justify-center rounded-full bg-nevo-navy text-sm font-semibold text-nevo-cream">
              {student.initials}
            </span>
          </div>
        </header>

        {/* Notifications — tablet/desktop: quiet bell top-right of the content. */}
        <div className="absolute top-4 right-5 z-30 hidden md:block">
          <NotificationBell />
        </div>

        {/* Only the content region scrolls; the sidebar/nav stay fixed.
            The Text Size preference is applied here as a numeric `zoom`
            (`zoom: var(...)` isn't supported, so it's read from context). */}
        <main
          // The bottom padding clears the Ask Nevo trigger, which is `fixed`
          // and so lands ON this scrolling region rather than below it. #313
          // did this for the lesson player; these are the five tabs, where the
          // same trigger has sat over the bottom-right of the content since it
          // was built.
          //
          // Mobile: the nav below is py-1.5 + size-10 + gap-1.5 + a 3px
          // indicator = 61px, plus its wrapper's pb-3 = 73px. The trigger is
          // `bottom-[82px]` and 52px tall, so it occupies 82-134px off the
          // viewport - intruding 61px into this region. Desktop has no nav, so
          // this region reaches the viewport floor and the 44px pill at
          // `bottom-6` intrudes 68px. A few px of margin on each.
          className="min-h-0 flex-1 overflow-y-auto pb-[68px] md:pb-[76px]"
          style={{ zoom: TEXT_ZOOM[textSize] }}
        >
          {offlineTakeover ? <OfflineTakeover /> : children}
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

/**
 * The immersive player, and the review session that reuses it wholesale (37d).
 *
 * Only the BARE lesson route is the player; its sub-routes (e.g. `/summary`)
 * are ordinary in-shell screens and keep the sidebar/nav.
 */
function isLesson(pathname: string): boolean {
  return (
    /^\/student\/lessons\/[^/]+\/?$/.test(pathname) ||
    /^\/student\/lessons\/[^/]+\/review-session\/?$/.test(pathname)
  );
}

/** Onboarding and the lesson player (`/student/lessons/<id>`) run without chrome. */
function isFullScreen(pathname: string): boolean {
  if (pathname.startsWith("/student/onboarding")) return true;
  if (isLesson(pathname)) return true;
  // Feedback + Change PIN are full-screen views with their own back chevron
  // (Nevo Student App: `feedback` / `changepin`).
  if (pathname === "/student/profile/feedback") return true;
  if (pathname === "/student/profile/pin") return true;
  // The daily warm-up run (SCRUM-104) has its own quiet header, no nav.
  if (pathname === "/student/warm-up") return true;
  return false;
}
