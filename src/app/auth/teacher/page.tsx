import type { Metadata } from "next";
import { Suspense } from "react";
import { TeacherSignIn } from "@/components/teacher/Auth/TeacherSignIn";

export const metadata: Metadata = {
  title: "Teacher sign-in - Nevo",
};

// C02 Teacher Sign-In - email/password or school SSO, never PIN.
// Suspense because the form reads ?next= (set by the route guard).
export default function TeacherSignInPage() {
  return (
    <Suspense>
      <TeacherSignIn />
    </Suspense>
  );
}
