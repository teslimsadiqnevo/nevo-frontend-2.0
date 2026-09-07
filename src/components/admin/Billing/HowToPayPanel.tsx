"use client";

import { useEffect, useRef, useState } from "react";
import type { ReceivingAccount } from "@/lib/api/billing";
import { cn } from "@/lib/utils";

/**
 * D11c "How to pay" - the transfer details for the invoice a school owes.
 *
 * BOUND, NEVER LITERAL. The frame fills this panel in with Kuda Bank and an
 * account number; those are its illustration. Every value here comes from
 * `billingApi.receivingAccount`, and when that answers with nothing - which is
 * today, because the endpoint does not exist yet - the panel says the details
 * are not available and points at what IS known: the reference, which the
 * invoice already carries. It never invents an account.
 *
 * "PENDING VERIFICATION" IS THE ADMIN'S CLAIM, NOT OURS. `InvoiceStatus` is
 * `[paid, pending, overdue]`; there is no fourth value, and no endpoint we can
 * honestly call on a bank transfer. So per the design ruling this state is
 * local and optimistic: it records that the admin SAYS they have transferred,
 * it is worded as their assertion rather than a confirmed payment, and it does
 * not survive a reload. The webhook drives the real status, and the invoice
 * pill follows the backend once it does.
 *
 * (A `POST /billing/payments/{reference}/verify` does exist. It is deliberately
 * not wired: its semantics for a bank-transfer reference are unconfirmed, and
 * guessing on a payments endpoint is not worth the convenience.)
 */

const CARD = "rounded-xl bg-nevo-cream-elevated shadow-[0_2px_8px_rgba(0,0,0,0.06)]";
const COPIED_MS = 1800;

function CopyField({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  const [copied, setCopied] = useState(false);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(
    () => () => {
      if (timer.current) clearTimeout(timer.current);
    },
    [],
  );

  const copy = () => {
    navigator.clipboard
      ?.writeText(value)
      .then(() => {
        setCopied(true);
        if (timer.current) clearTimeout(timer.current);
        timer.current = setTimeout(() => setCopied(false), COPIED_MS);
      })
      // A clipboard an admin's browser refuses is not a copy that happened.
      .catch(() => setCopied(false));
  };

  return (
    <div className="flex items-baseline justify-between gap-4 py-2.5">
      <span className="flex min-w-0 flex-col">
        <span className="text-[12.5px] text-nevo-near-black/55">{label}</span>
        <span className="mt-0.5 font-mono text-[15px] font-semibold text-nevo-near-black">
          {value}
        </span>
      </span>
      <button
        type="button"
        onClick={copy}
        className="shrink-0 cursor-pointer text-[13px] font-semibold text-nevo-navy hover:underline"
      >
        {copied ? "Copied" : "Copy"}
      </button>
    </div>
  );
}

export function HowToPayPanel({
  account,
  reference,
  amount,
  declared,
  onDeclare,
}: {
  /** Null until the endpoint exists, or when it answers incompletely. */
  account: ReceivingAccount | null;
  /** The invoice reference to quote on the transfer. */
  reference: string | null;
  /** Formatted, already grouped by the caller. */
  amount: string | null;
  /** The admin has said they transferred - local, optimistic, this session. */
  declared: boolean;
  onDeclare: () => void;
}) {
  return (
    <>
      <h2 className="mt-8 text-[13.5px] font-semibold tracking-[0.04em] text-nevo-near-black/55 uppercase">
        How to pay
      </h2>
      <div className={cn(CARD, "mt-3 px-6 py-[22px]")}>
        {account ? (
          <>
            {amount && (
              <p className="m-0 text-[14.5px] leading-[1.55] text-nevo-near-black/78">
                Transfer <strong>{amount}</strong>{" "}
                from your school&rsquo;s bank.
              </p>
            )}
            <div className="mt-3 divide-y divide-nevo-near-black/7">
              <div className="flex items-baseline justify-between gap-4 py-2.5">
                <span className="flex min-w-0 flex-col">
                  <span className="text-[12.5px] text-nevo-near-black/55">
                    Bank
                  </span>
                  <span className="mt-0.5 text-[15px] font-semibold text-nevo-near-black">
                    {account.bankName}
                  </span>
                </span>
              </div>
              <div className="flex items-baseline justify-between gap-4 py-2.5">
                <span className="flex min-w-0 flex-col">
                  <span className="text-[12.5px] text-nevo-near-black/55">
                    Account name
                  </span>
                  <span className="mt-0.5 text-[15px] font-semibold text-nevo-near-black">
                    {account.accountName}
                  </span>
                </span>
              </div>
              <CopyField label="Account number" value={account.accountNumber} />
              {reference && <CopyField label="Reference" value={reference} />}
            </div>
            {reference && (
              <p className="m-0 mt-3 text-[13px] leading-[1.55] text-nevo-near-black/62">
                Use the reference exactly as shown so your transfer is matched
                to this invoice.
              </p>
            )}
          </>
        ) : (
          /* No account, and no invented one. Say so, and give them the one
             thing that IS known - the reference is on the invoice already. */
          <>
            <p className="m-0 text-[14.5px] leading-[1.55] text-nevo-near-black/78">
              Transfer details aren&rsquo;t available here yet.
            </p>
            <p className="m-0 mt-1.5 text-[13.5px] leading-[1.55] text-nevo-near-black/62">
              Your invoice carries the amount
              {reference ? (
                <>
                  {" "}
                  and the reference <strong>{reference}</strong>
                </>
              ) : null}
              . Nevo will confirm the account to transfer to.
            </p>
          </>
        )}

        <div className="mt-5">
          {declared ? (
            /* Swaps in place - no modal, per the ruling. Worded as what the
               ADMIN told us, because nothing has confirmed it. */
            <p
              role="status"
              className="m-0 rounded-[10px] bg-nevo-violet/[0.18] px-4 py-3 text-[13.5px] leading-[1.5] text-nevo-navy"
            >
              Payment sent, pending verification. We&rsquo;ll update this
              invoice as soon as the transfer is confirmed.
            </p>
          ) : (
            <button
              type="button"
              onClick={onDeclare}
              className="h-11 cursor-pointer rounded-[10px] border border-nevo-navy bg-nevo-cream px-5 text-[14.5px] font-semibold text-nevo-navy transition-colors hover:bg-nevo-navy/6"
            >
              I&rsquo;ve made this transfer
            </button>
          )}
        </div>
      </div>
    </>
  );
}
