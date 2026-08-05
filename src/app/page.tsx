import type { Metadata } from "next";
import { LandingPage } from "@/components/landing/LandingPage";

export const metadata: Metadata = {
  title: "Nevo - Every mind has its own language",
  description:
    "Adaptive learning, in every child's own language. Nevo reshapes the same lesson to how each child learns - never a label, never a diagnosis.",
};

// The public landing page (SCRUM-43) owns `/`. TODO(auth): once the auth
// contract exists, authenticated users route straight to their role dashboard
// (FE Arch §2); the student app remains at /student/*.
export default function Home() {
  return <LandingPage />;
}
