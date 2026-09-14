import type { Metadata } from "next";
import { ReturningSignInScreen } from "@/components/student/Auth/ReturningSignInScreen";
import { safeNextPath } from "@/lib/auth/nextPath";

export const metadata: Metadata = {
  title: "Sign back in - Nevo",
  robots: { index: false, follow: false },
};

/**
 * Frame 00c - returning student, unrecognised device.
 *
 * `?next=` is the path the proxy was trying to reach when it bounced a
 * signed-out child here. Read on the server so the client needs no
 * `useSearchParams` and its Suspense boundary for a value known before render.
 *
 * Next.js 16: `searchParams` is a Promise and must be awaited.
 */
export default async function ReturningSignInPage({
  searchParams,
}: {
  searchParams: Promise<{ next?: string }>;
}) {
  const { next } = await searchParams;
  return <ReturningSignInScreen next={safeNextPath(next)} />;
}
