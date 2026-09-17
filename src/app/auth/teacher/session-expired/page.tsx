import type { Metadata } from "next";
import { ConsoleSessionExpired } from "@/components/shared/ConsoleSessionExpired";
import { sessionEndReason } from "@/lib/auth/sessionEndReason";

export const metadata: Metadata = {
  title: "Session expired - Nevo",
};

/** The teacher console's timeout landing; the door behind it is the teacher's. */
export default async function TeacherSessionExpiredPage({
  searchParams,
}: {
  searchParams: Promise<{ reason?: string }>;
}) {
  // `client.ts` puts the backend's own code here on its way out. Anything
  // unrecognised resolves to the ordinary screen, so a hand-typed or stale
  // value can only under-claim. Next.js 16: `searchParams` is a Promise.
  const { reason } = await searchParams;
  return (
    <ConsoleSessionExpired
      signInHref="/auth/teacher"
      reason={sessionEndReason(reason)}
    />
  );
}
