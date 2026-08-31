import type { Metadata } from "next";
import { TeachersView } from "@/components/admin/Teachers/TeachersView";

export const metadata: Metadata = {
  title: "Teachers - Nevo",
};

// D6 Teachers - oversight of staff, never a performance surface (SCRUM-40).
export default function AdminTeachersPage() {
  return <TeachersView />;
}
