import type { Metadata } from "next";
import { LandingPage } from "@/components/landing/LandingPage";

const TITLE = "Nevo - Every mind has its own language";
const DESCRIPTION =
  "Adaptive learning, in every child's own language. Nevo reshapes the same lesson to how each child learns - never a label, never a diagnosis.";

export const metadata: Metadata = {
  title: TITLE,
  description: DESCRIPTION,
  // Social unfurls (launch): the lesson-phone capture doubles as the card
  // image until a produced OG asset lands. metadataBase comes from the deploy
  // host; localhost is only the dev fallback.
  metadataBase: new URL(
    process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000",
  ),
  openGraph: {
    title: TITLE,
    description: DESCRIPTION,
    type: "website",
    siteName: "Nevo",
    images: [{ url: "/landing/lp-lesson-phone.png", width: 1500, height: 1948 }],
  },
  twitter: {
    card: "summary_large_image",
    title: TITLE,
    description: DESCRIPTION,
    images: ["/landing/lp-lesson-phone.png"],
  },
};

// The public landing page (SCRUM-43) owns `/`. TODO(auth): once the auth
// contract exists, authenticated users route straight to their role dashboard
// (FE Arch §2); the student app remains at /student/*.
export default function Home() {
  return <LandingPage />;
}
