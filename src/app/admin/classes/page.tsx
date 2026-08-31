import type { Metadata } from "next";
import { ClassesView } from "@/components/admin/Classes/ClassesView";

export const metadata: Metadata = {
  title: "Classes - Nevo",
};

// D5 Classes - the operational backbone of the roster (SCRUM-40).
export default function AdminClassesPage() {
  return <ClassesView />;
}
