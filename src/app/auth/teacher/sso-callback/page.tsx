import type { Metadata } from "next";
import { Suspense } from "react";
import { TeacherSsoCallback } from "@/components/teacher/Auth/TeacherSsoCallback";

export const metadata: Metadata = {
  title: "Signing you in - Nevo",
};

// C02b - SSO callback, success bridge, and the calm error that points to IT.
// Suspense because the component reads useSearchParams.
export default function TeacherSsoCallbackPage() {
  return (
    <Suspense>
      <TeacherSsoCallback />
    </Suspense>
  );
}
