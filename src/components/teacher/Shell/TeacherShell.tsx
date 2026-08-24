"use client";

import { usePathname } from "next/navigation";
import { AskNevo } from "./AskNevo";
import { TeacherSidebar } from "./TeacherSidebar";

/**
 * Teacher Console chrome: the nav rail plus the floating Ask Nevo drawer on
 * every console surface. Full-screen flows render bare - today that is only
 * C01 onboarding, a standalone screen per its frame. Same pattern as the
 * student app's StudentShell.
 */
export function TeacherShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname() ?? "";

  if (pathname.startsWith("/teacher/onboarding")) return <>{children}</>;

  return (
    <div className="flex h-dvh flex-row overflow-hidden bg-nevo-cream text-nevo-near-black">
      <TeacherSidebar />
      <main className="flex min-w-0 flex-1 flex-col overflow-y-auto">
        {children}
      </main>
      {/* C15: Ask Nevo floats on every console surface. */}
      <AskNevo />
    </div>
  );
}
