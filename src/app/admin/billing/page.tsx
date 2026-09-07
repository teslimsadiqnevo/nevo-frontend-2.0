import { BillingView } from "@/components/admin/Billing/BillingView";

/**
 * D11 / D11b Billing. Scope-gated to `billing` by the rail; the screen itself
 * explains which parts are not built yet and why - see `BillingView`.
 */
export default function AdminBillingPage() {
  return <BillingView />;
}
