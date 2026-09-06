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
 *    request had been sent to the parent. Nothing supported that.
 *    `InvitationResponse` carries no consent field; consent has its own
 *    endpoint (`POST /students/{id}/parent-consent-requests`) with its own
 *    `ConsentDeliveryStatus`, and `consentsApi.requestParentConsent` is typed
 *    in this repo with NO CALLER anywhere. The claim was produced from the
 *    parent contact the admin had just typed.
 *
 *    It cannot simply be wired up here either: consent is requested against a
 *    STUDENT id, and an invitation has no student behind it until it is
 *    accepted. So this file states what is actually known - the contact is
 *    recorded, and the child cannot begin lessons until consent is confirmed -
 *    and promises no delivery in either direction.
 *
 * TODO(api): report the consent request's own state on the invitation, or give
 * us a call that queues one for an invited (not yet accepted) student. Until
 * one of those exists, no screen can honestly tell an admin a parent has been
 * contacted.
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

/** True when the invite definitely did not reach anyone by email. */
export function needsManualDelivery(
  status: InvitationDeliveryStatus | null,
): boolean {
  return status === "email_not_configured" || status === "not_requested";
}

/**
 * What is true about the parent after a student invite, with no claim about
 * whether anyone has been contacted.
 */
export function parentConsentLine(
  parentContact: string,
  studentName: string | null,
): string {
  const who = studentName ?? "They";
  return `${parentContact} is recorded as the parent contact. ${who} can't begin lessons until consent is confirmed, and confirming creates the parent account.`;
}
