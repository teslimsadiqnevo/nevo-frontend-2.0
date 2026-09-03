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
export type TosseRoleValue =
  | "school_owner"
  | "proprietor"
  | "senco"
  | "head_of_learning"
  | "head_teacher"
  | "teacher"
  | "parent"
  | "other";

/**
 * SCRUM-117's five dropdown options, each carrying the value the endpoint
 * will actually accept.
 *
 * The LABEL is the ticket's, verbatim, and is what a headteacher reads. The
 * VALUE is `PartnerInquiryRole` - an enum the TOSSE endpoint borrows from the
 * partner-inquiry surface, which is the root of the mismatch: it was built for
 * a different audience, so it carries `senco`, `head_of_learning` and
 * `head_teacher` that this form never asks about, and has no `teacher` or
 * `parent` that this form does.
 *
 * This file used to put the LABEL on the wire. `role` is a required enum, so
 * every submission was rejected before anything else was even read - a booth
 * capturing nothing at all. Confirmed against the deployed API, 3 Sep:
 *
 *   422 "Input should be 'school_owner', 'proprietor', 'senco',
 *        'head_of_learning', 'head_teacher' or 'other'"
 *
 * Teacher and Parent used to collapse to `other` with the real answer smuggled
 * through `message`, because the enum had nothing else for them. Backend added
 * `teacher` and `parent` on 3 Sep, so every option now maps to a value that
 * means what it says and the workaround is gone.
 *
 * Two labels still map to a choice rather than an equivalent: the enum offers
 * both `school_owner` and `proprietor` for one dropdown row, and both
 * `head_of_learning` and `head_teacher` for another. The nearest term wins;
 * nothing downstream distinguishes them today.
 */
export const TOSSE_ROLES = [
  { value: "proprietor", label: "School Proprietor / Owner" },
  { value: "head_teacher", label: "Academic Director / Head of School" },
  { value: "teacher", label: "Teacher" },
  { value: "parent", label: "Parent" },
  { value: "other", label: "Other" },
] as const satisfies readonly { value: TosseRoleValue; label: string }[];

export type TosseRoleLabel = (typeof TOSSE_ROLES)[number]["label"];
export type TosseRole = TosseRoleValue;

/**
 * Kept as the seam for anything the enum genuinely cannot express. Nothing
 * collapses today, so it always returns null - the `message` field goes out
 * empty rather than carrying a note restating a role the value already says.
 */
export function roleNote(_label: TosseRoleLabel): string | null {
  return null;
}

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
 * On optionality specifically, backend's message and the deployed API
 * disagree: the message said everything bar name and schoolName was optional,
 * while `TosseInterestRequest.required` on the live spec lists all seven.
 * The spec wins - it is what rejects the request - so all seven are required
 * here, which also matches SCRUM-117.
 */
export interface TosseInterest {
  name: string;
  schoolName: string;
  role: TosseRoleValue;
  studentCount: number;
  phone: string;
  email: string;
  intent: TosseIntent;
  /** Optional. Carries the role the enum cannot express - see `roleNote`. */
  message?: string | null;
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
