import type { Metadata } from "next";
import { Suspense } from "react";
import { TeacherPasswordReset } from "@/components/teacher/Auth/TeacherPasswordReset";

export const metadata: Metadata = {
  title: "Reset your password - Nevo",
};

// C02d Password Reset - request a link, set a new password from the emailed
// link (?token=), or the expired-link recovery (?expired=1).
export default function TeacherResetPage() {
  return (
    <Suspense>
      <TeacherPasswordReset />
    </Suspense>
  );
}
