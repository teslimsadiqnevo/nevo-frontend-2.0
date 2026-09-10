"use client";

import { useCallback, useState } from "react";
import { consentsApi, type ConsentDeliveryStatus } from "@/lib/api/consents";
import { studentsApi } from "@/lib/api/students";

/**
 * Sending a parent the consent request - the trigger nothing in Nevo had.
 *
 * ============================================================================
 * `consentsApi.requestParentConsent` was typed with ZERO CALLERS, and the whole
 * parent surface sat behind it: three finished, merged screens that no family
 * could reach, because nothing in the product could send anyone a link. D07's
 * row action, D07b's card action and the Overview checklist's dead row all
 * pointed at this one call.
 * ============================================================================
 *
 * THE PARENT'S DETAILS COME FROM THE RECORD, NOT A FORM. `POST
 * /students/{id}/parent-consent-requests` needs `{parent_name, parent_contact,
 * contact_method}`, and `ParentLink` carries all three - so the admin presses
 * one thing, as D07 draws it ("Sending a request is deliberate and
 * per-student"), rather than retyping a contact the school already gave us.
 * The roster row does not carry the link, so it is fetched on the press.
 *
 * A STUDENT WITH NO CONTACT IS NOT AN ERROR. It is the ordinary state of a
 * child enrolled before anyone recorded a guardian, and it gets its own
 * outcome rather than a failure - "never a dead end", and no red.
 *
 * THE RECEIPT IS READ, NOT ASSUMED. The endpoint answers 202 with a
 * `delivery_status` of `queued | processing | sent | failed`, and only `sent`
 * means a parent was actually written to. This is the same defect the invite
 * surfaces carried until 8 Sep - "N invites sent" over a response that said
 * nobody was emailed - and it is not being repeated here.
 */

export type ConsentRequestState =
  | { kind: "idle" }
  | { kind: "sending" }
  /** The backend took it. `delivery` says whether it actually went out. */
  | { kind: "done"; parentName: string; delivery: ConsentDeliveryStatus }
  /** No guardian contact on the record, so there is nobody to send to. */
  | { kind: "noContact" }
  | { kind: "failed" };

const IDLE: ConsentRequestState = { kind: "idle" };

/**
 * `ParentLink.contact_method` is a bare `string` on our side while the endpoint
 * takes the `email | sms` enum, so an unrecognised value is decided by the
 * contact itself rather than passed through and 422'd.
 */
function methodFor(link: { contact_method: string; parent_contact: string }) {
  const declared = link.contact_method?.toLowerCase();
  if (declared === "email" || declared === "sms") return declared;
  return link.parent_contact.includes("@") ? "email" : "sms";
}

export function useConsentRequests() {
  const [byStudent, setByStudent] = useState<
    Record<string, ConsentRequestState>
  >({});

  const stateFor = useCallback(
    (studentId: string): ConsentRequestState => byStudent[studentId] ?? IDLE,
    [byStudent],
  );

  const set = useCallback((studentId: string, next: ConsentRequestState) => {
    setByStudent((prev) => ({ ...prev, [studentId]: next }));
  }, []);

  const send = useCallback(
    (studentId: string) => {
      set(studentId, { kind: "sending" });
      studentsApi
        .parentLinks(studentId)
        .then((links) => {
          const link = links.find((l) => l.parent_contact && l.parent_name);
          if (!link) {
            set(studentId, { kind: "noContact" });
            return;
          }
          return consentsApi
            .requestParentConsent(studentId, {
              parent_name: link.parent_name,
              parent_contact: link.parent_contact,
              contact_method: methodFor(link),
            })
            .then((receipt) =>
              set(studentId, {
                kind: "done",
                parentName: link.parent_name,
                delivery: receipt.delivery_status,
              }),
            );
        })
        // One catch for both round trips is deliberate here, unlike the
        // onboarding case: neither of them writes anything on the way to the
        // POST, so a failure at either point means no request was created.
        .catch(() => set(studentId, { kind: "failed" }));
    },
    [set],
  );

  return { stateFor, send };
}

/** What to tell the admin, in the frame's own voice. Never red, never alarm. */
export function consentRequestLine(
  state: ConsentRequestState,
  studentName: string,
): string | null {
  switch (state.kind) {
    case "sending":
      return "Sending…";
    case "done":
      return state.delivery === "sent"
        ? `Consent request sent to ${state.parentName}.`
        : state.delivery === "failed"
          ? `We couldn’t get that to ${state.parentName}. Their contact details may need checking.`
          : // queued | processing - taken, not yet delivered. Saying "sent"
            // here would be the invite defect again.
            `Consent request queued for ${state.parentName}. It goes out shortly.`;
    case "noContact":
      return `There’s no parent contact on ${studentName}’s record yet, so there’s nobody to send this to.`;
    case "failed":
      return "That didn’t send, and nothing has changed. Try again in a moment.";
    default:
      return null;
  }
}
