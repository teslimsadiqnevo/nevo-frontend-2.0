import type { Metadata } from "next";
import { HelpAndSupport } from "@/components/teacher/Support/HelpAndSupport";

export const metadata: Metadata = {
  title: "Help and support - Nevo",
};

// Design ruled one screen, not a knowledge base: email, WhatsApp, response
// time. On the pre-auth allowlist in `proxy.ts` because the endpoint behind it
// is public on purpose - a teacher who cannot sign in is exactly who needs it.
export default function TeacherHelpPage() {
  return <HelpAndSupport />;
}
