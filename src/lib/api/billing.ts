import { api } from "./client";

/**
 * Billing reads and the one write we can honestly make.
 *
 * NINE operations are deployed; this file types the four the screen can use,
 * and deliberately leaves the rest alone. What is missing is not plumbing:
 *
 * - `GET /billing/subscription` returns `subscriptionTier`, `studentCountBand`
 *   and a flat `contractValue`. D11/D11b supersede that with per-student
 *   pricing - roster count x N150,000 + 7.5% VAT, "no tiers, no plan
 *   selection" - so the cost sheet cannot be rendered from either side without
 *   a ruling. The fields are typed here because they are real, and the screen
 *   does not display them.
 * - `PUT /billing/payment-method` takes `card` or `direct_debit`. D11 says
 *   "no cards, no in-app checkout".
 * - `POST /billing/payments/checkout` returns a Paystack `authorizationUrl` -
 *   a hosted gateway checkout, which is the thing D11 forbids.
 * - D11's "How to pay" panel needs Nevo's own bank account, and NOTHING in the
 *   spec carries one (checked field by field across every schema). The frame
 *   fills it with literal account details. Hard-coding a real payable account
 *   into the frontend is not a shortcut worth taking, so the panel is absent.
 *
 * What IS honest today: the invoice list and its PDFs, the upcoming charge, the
 * renewal banner, and the billing contact.
 *
 * THE RECEIVING ACCOUNT IS A SEAM, NOT A FEATURE (design ruling, 7 Sep). Teslim
 * is building an endpoint for it; nothing serves one yet - a scan of all 168
 * paths for account/bank/transfer/remit returns nothing. So `receivingAccount`
 * is typed to the shape D11c needs and its path is PROVISIONAL: it 404s today,
 * which the panel renders as "not available yet" rather than as an error. When
 * the endpoint lands, confirm the path and the field names; if they differ,
 * this is the one place to change.
 *
 * The four values are bound, never literals. D11c's frame fills them in with
 * Kuda Bank and an account number - those are the frame's illustration, and an
 * unsourced payable account in frontend source sends real money to the wrong
 * place the day it goes stale.
 */

export type InvoiceStatus = "paid" | "pending" | "overdue";

export interface Invoice {
  id: string;
  invoiceNumber: string;
  issuedAt: string;
  /** A decimal STRING from the API - never parsed into a float for display. */
  amount: string;
  status: InvoiceStatus;
  dueAt: string;
  paidAt: string | null;
  pdfUrl: string;
}

export interface UpcomingCharge {
  invoiceId: string | null;
  invoiceNumber: string | null;
  dueAt: string | null;
  amount: string | null;
  status: InvoiceStatus | null;
  renewalBannerVisible: boolean;
  renewalMessage: string | null;
}

export interface BillingContact {
  id: string;
  email: string;
  phone: string | null;
  addressLine1: string;
  addressLine2: string | null;
  city: string;
  region: string | null;
  postalCode: string | null;
  country: string;
}

export interface BillingContactDraft {
  email: string;
  phone?: string | null;
  addressLine1: string;
  addressLine2?: string | null;
  city: string;
  region?: string | null;
  postalCode?: string | null;
  country: string;
}

/**
 * The subscription read. `subscriptionTier`, `studentCountBand` and
 * `contractValue` are typed because the endpoint returns them, and are NOT
 * rendered - see the note above.
 */
export interface Subscription {
  schoolId: string;
  schoolName: string;
  subscriptionTier: string | null;
  studentCountBand: string | null;
  contractValue: string | null;
  contractStart: string | null;
  contractEnd: string | null;
  renewalBannerVisible: boolean;
  renewalMessage: string | null;
  billingContact: BillingContact | null;
}

/**
 * Where a school transfers to. Every field is required: a partial account is
 * worse than none, because an admin would transfer against it anyway.
 */
export interface ReceivingAccount {
  bankName: string;
  accountNumber: string;
  accountName: string;
}

export const billingApi = {
  /**
   * PROVISIONAL PATH - see the note above. Resolves to null when the endpoint
   * is absent (404) or answers with an incomplete account, so the panel can
   * tell "not available yet" apart from a read that failed.
   */
  receivingAccount: () =>
    api
      .get<Partial<ReceivingAccount>>("/api/billing/receiving-account")
      .then((a) =>
        a && a.bankName && a.accountNumber && a.accountName
          ? ({
              bankName: a.bankName,
              accountNumber: a.accountNumber,
              accountName: a.accountName,
            } satisfies ReceivingAccount)
          : null,
      ),
  subscription: () => api.get<Subscription>("/api/billing/subscription"),
  invoices: () => api.get<Invoice[]>("/api/billing/invoices"),
  upcoming: () => api.get<UpcomingCharge>("/api/billing/upcoming"),
  updateContact: (draft: BillingContactDraft) =>
    api.put<BillingContact>("/api/billing/billing-contact", draft),
};
