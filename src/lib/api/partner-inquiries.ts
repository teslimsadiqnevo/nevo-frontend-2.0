import { api } from "./client";

/**
 * Landing-page partner inquiry (SCRUM-43 / SCRUM-82) - the "Request an
 * introduction" form. Submitting generates an inquiry for founder-led
 * follow-up; it never creates an account.
 *
 * Wired to the live backend via the same-origin proxy route
 * (`app/api/partner-inquiries` -> backend `POST /api/v1/partner-inquiries`).
 * The proxy exists because the backend exposes no CORS headers; a browser
 * cannot call it cross-origin (preflight 405s). Server-side forwarding also
 * absorbs the Render cold start without a browser CORS failure.
 */
const SAME_ORIGIN =
  typeof window !== "undefined" ? window.location.origin : "http://localhost:3000";

/** Backend role enum (PartnerInquiryRole), keyed by the form's display labels. */
export const INQUIRY_ROLES = {
  "School Owner": "school_owner",
  Proprietor: "proprietor",
  SENCo: "senco",
  "Head of Learning": "head_of_learning",
  "Head Teacher": "head_teacher",
  Other: "other",
} as const;

export type InquiryRoleLabel = keyof typeof INQUIRY_ROLES;
export type InquiryRole = (typeof INQUIRY_ROLES)[InquiryRoleLabel];

/** Request body per the backend's PartnerInquiryRequest schema. */
export interface PartnerInquiry {
  full_name: string;
  school_name: string;
  role: InquiryRole;
  contact: string;
  message?: string | null;
}

/** 201 response per PartnerInquiryResponse. */
export interface PartnerInquiryReceipt {
  id: string;
  full_name: string;
  school_name: string;
  role: InquiryRole;
  contact: string;
  contact_method: string;
  message: string | null;
  created_at: string;
}

export const partnerInquiriesApi = {
  submit: (inquiry: PartnerInquiry) =>
    api.post<PartnerInquiryReceipt>("/api/partner-inquiries", inquiry, {
      baseUrl: SAME_ORIGIN,
      credentials: "same-origin",
    }),
};
