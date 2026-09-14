import type {
  Invoice,
  PaymentMethod,
  Subscription,
  UpcomingCharge,
} from "@/lib/api/billing";
import { formatMoney } from "@/lib/money";
import { longDate } from "@/lib/dates";

/**
 * What the finance home puts under "Worth a glance".
 *
 * Pure, because every row here is a statement about a school's money and the
 * rules are easier to test than to eyeball. Two in particular:
 *
 *  - A ROW WHOSE FIELD IS NULL DOES NOT RENDER. `UpcomingCharge` has FIVE
 *    nullable fields including `dueAt` and `amount`, and `Subscription`'s
 *    `paymentMethod` and `rateLockedUntil` are nullable too. An invoice row
 *    reading "due null" or a lock reading "until Invalid Date" is worse than an
 *    absent row on this screen of all screens.
 *  - NOTHING HERE CLAIMS A PAYMENT STATUS THE READ DID NOT ESTABLISH. Whether
 *    anything is overdue comes from the invoice list, and if that list did not
 *    answer, the screen says so rather than implying all is well.
 */

export type RowKind = "soft" | "neutral";

export interface MoneyRow {
  key: string;
  kind: RowKind;
  title: string;
  sub: string;
  action: string;
  href: string;
}

const BILLING = "/admin/billing";

/** Invoices the school still owes, or null when the list did not answer. */
export function overdueCount(invoices: Invoice[] | null): number | null {
  if (!invoices) return null;
  return invoices.filter((i) => i.status === "overdue").length;
}

function cardLine(pm: PaymentMethod): string {
  // `cardBrand` is nullable and there is no processor field on the READ at all
  // (only on the write), so neither is asserted. `displayName` and `lastFour`
  // are required, which is why they carry the sentence.
  const brand = pm.cardBrand ? `${pm.cardBrand} ` : "";
  return `${brand}ending ${pm.lastFour}. You can update it in Billing whenever you need to.`;
}

export function financeHomeRows(
  subscription: Subscription | null,
  upcoming: UpcomingCharge | null,
  invoices: Invoice[] | null,
): MoneyRow[] {
  const rows: MoneyRow[] = [];
  if (!subscription) return rows;

  const overdue = overdueCount(invoices);
  if (overdue && overdue > 0) {
    rows.push({
      key: "overdue",
      // Soft violet, never red. Overdue billing never gates access and the
      // colour must not imply that it does.
      kind: "soft",
      title:
        overdue === 1
          ? "One invoice hasn't been settled yet"
          : `${overdue} invoices haven't been settled yet`,
      sub: "Your school keeps full access either way. Billing has the details.",
      action: "View in Billing",
      href: BILLING,
    });
  }

  // Both halves are nullable and the row needs both to say anything useful.
  const due = longDate(upcoming?.dueAt);
  if (due && upcoming?.amount) {
    const label = upcoming.invoiceNumber ? `Invoice ${upcoming.invoiceNumber}` : "Your next invoice";
    rows.push({
      key: "upcoming",
      kind: "neutral",
      // "is due", never "issues on": `UpcomingCharge` carries a due date and no
      // issue date, and the frame's "issues on" would name a different event.
      title: `${label} is due ${due}`,
      sub: `${formatMoney(upcoming.amount, subscription.pricing.currency)}. We'll email your billing contact, and it'll appear in Billing.`,
      action: "View in Billing",
      href: BILLING,
    });
  }

  if (subscription.paymentMethod) {
    rows.push({
      key: "payment-method",
      kind: "neutral",
      title: `A payment method is on file: ${subscription.paymentMethod.displayName}`,
      sub: cardLine(subscription.paymentMethod),
      action: "Manage",
      href: BILLING,
    });
  }

  const locked = longDate(subscription.pricing.rateLockedUntil);
  if (locked) {
    rows.push({
      key: "rate-lock",
      kind: "neutral",
      title:
        subscription.pricing.rateType === "founding_partner"
          ? `Your founding-partner rate is held until ${locked}`
          : `Your rate is held until ${locked}`,
      sub: `${formatMoney(subscription.pricing.perStudentRate, subscription.pricing.currency)} per student. The full schedule is in Billing.`,
      action: "See schedule",
      href: BILLING,
    });
  }

  return rows;
}
