import type { Invoice } from "@/lib/api/billing";
import { sumMoney } from "@/lib/money";

/**
 * D11.8 "Overdue, calmly" - the state SCRUM-98 says most products get wrong.
 *
 * Pure and separate from the screen because every sentence this produces is
 * said to a school that owes money, and the spec's constraints on it are
 * absolute rather than stylistic:
 *
 *   "No red, no warning glyph, no 'account at risk', no countdown to
 *    suspension, and no automated dunning tone."
 *
 *   "Access is never a lever - permanent. Non-payment never affects a
 *    student's or a teacher's access. Not at 60 days, not at 200, not ever ...
 *    there is no suspension state to design, no gated-access flag to render,
 *    and no copy anywhere that hints at one."
 *
 * So the row line says how long it has been and that nothing has changed for
 * the children, and stops. There is deliberately no consequence to state.
 *
 * A SETTLED INVOICE LEAVES NO RESIDUE: "Row returns to Paid with no residue:
 * no 'was late' marker, ever. The record is the invoice, not a judgement."
 * Nothing here reads `paidAt` to remember that something was once late.
 */

/** SCRUM-98: `overdue_panel_threshold_days = 60`. */
export const PANEL_THRESHOLD_DAYS = 60;

/**
 * Whole days past the due date, or null when we cannot say.
 *
 * Null for an unparseable date and null for anything not yet past due -
 * "0 days past its due date" is not a sentence anyone should read, and a date
 * we could not parse licenses no claim about lateness at all.
 */
export function daysPastDue(dueAt: string | null, now: number): number | null {
  if (!dueAt) return null;
  const due = Date.parse(dueAt);
  if (Number.isNaN(due)) return null;
  const days = Math.floor((now - due) / 86_400_000);
  return days >= 1 ? days : null;
}

/** The row's own line. Never a consequence, because there are none. */
export function overdueLine(days: number): string {
  return `${days} ${days === 1 ? "day" : "days"} past its due date. Nothing has changed for your students.`;
}

export interface OverduePanel {
  /** Every overdue invoice, for the total. */
  invoices: Invoice[];
  /** The longest anything has been outstanding. */
  worstDays: number;
}

/**
 * The page-level panel, or null.
 *
 * Only past the threshold, and only counting invoices whose lateness we can
 * actually measure: an invoice with an unreadable due date is not evidence of
 * anything, and must not be added to a total a bursar will reconcile against
 * their own records.
 */
export function overduePanel(
  invoices: Invoice[] | null,
  now: number,
): OverduePanel | null {
  if (!invoices) return null;
  const late = invoices
    .filter((i) => i.status === "overdue")
    .map((i) => ({ invoice: i, days: daysPastDue(i.dueAt, now) }))
    .filter((x): x is { invoice: Invoice; days: number } => x.days !== null);

  if (late.length === 0) return null;
  const worstDays = Math.max(...late.map((x) => x.days));
  if (worstDays < PANEL_THRESHOLD_DAYS) return null;

  return { invoices: late.map((x) => x.invoice), worstDays };
}

/**
 * The panel's opening sentence.
 *
 * SCRUM-98 gives two forms and the reason for the second: "Multiple overdue:
 * aggregate into one panel with a total and a count of invoices, rather than
 * repeating the panel per invoice." A school three invoices behind should not
 * meet three panels saying the same thing.
 *
 * `money` is injected rather than formatted here so the panel cannot disagree
 * with the rows above it about how a figure is written.
 */
export function overdueHeadline(
  panel: OverduePanel,
  money: (amount: string) => string,
  issuedOn: (iso: string) => string,
): string {
  if (panel.invoices.length > 1) {
    // Summed as decimal STRINGS - `money.ts` forbids putting a figure on an
    // invoice through a float, and this is exactly the figure a bursar
    // reconciles against their own ledger.
    const total = sumMoney(panel.invoices.map((i) => i.amount));
    return total === null
      ? `${panel.invoices.length} invoices are outstanding.`
      : `${panel.invoices.length} invoices are outstanding, totalling ${money(total)}.`;
  }
  const only = panel.invoices[0];
  return `${money(only.amount)} is outstanding from ${only.invoiceNumber}, issued ${issuedOn(only.issuedAt)}.`;
}
