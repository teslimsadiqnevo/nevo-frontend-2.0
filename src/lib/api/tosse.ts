import { api } from "./client";

/**
 * TOSSE Founding Partner interest capture (SCRUM-117).
 *
 * The event landing page at `/tosse` is scanned from a QR code at the booth;
 * submitting posts a founding-partner lead. It never creates an account.
 *
 * Posted through the same-origin proxy (`app/api/tosse/interest` -> backend
 * `POST /api/tosse/interest`) for the same reason every other client here
 * proxies: the backend exposes no CORS headers, so a browser cannot call it
 * cross-origin - the preflight 405s. Server-side forwarding also absorbs the
 * Render cold start without surfacing as a CORS failure.
 */
const SAME_ORIGIN =
  typeof window !== "undefined" ? window.location.origin : "http://localhost:3000";

/**
 * Role options, in the order SCRUM-117 lists them. The spec types `role` as a
 * bare string (unlike `intent`, which it gives as an enum), so the display
 * label is what goes on the wire.
 */
export const TOSSE_ROLES = [
  "School Proprietor / Owner",
  "Academic Director / Head of School",
  "Teacher",
  "Parent",
  "Other",
] as const;

export type TosseRole = (typeof TOSSE_ROLES)[number];

/**
 * The three intent cards. `value` is the SCRUM-117 enum; `label` is the frame's
 * copy, which is fixed - it is the wording schools read at the booth.
 */
export const TOSSE_INTENTS = [
  { value: "founding_partner", label: "I want to become a Founding Partner" },
  { value: "schedule_walkthrough", label: "Schedule a walkthrough for my team" },
  { value: "contact_me", label: "I'm interested, contact me this week" },
] as const;

export type TosseIntent = (typeof TOSSE_INTENTS)[number]["value"];

/** Request body per the SCRUM-117 contract. Every field is required. */
export interface TosseInterest {
  name: string;
  role: string;
  school_name: string;
  student_count: number;
  phone: string;
  email: string;
  intent: TosseIntent;
}

/** 201 response per SCRUM-117: `{ id, status }`. */
export interface TosseInterestReceipt {
  id: string;
  status: string;
}

export const tosseApi = {
  submit: (interest: TosseInterest) =>
    api.post<TosseInterestReceipt>("/api/tosse/interest", interest, {
      baseUrl: SAME_ORIGIN,
      credentials: "same-origin",
    }),
};
