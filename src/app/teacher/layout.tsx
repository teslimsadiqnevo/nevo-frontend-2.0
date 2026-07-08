/**
 * Teacher Console context layout (Product Arch A.1 — responsive across desktop
 * and tablet, every screen fully functional on both).
 *
 * Will host, along the way:
 * - Layout-level auth check backing up proxy.ts (teacher role — FE Arch §2)
 * - Sidebar navigation (C.4) — collapses to bottom nav on tablet (FE Arch §7)
 */
export default function TeacherLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <div className="flex min-h-full flex-1 flex-col bg-nevo-cream text-nevo-near-black">
      {children}
    </div>
  );
}
