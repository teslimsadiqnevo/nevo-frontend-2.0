import type { Metadata } from "next";
import { TeacherSignIn } from "@/components/teacher/Auth/TeacherSignIn";

export const metadata: Metadata = {
  title: "Teacher sign-in - Nevo",
};

// C02 Teacher Sign-In - email/password or school SSO, never PIN.
export default function TeacherSignInPage() {
  return <TeacherSignIn />;
}
