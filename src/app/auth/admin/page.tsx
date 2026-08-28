import type { Metadata } from "next";
import { Suspense } from "react";
import { AdminSignIn } from "@/components/admin/Auth/AdminSignIn";

export const metadata: Metadata = {
  title: "Admin sign-in - Nevo",
};

// D02 Admin Sign-In - one door for every admin.
// Suspense because the form reads ?next=.
export default function AdminSignInPage() {
  return (
    <Suspense>
      <AdminSignIn />
    </Suspense>
  );
}
