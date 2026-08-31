"use client";

import { usePathname } from "next/navigation";
import { TEXT_ZOOM, useAccessibility } from "@/context/AccessibilityContext";
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
  const { textSize } = useAccessibility();

  if (pathname.startsWith("/teacher/onboarding")) return <>{children}</>;

  /*
   * The pill yields inside the upload wizard and returns when it closes
   * (design, 31 Aug). Upload is the one console flow that owns the whole
   * screen - a floating pill over a file picker and a structure tree is
   * competing with the thing the teacher came to do.
   *
   * Route-based rather than state-based: the wizard's steps are URLs, so
   * leaving the flow is what brings the pill back, with no state to reset.
   */
  const inUpload = pathname.startsWith("/teacher/lessons/upload");

  return (
    <div className="flex h-dvh flex-row overflow-hidden bg-nevo-cream text-nevo-near-black">
      <TeacherSidebar />
      {/* "Larger text" is a console-wide preference, so the zoom lives on
          the shell, not one page. The rail keeps its own scale, as in the
          student app. `zoom: var(...)` is unsupported, hence the map. */}
      <main
        className="flex min-w-0 flex-1 flex-col overflow-y-auto"
        style={{ zoom: TEXT_ZOOM[textSize] }}
      >
        {children}
      </main>
      {/* C15: Ask Nevo floats on every console surface except upload. */}
      {!inUpload && <AskNevo />}
    </div>
  );
}
