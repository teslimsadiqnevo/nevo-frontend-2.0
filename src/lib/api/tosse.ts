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
 * THE VALUES BELOW ARE SCRUM-117's, AND TWO OF THEM CURRENTLY 422.
 *
 * SCRUM-117 (Jira, not a file in the design repo) specifies the enum
 * verbatim: `founding_partner | schedule_walkthrough | contact_me`, one value
 * per card in the order drawn. These three are correct against the ticket.
 *
 * The DEPLOYED endpoint takes `founding_partner | pilot | learn_more`, which
 * matches the ticket on the first card and nothing else - so cards two and
 * three reject the whole submission and lose the lead they were drawn to
 * capture. The divergence is the endpoint's, not this file's.
 *
 * Backend has offered to rename rather than have the client map around it,
 * and the ticket is the reason to take that offer. Until it lands these stay
 * as SCRUM-117 wrote them.
 *
 * (An earlier revision of this comment claimed SCRUM-117 did not exist. It
 * does; the search behind that claim only covered the design-outputs
 * filesystem, where SCRUM specs appear as derived documents rather than as
 * the tickets themselves.)
 */
export const TOSSE_INTENTS = [
  { value: "founding_partner", label: "I want to become a Founding Partner" },
  { value: "schedule_walkthrough", label: "Schedule a walkthrough for my team" },
  { value: "contact_me", label: "I'm interested, contact me this week" },
] as const;

export type TosseIntent = (typeof TOSSE_INTENTS)[number]["value"];

/**
 * The DEPLOYED request body (backend, 3 Sep), which is what this must match
 * for a lead to land at all.
 *
 * It is not what SCRUM-117 specifies. The ticket gives `school_name` and
 * `student_count` in snake_case, a `{id, status}` receipt, and "All fields
 * required"; the endpoint shipped camelCase, `{id, received}`, and everything
 * bar name and school optional. Four divergences, none of them raised as a
 * change to the ticket - recorded here so the next person reading the ticket
 * does not assume this file drifted from it.
 *
 * Optionality is the one to keep: a partial form still captures the lead,
 * which at a booth beats a complete one that never got sent. The FORM is
 * still stricter than the API, and relaxing it is a design call.
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
