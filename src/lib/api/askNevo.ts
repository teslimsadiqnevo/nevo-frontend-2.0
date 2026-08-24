import { api } from "./client";

/**
 * Ask Nevo endpoints (FE Architecture §1; Student B.12) - wired to the live
 * backend (`POST /api/v1/ask-nevo/`, Bearer). The backend owns the assistant
 * and enforces Zero-Tag on every response.
 *
 * Paths carry no trailing slash: Next 308-redirects slashed API routes before
 * the proxy runs; FastAPI's own slash redirect is followed server-side.
 */

const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/**
 * Every context id is typed `format: uuid` on the deployed contract, so a
 * non-UUID value is a 422 that takes the whole answer down with it - and the
 * drawer then falls back to a canned reply that looks exactly like a real
 * one. The console is built on human-readable slugs ("amara-okafor",
 * "jss-2a"), so a value only travels when it genuinely is a UUID.
 *
 * TODO(api): flagged to backend - the console holds no UUID for students or
 * lessons, so that context cannot be sent at all until an endpoint surfaces
 * one. `currentPage` carries the route in the meantime.
 */
export function asUuid(value: string | null | undefined): string | null {
  return value && UUID_RE.test(value) ? value : null;
}

/** Everything the assistant may scope an answer to (all optional). */
export interface AskNevoContextIds {
  studentId?: string | null;
  classId?: string | null;
  lessonId?: string | null;
  segmentId?: string | null;
  /** Conversation continuity across turns in one drawer session. */
  threadId?: string | null;
}

export interface AskNevoRequest {
  role: "student" | "teacher";
  /** The route the question was asked from (context, not tracking). */
  currentPage: string;
  contextIds: AskNevoContextIds;
  question: string;
}

export type AskNevoCategory =
  | "lesson_help"
  | "profile_pattern"
  | "class_planning"
  | "family_message"
  | "flag_review"
  | "general";

export interface AskNevoAnswer {
  answer: string;
  question_category: AskNevoCategory;
  interaction_id: string;
  ai_gateway_call_id: string;
}

export const askNevoApi = {
  ask: (payload: AskNevoRequest) =>
    api.post<AskNevoAnswer>("/api/v1/ask-nevo", payload),

  /** The frame set has no vote control yet (flagged to design); the seam is
   *  ready for it. 204 on success. */
  recordHelpfulness: (interactionId: string, helpful: boolean) =>
    api.post(`/api/v1/ask-nevo/${interactionId}/helpfulness`, { helpful }),
};
