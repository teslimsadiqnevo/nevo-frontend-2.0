import type { Metadata } from "next";
import { ObservedInteractionSequence } from "@/components/student/Onboarding/ObservedInteractionSequence";

export const metadata: Metadata = {
  title: "Getting to know you — Nevo",
};

// Next.js 16: `searchParams` is a Promise and must be awaited.
// `?path=sso` (set by the SSO skip redirect) drives the SSO copy + PIN-as-SSO
// confirmation; manual students arrive with no param and default to "manual".
export default async function OnboardingSequencePage({
  searchParams,
}: {
  searchParams: Promise<{ path?: string }>;
}) {
  const { path } = await searchParams;
  return (
    <ObservedInteractionSequence path={path === "sso" ? "sso" : "manual"} />
  );
}
