import type { Metadata } from "next";
import { LessonsTab } from "@/components/student/Lessons/LessonsTab";

export const metadata: Metadata = {
  title: "Lessons - Nevo",
};

export default function StudentLessonsPage() {
  return <LessonsTab />;
}
