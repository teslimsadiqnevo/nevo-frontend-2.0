import type { InvitationDeliveryStatus } from "@/lib/api/invites";

/**
 * What we are allowed to tell an admin after an invite goes out.
 *
 * Two separate things were being claimed here, and neither was checked.
 *
 * 1. THE INVITE EMAIL. The backend reports `deliveryStatus`, and is explicit
 *    in the spec that `email_not_configured` is "deliberately distinct from
 *    sent: the invitation exists and its link is valid, but nobody was
 *    emailed, so the caller has to deliver it another way". The screen used to
 *    interpolate that value raw - a real admin read "Delivery:
 *    email_not_configured." - which names the condition without telling them
 *    the one thing it means for them: send the link yourself.
 *
 * 2. THE PARENT CONSENT REQUEST. Both invite flows told the admin a consent
 *    request had been sent to the parent, and nothing supported that. The
 *    claim was produced from the parent contact the admin had just typed.
 *
 *    TWO SENTENCES THAT USED TO JUSTIFY THIS ARE NOW FALSE, and both were the
 *    kind that stop a future reader from looking again:
 *
 *      - "`InvitationResponse` carries no consent field." It carries
 *        `consentStatus: ConsentStatus | null` - not_sent | pending |
 *        confirmed | withdrawn - which is exactly the state this file said no
 *        screen could honestly report.
 *      - "`consentsApi.requestParentConsent` is typed in this repo with NO
 *        CALLER anywhere." It has callers now: the roster row and the
 *        student's own record, via `useConsentRequests`.
 *
 *    TODO (client, not api): thread `consentStatus` onto `Invitation` in
 *    `lib/api/invites.ts` and branch `parentConsentLine` on it - nobody asked
 *    yet / asked and no reply / recorded - falling back to today's no-claim
 *    sentence on null, exactly as `deliveryLine` already handles a null
 *    `deliveryStatus`.
 *
 * TODO(api): no call QUEUES a consent request against an invitation.
 * `POST /students/{id}/parent-consent-requests` needs a student uuid, and the
 * contract never links an invite to one before it is accepted. So this file
 * can report a request's state once threaded, but still cannot start one.
 */

/** The invite email's outcome, in the admin's language. */
export function deliveryLine(status: InvitationDeliveryStatus | null): string {
  switch (status) {
    case "sent":
      return "We emailed the invite. You can share this link as well.";
    case "email_not_configured":
      return "No email was sent - this school has no mail set up in Nevo, so the link above is the only way in. Share it yourself.";
    case "not_requested":
      return "No email was sent. Share the link above yourself.";
    default:
      // Older invitations predate the field; say only what holds either way.
      return "You can share this link yourself if it doesn't reach them.";
  }
}

/**
 * True ONLY when the backend said it emailed them.
 *
 * The claim sites used to ask `!needsManualDelivery(status)`, which treats
 * "not known to be manual" as delivered - and `deliveryStatus` is nullable in
 * the contract, with `client.ts` casting the JSON unchecked, so an absent field
 * arrives as null or undefined and took the confident arm. The console then
 * said "Invite resent to <name>" and "N invites sent" over a response that
 * established no delivery at all.
 *
 * Delivery is a claim about the outside world. Assert it only when told.
 */
export function confirmedSent(
  status: InvitationDeliveryStatus | null | undefined,
): boolean {
  return status === "sent";
}

/** True when the invite definitely did not reach anyone by email. */
export function needsManualDelivery(
  status: InvitationDeliveryStatus | null | undefined,
): boolean {
  return status === "email_not_configured" || status === "not_requested";
}

/**
 * What is true about the parent after a student invite, with no claim about
 * whether anyone has been contacted.
 *
 * THE SECOND SENTENCE USED TO BLOCK THE CHILD: "{who} can't begin lessons
 * until consent is confirmed". SCRUM-80 says otherwise - the school warrants
 * consent through the DSA and the child proceeds; only a withdrawal stops
 * anything. So this states the school's obligation, which is real, rather than
 * a consequence for the learner, which is not.
 */
export function parentConsentLine(
  parentContact: string,
  studentName: string | null,
): string {
  const who = studentName ?? "this student";
  return `${parentContact} is recorded as the parent contact. Your school still needs to record consent for ${who}, and confirming creates the parent account.`;
}
