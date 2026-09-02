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
 * The three intent cards. `label` is the frame's copy, which is fixed - it is
 * the wording schools read at the booth.
 *
 * THE VALUES BELOW ARE NOT AGREED AND TWO OF THEM WILL 422.
 *
 * This file used to cite "the SCRUM-117 enum". There is no SCRUM-117: it does
 * not exist anywhere in the design set or its history, and the specs stop at
 * 105. The only TOSSE artifact is a landing frame that stores the choice as a
 * bare array index and names no values at all, so these three slugs were
 * invented here and attributed to a spec that was never written.
 *
 * The live endpoint takes `founding_partner | pilot | learn_more`. Only the
 * first matches, and anything else rejects the WHOLE submission - so two of
 * the three cards currently lose the lead they were drawn to capture.
 *
 * Backend has offered to rename the enum to whatever the cards mean rather
 * than have the client map around it. Until that lands these stay as they
 * are, because guessing which of `pilot` and `learn_more` a walkthrough is
 * would be inventing the contract a second time.
 */
export const TOSSE_INTENTS = [
  { value: "founding_partner", label: "I want to become a Founding Partner" },
  { value: "schedule_walkthrough", label: "Schedule a walkthrough for my team" },
  { value: "contact_me", label: "I'm interested, contact me this week" },
] as const;

export type TosseIntent = (typeof TOSSE_INTENTS)[number]["value"];

/**
 * The live request body (backend, 3 Sep). camelCase, like the rest of the
 * product API - this posted `school_name` and `student_count`, which the
 * endpoint does not know.
 *
 * Only `name` and `schoolName` are required server-side: a partial form still
 * captures the lead, which at a booth is worth more than a complete one that
 * never got sent. The FORM is stricter than the API for now - see the note on
 * `complete` in TosseInterestPage - and relaxing it is a design call.
 */
export interface TosseInterest {
  name: string;
  schoolName: string;
  role?: string;
  studentCount?: number;
  phone?: string;
  email?: string;
  intent?: TosseIntent;
}

/** 201: `{ id, received: true }`. */
export interface TosseInterestReceipt {
  id: string;
  received: boolean;
}

/**
 * The endpoint's error body: `{ detail: { code, message } }`, where `message`
 * is written to be shown to a headteacher. `ApiError.detail` carries it
 * through untouched, so this narrows it rather than throwing it away - a 422
 * used to render "check your connection", which describes none of the things
 * that actually go wrong.
 */
export function tosseErrorMessage(detail: unknown): string | null {
  if (!detail || typeof detail !== "object") return null;
  const inner = (detail as { detail?: unknown }).detail;
  if (!inner || typeof inner !== "object") return null;
  const message = (inner as { message?: unknown }).message;
  return typeof message === "string" && message.trim() ? message.trim() : null;
}

export const tosseApi = {
  submit: (interest: TosseInterest) =>
    api.post<TosseInterestReceipt>("/api/tosse/interest", interest, {
      baseUrl: SAME_ORIGIN,
      credentials: "same-origin",
    }),
};
