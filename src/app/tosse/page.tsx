import type { Metadata } from "next";
import { TosseInterestPage } from "@/components/tosse/TosseInterestPage";
import { SITE_NAME, SITE_URL } from "@/lib/site";

const TITLE = "Become a Nevo Founding Partner";
const DESCRIPTION =
  "Nevo turns your teachers' lessons into personalised learning for every student. Tell us about your school and join the Founding Partner programme.";

export const metadata: Metadata = {
  title: TITLE,
  description: DESCRIPTION,
  metadataBase: new URL(SITE_URL),
  alternates: { canonical: "/tosse" },
  // An event page reached by QR code at the booth, not a search surface - it
  // should not compete with `/` in the index or outlive TOSSE there. Flip this
  // to `index: true` if it is ever reused as a standing campaign page.
  robots: { index: false, follow: false },
  openGraph: {
    title: TITLE,
    description: DESCRIPTION,
    type: "website",
    siteName: SITE_NAME,
    url: `${SITE_URL}/tosse`,
    locale: "en_NG",
    images: [
      {
        url: "/og-card.png",
        width: 1200,
        height: 630,
        alt: "Nevo - every mind has its own language. Nevo learns to speak it.",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: TITLE,
    description: DESCRIPTION,
    images: ["/og-card.png"],
  },
};

/**
 * TOSSE Founding Partner interest capture (SCRUM-117). Single page, no routing:
 * schools scan the booth QR code, land here, and submit once.
 */
export default function TossePage() {
  return <TosseInterestPage />;
}
