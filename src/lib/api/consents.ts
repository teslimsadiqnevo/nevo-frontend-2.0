import { api } from "./client";

/**
 * Consent endpoints (NDPA; SCRUM-80 family) - wired to the live backend.
 *
 * NEVO IS NOT THE CONSENT GATE. Design ruled on SCRUM-80 (7 Sep): the school
 * warrants consent through the DSA, so `granted: false` means the school has
 * not recorded it yet - an administrative task of theirs, not a blocker for
 * the child. The child proceeds normally.
 *
 * The ONE exception is withdrawal. If a parent explicitly withdraws, that
 * child's data must stop being processed. So `granted` is not the field that
 * matters here - `status` is, and the two must not be conflated:
 *
 *   not_sent   granted:false   school has not asked yet      -> proceed
 *   pending    granted:false   asked, parent has not replied -> proceed
 *   confirmed  granted:true    parent granted                -> proceed
 *   withdrawn  granted:false   parent actively withdrew      -> STOP
 *
 * Three of those four are `granted: false`, which is exactly why reading
 * `granted` alone cannot implement the ruling. Read `status`.
 */

export type ConsentType = "data_processing" | "camera" | "offline_storage";

/**
 * All four values the deployed `ConsentStatus` schema carries.
 *
 * This was previously declared as `"pending" | "confirmed"` - two of the four -
 * which made `status === "withdrawn"` a TYPE ERROR and the withdrawal rule
 * literally inexpressible. Checked against the deployed OpenAPI document 7 Sep.
 */
export type ConsentStatus = "not_sent" | "pending" | "confirmed" | "withdrawn";

/**
 * GET /students/me/consent-gate.
 *
 * Named for the endpoint, not for a gate we implement - see the header. Kept
 * wired because withdrawal enforcement needs exactly this read; see
 * `processingWithdrawn`.
 */
export interface ConsentGateStatus {
  student_id: string;
  granted: boolean;
  required_type: ConsentType;
  status: ConsentStatus;
}

/**
 * The only consent question the frontend is entitled to act on.
 *
 * Deliberately a named function rather than an inline `=== "withdrawn"`: it is
 * the single place the ruling is encoded, so a future status value (or a
 * change of mind about `not_sent`) is one edit, and every caller is greppable.
 */
export function processingWithdrawn(
  gate: Pick<ConsentGateStatus, "status"> | null | undefined,
): boolean {
  return gate?.status === "withdrawn";
}

export interface ConsentConfirmation {
  id: string;
  student_id: string;
  consent_type: ConsentType;
  status: ConsentStatus;
  confirmation_source: "school" | "parent" | null;
  confirmed_via: "written" | "verbal" | "email" | "digital" | null;
  confirmed_at: string | null;
}

/**
 * `ConsentDeliveryStatus` is `queued | processing | sent | failed`.
 *
 * This was narrowed to three - `processing` was missing - so a real value
 * would have fallen through every branch that switched on it. The response
 * SHAPE check in `scripts/contract-check.mjs` compares property names, not
 * enum members, so it cannot see this class; it was caught by reading the
 * document.
 */
export type ConsentDeliveryStatus =
  | "queued"
  | "processing"
  | "sent"
  | "failed";

export interface ParentConsentRequestReceipt {
  invitation_id: string;
  parent_link_id: string;
  student_id: string;
  consent_types: ConsentType[];
  delivery_status: ConsentDeliveryStatus;
  expires_at: string;
}

export interface ParentLink {
  id: string;
  school_id: string;
  student_id: string;
  parent_id: string | null;
  parent_name: string;
  parent_contact: string;
  contact_method: "email" | "sms";
  account_created: boolean;
}

export const consentsApi = {
  /**
   * The student's own consent record. NOT an onboarding gate - onboarding no
   * longer calls this, because under the ruling it has nothing to decide.
   * Read it where withdrawal has to be honoured.
   */
  myConsentGate: () =>
    api.get<ConsentGateStatus>("/api/v1/students/me/consent-gate"),

  /** Admin surface: record school-collected consent (DSA warranty). */
  confirmBySchool: (payload: {
    student_id: string;
    consent_types: ConsentType[];
    confirmed_via: "written" | "verbal" | "email" | "digital";
  }) =>
    api.post<ConsentConfirmation[]>(
      "/api/v1/consents/school-confirmations",
      payload,
    ),

  /** Admin surface: send a parent the consent request (SCRUM-80). */
  requestParentConsent: (
    studentId: string,
    payload: {
      parent_name: string;
      parent_contact: string;
      contact_method: "email" | "sms";
      consent_types?: ConsentType[];
    },
  ) =>
    api.post<ParentConsentRequestReceipt>(
      `/api/v1/students/${studentId}/parent-consent-requests`,
      payload,
    ),

  /** Parent action page (public, tokenised link - no session). */
  completeParentConsent: (token: string) =>
    api.post("/api/v1/consents/parent/complete", { token }),

  /** Admin surface: a student's parent/guardian links. */
  listParentLinks: (studentId: string) =>
    api.get<ParentLink[]>(`/api/v1/students/${studentId}/parent-links`),
};
