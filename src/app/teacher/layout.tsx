import type { Metadata } from "next";
import { TeacherShell } from "@/components/teacher/Shell/TeacherShell";

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
 * tablet variants render the collapsed rail). TeacherShell renders the rail +
 * Ask Nevo on console surfaces and goes bare on full-screen flows (C01
 * onboarding).
 *
 * TODO(auth): layout-level teacher-role check once accounts exist (FE Arch §2).
 */
export default function TeacherLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return <TeacherShell>{children}</TeacherShell>;
}
