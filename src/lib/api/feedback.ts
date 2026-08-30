import { api } from "./client";

/**
 * Product feedback from inside the console.
 *
 * The request is typed - `type`, `note`, and an optional `context` - while the
 * 201 is a free-form string map, one of the seven endpoints still returning an
 * untyped ack. Nothing here reads the response body: a 201 means it was
 * stored, which is the whole contract this screen needs.
 *
 * `type` has no enum. `GET /api/v1/ops/feedback`, the read side, carries the
 * same field as a bare string, so the two values the teacher panel sends are
 * ours to define and should stay stable for whoever triages them.
 *
 * `context` is where the teacher was standing when they wrote it. Ops asking
 * "which screen was this about" is the first question feedback raises, and the
 * route answers it for free.
 */

export type FeedbackType = "feedback" | "feature";

export const feedbackApi = {
  submit: (payload: { type: FeedbackType; note: string; context?: string }) =>
    api.post<Record<string, string>>("/api/v1/feedback", payload),
};
