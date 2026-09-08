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
