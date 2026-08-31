import type { Metadata } from "next";
import { Suspense } from "react";
import { StudentsView } from "@/components/admin/Students/StudentsView";

export const metadata: Metadata = {
  title: "Students - Nevo",
};

// D7 Students - the school roster (SCRUM-40). `useSearchParams` needs a
// Suspense boundary above it, so the class filter can arrive by URL.
export default function AdminStudentsPage() {
  return (
    <Suspense fallback={null}>
      <StudentsView />
    </Suspense>
  );
}
