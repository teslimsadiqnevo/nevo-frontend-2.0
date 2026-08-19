import { api } from "./client";

/**
 * Consent endpoints (NDPA; SCRUM-80 family) - wired to the live backend.
 *
 * The student app uses only `myConsentGate` (frame 14's pending check). The
 * school-confirmation and parent-link endpoints belong to the admin and
 * parent surfaces - typed here so those builds land on a ready seam.
 */

export type ConsentType = "data_processing" | "camera" | "offline_storage";
export type ConsentStatus = "pending" | "confirmed";

/** GET /students/me/consent-gate - the student-facing gate check. */
export interface ConsentGateStatus {
  student_id: string;
  granted: boolean;
  required_type: ConsentType;
  status: ConsentStatus;
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

export interface ParentConsentRequestReceipt {
  invitation_id: string;
  parent_link_id: string;
  student_id: string;
  consent_types: ConsentType[];
  delivery_status: "queued" | "sent" | "failed";
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
  /** The onboarding gate's provisioning check (student session). */
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
