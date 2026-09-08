import { describe, expect, it, vi } from "vitest";
import { render, waitFor } from "@testing-library/react";
import { HowToPayPanel } from "./HowToPayPanel";
import type { PaymentOutcome, ReceivingAccount } from "@/lib/api/billing";

/**
 * The two things here that cost real money if they are wrong.
 *
 * 1. NEVER INVENT AN ACCOUNT. With no receiving account the panel must say so
 *    rather than fall back on the frame's illustrative Kuda details, which
 *    would send a school's transfer to a number nobody sourced.
 * 2. A REPEAT IS NOT A FAILURE. The bank reference is an idempotency key, and
 *    the backend answers a second submission with the ORIGINAL transaction and
 *    a message saying it was already recorded. The panel must show that
 *    message, not a generic "sent" line and not an error.
 */

const account: ReceivingAccount = {
  bankName: "Kuda Bank",
  accountNumber: "3004167012",
  accountName: "Nevo Learning Limited",
};

const outcome = (message: string | null): PaymentOutcome => ({
  transactionId: "t1",
  invoiceId: "i3",
  reference: "FBN-TRF-99183",
  status: "pending",
  invoicePaid: false,
  message,
});

const shown = (c: HTMLElement) => (c.textContent ?? "").replace(/\u2019/g, "'");

const panel = (over: Partial<Parameters<typeof HowToPayPanel>[0]> = {}) =>
  render(
    <HowToPayPanel
      account={account}
      reference="NEV-2026-0001"
      amount="₦54,825,000"
      invoiceId="i3"
      recorded={null}
      onRecord={vi.fn(async () => outcome("Payment sent, pending verification."))}
      onRecorded={vi.fn()}
      {...over}
    />,
  );

describe("HowToPayPanel", () => {
  it("never shows an account when none was supplied", () => {
    const t = shown(panel({ account: null }).container);
    expect(t).toMatch(/aren't available here yet/);
    expect(t).not.toMatch(/Kuda|3004167012|Nevo Learning Limited/);
    // The reference IS known - it is on the invoice - so it still helps.
    expect(t).toMatch(/NEV-2026-0001/);
  });

  it("shows the backend's own words when a transfer was already recorded", () => {
    const t = shown(
      panel({ recorded: outcome("This transfer was already recorded.") })
        .container,
    );
    expect(t).toMatch(/This transfer was already recorded\./);
    // Not dressed up as a fresh submission, and not as an error.
    expect(t).not.toMatch(/didn't record/);
  });

  it("falls back to a plain pending line when the backend sent no message", () => {
    const t = shown(panel({ recorded: outcome(null) }).container);
    expect(t).toMatch(/pending verification/i);
  });

  it("sends the trimmed reference and the invoice id", async () => {
    const onRecord = vi.fn(async () => outcome("ok"));
    const { getByText, container } = panel({ onRecord });

    (getByText(/made this transfer/i) as HTMLElement).click();
    await waitFor(() =>
      expect(container.querySelector("input")).not.toBeNull(),
    );

    const input = container.querySelector("input") as HTMLInputElement;
    const setter = Object.getOwnPropertyDescriptor(
      window.HTMLInputElement.prototype,
      "value",
    )!.set!;
    setter.call(input, "  FBN-TRF-99183  ");
    input.dispatchEvent(new Event("input", { bubbles: true }));

    await waitFor(() =>
      expect(
        (getByText("Record transfer") as HTMLButtonElement).disabled,
      ).toBe(false),
    );
    (getByText("Record transfer") as HTMLElement).click();

    await waitFor(() => expect(onRecord).toHaveBeenCalledTimes(1));
    expect(onRecord).toHaveBeenCalledWith("i3", "FBN-TRF-99183");
  });

  it("will not submit a reference shorter than the API allows", async () => {
    const onRecord = vi.fn(async () => outcome("ok"));
    const { getByText, container } = panel({ onRecord });
    (getByText(/made this transfer/i) as HTMLElement).click();
    await waitFor(() =>
      expect(container.querySelector("input")).not.toBeNull(),
    );

    const input = container.querySelector("input") as HTMLInputElement;
    const setter = Object.getOwnPropertyDescriptor(
      window.HTMLInputElement.prototype,
      "value",
    )!.set!;
    setter.call(input, "ab");
    input.dispatchEvent(new Event("input", { bubbles: true }));

    await waitFor(() =>
      expect((getByText("Record transfer") as HTMLButtonElement).disabled).toBe(
        true,
      ),
    );
    expect(onRecord).not.toHaveBeenCalled();
  });
});
