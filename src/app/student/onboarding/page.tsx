import type { Metadata } from "next";
import { WelcomeScreen } from "@/components/student/Welcome/WelcomeScreen";

export const metadata: Metadata = {
  title: "Welcome - Nevo",
};

// The onboarding flow entry is the Welcome Screen (B.1). Subsequent steps
// (name, school, class) live under /student/onboarding/*.
//
// `?token=` is the join link's hand-off. It is read here, on the server, so
// the client never needs `useSearchParams` and its Suspense boundary for a
// value that is known before the page renders.
//
// Next.js 16: `searchParams` is a Promise and must be awaited.
export default async function StudentOnboardingPage({
  searchParams,
}: {
  searchParams: Promise<{ token?: string }>;
}) {
  const { token } = await searchParams;
  return <WelcomeScreen joinToken={token} />;
}
