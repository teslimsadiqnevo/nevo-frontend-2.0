import type { Metadata } from "next";
import { Suspense } from "react";
import { TeacherPasswordReset } from "@/components/teacher/Auth/TeacherPasswordReset";

export const metadata: Metadata = {
  title: "Reset your password - Nevo",
};

/**
 * A locked-out admin's way back into their own school.
 *
 * `AdminSignIn` told them to "reset your password" and offered nothing to press,
 * and its own docblock said "No reset endpoint exists anywhere in the spec".
 * Two do - `POST /auth/forgot-password` and
 * `POST /auth/password-reset/complete` - and the teacher console has been
 * consuming both since 1 Sep.
 *
 * The component is SHARED, not copied. Both endpoints are role-agnostic, so the
 * only thing that was teacher-specific about that screen is where its links
 * point; those are props now. A second copy would drift from it, and this one
 * already carries the reasoning that matters here - the request always shows
 * the same confirmation whether or not the address is known, so the screen
 * cannot be used to discover who has an account.
 *
 * `?token=` opens the set-password step, `?expired=1` the recovery.
 */
export default function AdminResetPage() {
  return (
    <Suspense>
      <TeacherPasswordReset
        signInHref="/auth/admin"
        resetHref="/auth/admin/reset"
      />
    </Suspense>
  );
}
