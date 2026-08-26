import type { Metadata } from "next";
import { Suspense } from "react";
import { SetPasswordForm } from "@/components/teacher/Auth/SetPasswordForm";
import { TEACHER_INVITE } from "@/lib/mocks/teacherOnboarding";

export const metadata: Metadata = {
  title: "Activate your account - Nevo",
};

// C02c Teacher Activation - opened from the invite link the admin sent.
// Clicking that link IS the verification; the teacher only sets a password.
export default function TeacherActivatePage() {
  return (
    <Suspense>
      <SetPasswordForm
        mode="activation"
        email={TEACHER_INVITE.email}
        school={`${TEACHER_INVITE.school} · ${TEACHER_INVITE.location}`}
      />
    </Suspense>
  );
}
