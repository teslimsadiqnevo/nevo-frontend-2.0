import { api } from "./client";

/**
 * The parent action page (D01c, SCRUM-80).
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
 * this page. So the notice never blocks a child - they are already active
 * because the school warranted consent. (SCRUM-80 and D01b disagree on that
 * point; the ticket is the later word and this follows it.)
 */

/**
 * The three rights, exactly as the endpoint spells them.
 *
 * NOT in the spec: `ParentRightRequest.requestType` is declared a bare
 * `string`. The real values came from asking the deployed API with a bad one,
 * which answered with its own pattern:
 *
 *     String should match pattern '^(request_data|object|withdraw_consent)$'
 *
 * Recorded here so nobody has to discover them the same way twice.
 */
export type ParentRightType = "request_data" | "object" | "withdraw_consent";

/** 200 of POST /api/v1/parent/{token}/rights. */
export interface ParentRightReceipt {
  requestId: string;
  status: string;
}

export const parentApi = {
  /**
   * Exercise one right on behalf of the child named by the token.
   *
   * A token the backend does not know answers 404 "Parent link not found",
   * which is the honest end of the road for a link that has been revoked or
   * mistyped - not an error to retry.
   *
   * NO REASON IS SENT WITH AN OBJECTION, and that is not an omission here.
   * `ParentRightRequest` carries `requestType` and nothing else, and the API
   * ACCEPTS AND IGNORES any extra field - I checked, and `reason`, `message`,
   * `details` and `note` all pass validation and go nowhere. A textarea posted
   * into that silence would tell a parent their concern had been recorded when
   * nothing had been. So the page does not offer one until the contract does.
   */
  exerciseRight: (token: string, requestType: ParentRightType) =>
    api.post<ParentRightReceipt>(
      `/api/v1/parent/${encodeURIComponent(token)}/rights`,
      { requestType },
    ),
};
