import type { Metadata } from "next";
import { ConsoleSessionExpired } from "@/components/shared/ConsoleSessionExpired";
import { sessionEndReason } from "@/lib/auth/sessionEndReason";

export const metadata: Metadata = {
  title: "Session expired - Nevo",
};

/** Same screen, admin door. The frame is explicitly shared between consoles. */
export default async function AdminSessionExpiredPage({
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
      signInHref="/auth/admin"
      reason={sessionEndReason(reason)}
    />
  );
}
