import { api } from "./client";

/**
 * Landing-page lead capture (SCRUM-43 / SCRUM-82). Submitting the form
 * generates a lead for founder-led follow-up - it never creates an account.
 */
export interface LeadSubmission {
  name: string;
  school: string;
  /** Decision-maker role (School Owner, Proprietor, SENCo, ...). */
  role: string;
  /** Email or phone - whichever the school prefers. */
  contact: string;
  /** Optional "what made you curious" note. */
  message?: string;
}

export const leadsApi = {
  submit: (lead: LeadSubmission) => api.post("/api/leads", lead),
};
