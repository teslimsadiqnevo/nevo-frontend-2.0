import type { Metadata } from "next";
import { ClassesList } from "@/components/teacher/Classes/ClassesList";

export const metadata: Metadata = {
  title: "My Classes - Nevo",
};

// C05 My Classes - class list + roster entry.
export default function TeacherClassesPage() {
  return <ClassesList />;
}
