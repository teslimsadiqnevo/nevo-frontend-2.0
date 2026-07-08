import { LessonProvider } from "@/context/LessonContext";

/**
 * Lesson-scoped layout — wraps the Lesson Player in LessonContext (student only,
 * FE Architecture §8). Scoped here rather than the whole Student App so lesson
 * state/adaptation/signals live only for the active lesson.
 */
export default function LessonLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return <LessonProvider>{children}</LessonProvider>;
}
