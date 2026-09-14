import type { Metadata } from "next";
import { FinanceHomeView } from "@/components/admin/FinanceHome/FinanceHomeView";

export const metadata: Metadata = {
  title: "Billing overview - Nevo",
};

// D18 Finance Home - where a finance administrator lands. Sits UNDER
// /admin/billing so `activeNavLabel`'s longest-prefix rule lights the Billing
// rail item without a new nav row, matching the frame.
export default function AdminFinanceHomePage() {
  return <FinanceHomeView />;
}
