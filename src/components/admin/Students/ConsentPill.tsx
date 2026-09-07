"use client";

import type { ConsentState, StudentConsent } from "@/lib/api/students";
import { cn } from "@/lib/utils";

/**
 * D07's consent state, in the four values SCRUM-40 asks for.
 *
 * This is the screen's whole reason for existing - "which students cannot yet
 * begin lessons" - and until the backend carried consent (7 Sep) it could not
 * be shown at all. It was deliberately never derived from `status`: an active
 * account is not a granted consent, and a school reading this is reading a
 * legal position.
 *
 * DESIGN LAW: no red. `withdrawn` is the state that most wants an alarm colour
 * and gets violet instead; `not_sent` is quiet rather than accusing, because a
 * school that has not sent a request yet has done nothing wrong.
 *
 * An ABSENT consent object is not `not_sent`. Older reads may omit the field,
 * and "we don't know" must not render as "nobody asked" - so it says so.
 */

const LABEL: Record<ConsentState, string> = {
  confirmed: "Confirmed",
  pending: "Pending",
  not_sent: "Not sent",
  withdrawn: "Withdrawn",
};

const TONE: Record<ConsentState, string> = {
  confirmed: "bg-nevo-navy/10 text-nevo-navy",
  pending: "bg-nevo-violet/25 text-nevo-navy",
  not_sent: "bg-nevo-near-black/[0.07] text-nevo-near-black/70",
  withdrawn: "bg-nevo-violet/40 text-nevo-navy",
};

export function ConsentPill({
  consent,
  className,
}: {
  consent: StudentConsent | null | undefined;
  className?: string;
}) {
  if (!consent) {
    return (
      <span
        className={cn(
          "shrink-0 rounded-full border border-dashed border-nevo-near-black/20 px-3 py-1 text-[12.5px] font-medium text-nevo-near-black/45",
          className,
        )}
        title="This read didn't carry a consent state"
      >
        Unknown
      </span>
    );
  }
  return (
    <span
      className={cn(
        "shrink-0 rounded-full px-3 py-1 text-[12.5px] font-semibold",
        TONE[consent.status],
        className,
      )}
    >
      {LABEL[consent.status]}
    </span>
  );
}

/** Students who cannot begin lessons - the count D07's header line quotes. */
export function blockedByConsent(
  rows: { consent?: StudentConsent | null }[],
): number {
  return rows.filter(
    (r) => r.consent && r.consent.status !== "confirmed",
  ).length;
}

/**
 * The sentence under a student's consent state, when there is one to tell.
 *
 * SCRUM-40 line 354 wants the actor and the date on a withdrawal - "Mrs. Eze
 * withdrew consent on 14 July" - and the same shape reads correctly for a
 * confirmation, so both are built from the one record.
 */
export function consentDetailLine(consent: StudentConsent): string | null {
  const when = consent.timestamp
    ? new Date(consent.timestamp).toLocaleDateString("en-GB", {
        day: "numeric",
        month: "long",
        year: "numeric",
      })
    : null;
  const who = consent.actorName;
  const via = consent.channel ? ` by ${consent.channel}` : "";

  if (consent.status === "confirmed") {
    if (who && when) return `${who} confirmed on ${when}${via}.`;
    if (when) return `Confirmed on ${when}${via}.`;
    return null;
  }
  if (consent.status === "withdrawn") {
    if (who && when) return `${who} withdrew consent on ${when}.`;
    if (when) return `Withdrawn on ${when}.`;
    return "Consent has been withdrawn.";
  }
  if (consent.status === "pending") {
    return when ? `Requested on ${when}${via}.` : "A request has been sent.";
  }
  return null;
}
