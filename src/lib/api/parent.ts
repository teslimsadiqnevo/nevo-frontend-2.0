import { api } from "./client";
import type { ConsentStatus, ConsentType } from "./consents";

/**
 * The parent action pages (D01b consent, D01c data management; SCRUM-80).
 *
 * PUBLIC and TOKENISED. A parent never signs in: the link arrives in the
 * notice email that fires when their child completes signup, and the token
 * identifies one parent/child pair. That is deliberate - requiring an account
 * to exercise a data right would put a login between a parent and a statutory
 * entitlement.
 *
 * WHY THIS EXISTS AT ALL. Section 31 of the NDPA 2023 requires that a parent
 * has a direct route to review, object and withdraw. SCRUM-80 records legal
 * review confirming it must be in place before launch, so this is a condition
 * of shipping rather than a feature.
 *
 * The school collects consent through its own process and warrants it in the
 * Data Sharing Agreement; Nevo sends an informational notice and provides
 * these pages. Design ruled on 7 Sep that the notice never blocks a child.
 */

/**
 * The three rights, from the deployed `ParentRightType` enum.
 *
 * These used to be undiscoverable - `requestType` was a bare `string` and the
 * only way to learn the values was to send a bad one and read the rejection.
 * The schema enumerates them now, so this union is checkable rather than
 * remembered.
 */
export type ParentRightType = "request_data" | "object" | "withdraw_consent";

/**
 * What a parent must be told before they can consent informedly
 * (`ParentConsentInvitationResponse`). Every field is required by the schema;
 * the nullable ones are nullable in themselves, not optional.
 */
export interface ParentInvitation {
  invitationId: string;
  /** The child's first name. D01c is written throughout in this name. */
  studentFirstName: string;
  schoolName: string;
  /**
   * BOTH ARE NULL FOR MOST SCHOOLS TODAY. They come from the school's billing
   * contact, which is the only structured school contact stored, and most
   * schools have not filled it in. Anything that offers "contact your school"
   * needs a fallback rather than a blank or a dead link.
   */
  schoolPhone: string | null;
  schoolEmail: string | null;
  parentName: string;
  status: ConsentStatus;
  /**
   * What THIS invitation asks for. `ConsentType` has three members, but the
   * invitation path only ever requests `data_processing` today - camera and
   * offline storage are modelled and never asked for. So D01b's single "Yes"
   * grants exactly what is in here, which is currently one thing.
   */
  consentTypes: ConsentType[];
  expiresAt: string;
  /** When the parent decided, null while they have not. */
  decidedAt: string | null;
}

/**
 * 200 of POST /api/v1/consents/parent/complete — the moment consent is given.
 *
 * `confirmed_types` is what was ACTUALLY recorded, which need not be every type
 * the invitation asked for. Snake_case here and camelCase on the invitation
 * read: the two endpoints disagree and the wire is the wire.
 */
export interface ParentConsentCompletion {
  invitation_id: string;
  parent_link_id: string;
  parent_id: string;
  student_id: string;
  confirmed_types: ConsentType[];
  completed_at: string;
  /**
   * Where a copy of the decision was actually sent, or null if none was.
   *
   * The frame ends with "a copy has been sent to your phone". For a while
   * nothing sent one, so the line was withheld rather than promise a receipt
   * that did not exist. Completion queues one now, and this field is what makes
   * the line safe to render: it says whether there IS a copy, and by which
   * route, so the screen never guesses.
   */
  receipt_sent_to: ParentContactMethod | null;
}

/** How a receipt actually reached the parent. */
export type ParentContactMethod = "email" | "sms";

/**
 * The `code` out of `{detail: {code, message}}`, or null if the body is not
 * that shape.
 *
 * A named function rather than inline narrowing because two different 409s
 * come back from account creation and they mean opposite things to a parent:
 * one says "you already did this", the other says "we cannot do this for a
 * phone number". Collapsing them into a single "conflict" would tell an
 * SMS-only parent to go and find a password they never set.
 *
 * `ApiError.detail` is the whole parsed body, so the code sits one level in.
 * Same shape `tosseErrorMessage` narrows.
 */
export function apiErrorCode(detail: unknown): string | null {
  if (!detail || typeof detail !== "object") return null;
  const inner = (detail as { detail?: unknown }).detail;
  if (!inner || typeof inner !== "object") return null;
  const code = (inner as { code?: unknown }).code;
  return typeof code === "string" && code ? code : null;
}

/** 201 of POST /api/v1/consents/parent/{token}/account. */
export interface ParentAccount {
  userId: string;
  /** The address or number the account is keyed to. */
  contact: string;
  contactMethod: ParentContactMethod;
  studentId: string;
  session: {
    access_token: string;
    token_type: string;
    expires_at: string;
    user_id: string;
    role: string;
    replaced_session: boolean;
  };
}

/** One child a signed-in parent is linked to. */
export interface ParentChild {
  studentId: string;
  firstName: string | null;
  lastName: string | null;
  status: string;
  schoolId: string;
  schoolName: string;
}

/** The four dimensions, in the frame's order. */
export type GrowthDimension =
  | "staying_with_hard_problems"
  | "knowing_what_she_knows"
  | "connecting_ideas"
  | "learning_new_things_faster";

/**
 * `not_enough_yet` is the one that matters. Below five sessions there is no
 * period to describe, and the backend says so plainly rather than softening it.
 * A parent told their child is growing on four lessons of evidence has been
 * misled, however kindly - so this state is RENDERED, never hidden.
 */
export type GrowthTrend = "growing" | "steady" | "emerging" | "not_enough_yet";

export interface GrowthStatement {
  dimension: GrowthDimension;
  trend: GrowthTrend;
  /**
   * Written in advance and selected by evidence - no model, no interpolation.
   * The backend has a test that fails if a statement contains a digit, which is
   * the same rule this screen is built around: a parent is never shown a number.
   */
  statement: string;
}

/**
 * D15d's whole payload.
 *
 * THE DATES ARE LOAD-BEARING. There are no term dates anywhere in the roster,
 * so the window is a fixed 90 days against the preceding 90. A page saying
 * "than last term" would be claiming something the backend cannot support -
 * hence both ranges are sent, and this screen says what was actually compared.
 */
export interface GrowthNarrative {
  studentId: string;
  studentFirstName: string;
  headline: string;
  summary: string;
  statements: GrowthStatement[];
  periodStart: string;
  periodEnd: string;
  comparisonStart: string;
  comparisonEnd: string;
  generatedAt: string;
  source?: string;
}

/** 202 of POST /api/v1/parent/{token}/rights. */
export interface ParentRightReceipt {
  requestId: string;
  requestType: ParentRightType;
  status: string;
  /**
   * Whether the reason was actually stored. The endpoint used to accept and
   * silently drop extra fields, so this flag is the contract's own answer to
   * "did my words go anywhere" - surface a hedge if it comes back false with a
   * reason attached, rather than promising it was recorded.
   */
  reasonRecorded: boolean;
}

export const parentApi = {
  /**
   * Resolve the token to the child, the school and the current decision.
   *
   * 404 for unknown, revoked or expired. An ALREADY-DECIDED link still
   * resolves, which is the point: a parent who withdrew gets
   * `status: "withdrawn"` and a `decidedAt` instead of being offered the
   * withdrawal actions a second time.
   */
  getInvitation: (token: string) =>
    api.get<ParentInvitation>(
      `/api/v1/consents/parent/${encodeURIComponent(token)}`,
    ),

  /**
   * Give consent (D01b). The token is the whole request — there is nothing to
   * choose, because design ruled one blanket consent and one tap, and the
   * invitation already carries which `consentTypes` it covers.
   *
   * This is the call that creates the parent account and flips the school's
   * roster row to Confirmed, so it is the single consequential action on that
   * screen. Unauthenticated, like everything else a parent touches.
   */
  completeConsent: (token: string) =>
    api.post<ParentConsentCompletion>("/api/v1/consents/parent/complete", {
      token,
    }),

  /**
   * Turn the parent record consent already created into an account they can
   * sign in with (D01b's "Set up my parent account").
   *
   * The TOKEN is the authorisation - it went to that parent, for that child -
   * so this is unauthenticated like everything else a parent touches, and the
   * response carries a session so they are signed in without a second step.
   *
   * 404 for an unknown, expired or already-used link. 409 if the account is
   * already active: a live credential is not reset from a link that might be
   * sitting in an old message. 409 `parent_contact_not_email` for a parent
   * whose consent went by SMS, because password login is email-only - see
   * `ParentConsent` for how that is surfaced.
   */
  createAccount: (token: string, password: string) =>
    api.post<ParentAccount>(
      `/api/v1/consents/parent/${encodeURIComponent(token)}/account`,
      { password },
    ),

  /** The signed-in parent's own children. 403 for any non-parent role. */
  myChildren: () => api.get<ParentChild[]>("/api/v1/parents/me/children"),

  /** D15d. One child's growth narrative, for a signed-in parent. */
  childGrowth: (studentId: string) =>
    api.get<GrowthNarrative>(
      `/api/v1/parents/me/children/${encodeURIComponent(studentId)}/growth`,
    ),

  /**
   * Exercise one right on behalf of the child named by the token.
   *
   * `reason` is persisted now (up to 2000 chars) and the response confirms it
   * with `reasonRecorded`. It previously did not exist: the endpoint accepted
   * any extra field and dropped it, so the page deliberately offered no
   * textarea rather than posting a parent's concern into silence.
   */
  exerciseRight: (
    token: string,
    requestType: ParentRightType,
    reason?: string,
  ) =>
    api.post<ParentRightReceipt>(
      `/api/v1/parent/${encodeURIComponent(token)}/rights`,
      reason?.trim() ? { requestType, reason: reason.trim() } : { requestType },
    ),
};
