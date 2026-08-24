import type { Metadata } from "next";
import { AskNevo } from "@/components/teacher/Shell/AskNevo";
import { TeacherSidebar } from "@/components/teacher/Shell/TeacherSidebar";

// Signed-in product surface - never indexed.
export const metadata: Metadata = {
  robots: { index: false, follow: false },
};


/**
 * Teacher Console context layout (Product Arch A.1 - responsive across desktop
 * and tablet, every screen fully functional on both).
 *
 * The nav rail is the same at every size (`Nevo Teacher Sidebar`): desktop
 * opens expanded, tablet collapsed - never a bottom nav (the C-screen docs'
 * tablet variants render the collapsed rail).
 *
 * TODO(auth): layout-level teacher-role check once accounts exist (FE Arch §2).
 */
export default function TeacherLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
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
