import type { Metadata } from "next";
import { Suspense } from "react";
import { TeacherPasswordReset } from "@/components/teacher/Auth/TeacherPasswordReset";

export const metadata: Metadata = {
  title: "Reset your password - Nevo",
};

/**
 * The role-neutral reset route, and it was a nine-line placeholder.
 *
 * That matters more than it looks: the BACKEND composes the emailed reset link,
 * so this side cannot know which URL it points at. If it sends anyone here -
 * and this is the obvious address for a role-agnostic endpoint - the link
 * landed on "Placeholder - built per the UI/UX spec." The console-specific
 * routes (`/auth/teacher/reset`, `/auth/admin/reset`) are the ones we link to
 * ourselves; this one exists so an inbound link cannot land on nothing.
 *
 * SIGN-IN POINTS AT THE LANDING PAGE, deliberately. Nothing at this URL knows
 * whether the person is a teacher or an admin, so sending them to either
 * console's door would be a guess. The landing page carries both entrances.
 */
export default function ForgotPasswordPage() {
  return (
    <Suspense>
      <TeacherPasswordReset signInHref="/" resetHref="/auth/forgot-password" />
    </Suspense>
  );
}
