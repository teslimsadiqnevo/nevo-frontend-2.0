/**
 * Student App context layout (Product Arch A.1 — tablet-first, calm, low
 * cognitive load).
 *
 * Will host, along the way:
 * - Layout-level auth check backing up proxy.ts (student role — FE Arch §2)
 * - LessonContext provider around the lesson scope (FE Arch §8)
 * - Sidebar navigation (B.5) — hidden entirely during the immersive Lesson Player
 */
export default function StudentLayout({
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
