import type { Metadata } from "next";
import { ItHomeView } from "@/components/admin/ItHome/ItHomeView";

export const metadata: Metadata = {
  title: "Systems overview - Nevo",
};

// D17 IT Admin Home - where an IT administrator lands. Sits UNDER /admin/sso so
// `activeNavLabel`'s longest-prefix rule lights the IT & SSO rail item without
// a new nav row, which is what the frame draws.
export default function AdminItHomePage() {
  return <ItHomeView />;
}
