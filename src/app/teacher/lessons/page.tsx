import type { Metadata } from "next";
import { LessonLibrary } from "@/components/teacher/Library/LessonLibrary";

export const metadata: Metadata = {
  title: "Lesson Library - Nevo",
};

// C06 Lesson Library - all lessons; the upload entry point.
export default function TeacherLessonsPage() {
  return <LessonLibrary />;
}
