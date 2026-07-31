import type { Metadata } from "next";
import { Suspense } from "react";
import { TeacherJoin } from "@/components/student/Onboarding/TeacherJoin";

export const metadata: Metadata = {
  title: "Join through your teacher - Nevo",
};

// Teacher Join (screen 03) - reached from the Welcome screen's teacher-invite
// sheet. `TeacherJoin` reads `useSearchParams` (?mode=scan|code), which
// requires a Suspense boundary.
export default function TeacherJoinPage() {
  return (
    <Suspense>
      <TeacherJoin />
    </Suspense>
  );
}
