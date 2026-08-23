import type { Metadata } from "next";
import { LandingPage } from "@/components/landing/LandingPage";
import { SITE_NAME, SITE_URL } from "@/lib/site";

const TITLE = "Nevo - Every mind has its own language";
const DESCRIPTION =
  "Adaptive learning, in every child's own language. Nevo reshapes the same lesson to how each child learns - never a label, never a diagnosis.";

// Purpose-built 1200x630 card. The old value was the 1500x1948 lesson-phone
// capture, which every social platform cropped to a sliver.
const OG_IMAGE = {
  url: "/og-card.png",
  width: 1200,
  height: 630,
  alt: "Nevo - every mind has its own language. Nevo learns to speak it.",
};

export const metadata: Metadata = {
  title: TITLE,
  description: DESCRIPTION,
  metadataBase: new URL(SITE_URL),
  alternates: { canonical: "/" },
  openGraph: {
    title: TITLE,
    description: DESCRIPTION,
    type: "website",
    siteName: SITE_NAME,
    url: SITE_URL,
    locale: "en_NG",
    images: [OG_IMAGE],
  },
  twitter: {
    card: "summary_large_image",
    title: TITLE,
    description: DESCRIPTION,
    images: [OG_IMAGE.url],
  },
};

/**
 * Organization data, so searching the brand can resolve to a real entity
 * rather than a bare blue link. Kept to facts already on the page.
 */
const ORG_JSON_LD = {
  "@context": "https://schema.org",
  "@type": "EducationalOrganization",
  name: SITE_NAME,
  url: SITE_URL,
  logo: `${SITE_URL}/brand/nevo-logo-combined.png`,
  image: `${SITE_URL}/og-card.png`,
  description: DESCRIPTION,
  email: "support@nevolearning.com",
  address: {
    "@type": "PostalAddress",
    addressLocality: "Lagos",
    addressCountry: "NG",
  },
};

// The public landing page (SCRUM-43) owns `/`. TODO(auth): once the auth
// contract exists, authenticated users route straight to their role dashboard
// (FE Arch §2); the student app remains at /student/*.
export default function Home() {
  return (
    <>
      <script
        type="application/ld+json"
        // Static, author-controlled object - no user input reaches this.
        dangerouslySetInnerHTML={{ __html: JSON.stringify(ORG_JSON_LD) }}
      />
      <LandingPage />
    </>
  );
}
