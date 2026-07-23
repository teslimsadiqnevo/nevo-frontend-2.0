"use client";

import Image from "next/image";
import { usePathname } from "next/navigation";
import { BottomNav, Sidebar } from "@/components/shared";
import { MOCK_STUDENT, STUDENT_NAV } from "./studentNav";

/**
 * Student App shell (Product Arch B.5). Wraps the daily-experience tabs in the
 * left `Sidebar` (tablet/desktop) or `BottomNav` (mobile). Full-screen flows —
 * onboarding and the immersive Lesson Player — render bare, with no chrome
 * ("no in-lesson sidebar").
 */
export function StudentShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname() ?? "";

  if (isFullScreen(pathname)) return <>{children}</>;

  const activeHref = STUDENT_NAV.find(
    (item) => pathname === item.href || pathname.startsWith(`${item.href}/`),
  )?.href;

  return (
    <div className="flex min-h-[100dvh] bg-nevo-cream text-nevo-near-black">
      {/* Sidebar — tablet & desktop */}
      <div className="hidden shrink-0 md:block">
        <Sidebar
          items={STUDENT_NAV}
          activeHref={activeHref}
          user={MOCK_STUDENT}
          defaultCollapsed
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

        <main className="min-h-0 flex-1">{children}</main>

        {/* Bottom nav — mobile only */}
        <div className="shrink-0 px-3 pb-3 md:hidden">
          <BottomNav items={STUDENT_NAV} activeHref={activeHref} />
        </div>
      </div>
    </div>
  );
}

/** Onboarding and the lesson player (`/student/lessons/<id>`) run without chrome. */
function isFullScreen(pathname: string): boolean {
  if (pathname.startsWith("/student/onboarding")) return true;
  // A sub-segment under /student/lessons/ is a specific lesson → the player.
  if (/^\/student\/lessons\/[^/]+/.test(pathname)) return true;
  return false;
}
