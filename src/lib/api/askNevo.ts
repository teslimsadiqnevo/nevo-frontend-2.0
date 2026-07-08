import { api } from "./client";

/**
 * Ask Nevo endpoints (FE Architecture §1; Student B.12). Scoped to the current
 * lesson; the backend enforces Zero-Tag on every response.
 *
 * TODO: type the response shape (conversational + cannot-help redirect state).
 */
export const askNevoApi = {
  ask: (payload: { lessonId: string; question: string }) =>
    api.post("/api/ask-nevo", payload),
};
