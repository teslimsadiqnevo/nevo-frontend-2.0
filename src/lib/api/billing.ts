import { api } from "./client";

/**
 * Billing reads and the one write we can honestly make.
 *
 * NINE operations are deployed; this file types the four the screen can use,
 * and deliberately leaves the rest alone. What is missing is not plumbing:
 *
 * - THE PRICING DISPUTE IS SETTLED (7 Sep). `pricingModel` is a CONST
 *   `"per_student"` in the contract itself, and the read now carries
 *   `activeStudentCount`, `perStudentAnnualRate` and `currency` - so the cost
 *   sheet is computed from the same numbers the school is billed on. The old
 *   `subscriptionTier` / `studentCountBand` / `contractValue` fields are still
 *   returned and still not displayed: they are SCRUM-98's model, which D11
 *   superseded.
 * - `PUT /billing/payment-method` takes `card` or `direct_debit`. D11 says
 *   "no cards, no in-app checkout".
 * - `POST /billing/payments/checkout` returns a Paystack `authorizationUrl` -
 *   a hosted gateway checkout, which is the thing D11 forbids.
 * - `POST /billing/payments/{reference}/verify` is a WRITE, not a lookup:
 *   backend's own words are that it asks Paystack about a transaction and
 *   settles the invoice off the answer, so a bank reference 404s there. Manual
 *   transfers go through `manualTransfer` below instead.
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
/** The three the backend will price in. Never assume naira. */
export type PricingCurrency = "USD" | "NGN" | "GBP";

export interface Subscription {
  schoolId: string;
  schoolName: string;
  /** A const in the contract - the model is settled, not a variable. */
  pricingModel: "per_student";
  /** What the school is billed ON. Not the same as invited or profiled. */
  activeStudentCount: number;
  /** Decimal STRING, and nullable - no rate means no cost sheet. */
  perStudentAnnualRate: string | null;
  currency: PricingCurrency;
  /** SCRUM-98's model. Still returned, never displayed - see the note above. */
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

/** What the backend made of a declared transfer. */
export interface PaymentOutcome {
  transactionId: string;
  invoiceId: string | null;
  reference: string;
  status: "pending" | "success" | "failed" | "abandoned";
  invoicePaid: boolean;
  message: string | null;
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
  /**
   * Record a bank transfer the school says they have made.
   *
   * `bankReference` is the IDEMPOTENCY KEY, not just a label: confirming the
   * same transfer twice returns the original transaction with
   * `invoicePaid: false` and a message saying it was already recorded, so a
   * double-tap cannot settle an invoice twice. The screen surfaces that message
   * rather than treating the second call as a failure.
   */
  manualTransfer: (invoiceId: string, bankReference: string) =>
    api.post<PaymentOutcome>("/api/billing/payments/manual-transfer", {
      invoiceId,
      bankReference,
    }),
};

/** The API's own bounds on `bankReference`. */
export const BANK_REF_MIN = 3;
export const BANK_REF_MAX = 120;
