import { LessonLoadingSkeleton } from "@/components/student/Lesson/LessonLoadingSkeleton";

// Route-level loading UI (Next.js file convention) — the instant Suspense
// fallback shown while the lesson streams in from the server.
export default function Loading() {
  return <LessonLoadingSkeleton />;
}
