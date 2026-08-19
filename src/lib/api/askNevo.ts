import { api } from "./client";

/**
 * Ask Nevo endpoints (FE Architecture §1; Student B.12) - wired to the live
 * backend (`POST /api/v1/ask-nevo/`, Bearer). The backend owns the assistant
 * and enforces Zero-Tag on every response.
 *
 * Paths carry no trailing slash: Next 308-redirects slashed API routes before
 * the proxy runs; FastAPI's own slash redirect is followed server-side.
 */

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
