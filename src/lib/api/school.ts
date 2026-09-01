import { api } from "./client";

/**
 * The school record, and the sign-up that creates one (D1 · SCRUM-39).
 *
 * ============================================================================
 * THREE ONBOARDING DECISIONS HAVE NO FIELD OF THEIR OWN, AND LIVE IN `profile`.
 *
 * SCRUM-39 asks for `PATCH school.auth_method`, `PATCH school.band`, and a
 * DPA acceptance carrying `{school_id, admin_id, dpa_version, accepted_at}`.
 * None of the three exists: `PATCH /api/v1/school` accepts only
 * `{name, profile, academicConfig, retentionPolicy}`, and `profile` is an
 * untyped `object`.
 *
 * They are therefore written into `profile` under the `onboarding` key, with
 * the shape below. THIS IS A PROVISIONAL CONTRACT, invented here because the
 * alternative was losing the answers, and it needs backend to ratify or
 * replace it. Two consequences worth knowing:
 *
 *   - nothing validates these keys, so a typo is silent. They are written
 *     through `ONBOARDING_PROFILE_KEY` and this interface, never inline.
 *   - the DPA acceptance is a COMPLIANCE RECORD. An untyped blob is not where
 *     a signed agreement should live, and D22's NDPA surface will eventually
 *     need to read the accepted version from somewhere trustworthy. This is
 *     the most important of the three to give a real home.
 * ============================================================================
 */

export const ONBOARDING_PROFILE_KEY = "onboarding" as const;

/** Set once at D1.2 and irreversible in v1. */
export type SchoolAuthMethod = "microsoft" | "google" | "manual";

/**
 * The single band taxonomy (SCRUM-39 D1.4). These exact names are used in
 * onboarding, in SCRUM-98 billing and in contract conversations; the older
 * Specialised-Small / Mid-Sized Premium / Mega-Campus shorthand is retired and
 * must not appear in any payload, enum or label.
 */
export type EnrolmentBand = "boutique" | "mid_market" | "premium" | "enterprise";

export interface OnboardingProfile {
  authMethod?: SchoolAuthMethod;
  band?: EnrolmentBand;
  /** The version accepted, never assumed - D12 and D22 read this later. */
  dpaVersion?: string;
  /** ISO timestamp of acceptance. */
  dpaAcceptedAt?: string;
  /** Whether the wizard ran to the end, so a resumed session knows. */
  completedAt?: string;
}

export interface School {
  id: string;
  name: string;
  /** The join code manual schools hand out. Null for SSO schools. */
  code: string | null;
  slug: string | null;
  profile: Record<string, unknown>;
  academicConfig: Record<string, unknown>;
  retentionPolicy: string;
  retentionDays: number;
}

/** Read our provisional block back off a school record. */
export function readOnboarding(school: School): OnboardingProfile {
  const raw = school.profile?.[ONBOARDING_PROFILE_KEY];
  return raw && typeof raw === "object" ? (raw as OnboardingProfile) : {};
}

export const schoolApi = {
  /**
   * Create the school and its founding admin. PUBLIC - this is the one call in
   * the admin surface made before any session exists.
   *
   * TODO(api): the schema declares a 201 with NO PROPERTIES. SCRUM-39 expects
   * `school_id`, `admin_id` and a session back, and the wizard needs at least
   * a session to write the later steps. Until the response carries one, the
   * wizard signs in with the credentials just submitted - which works, but is
   * a second round trip that a returned session would remove.
   */
  register: (payload: {
    schoolName: string;
    adminName: string;
    email: string;
    password: string;
  }) => api.post<void>("/api/v1/schools/register", payload),

  get: () => api.get<School>("/api/v1/school"),

  update: (payload: {
    name?: string | null;
    profile?: Record<string, unknown> | null;
    academicConfig?: Record<string, unknown> | null;
    retentionPolicy?: string | null;
  }) => api.patch<School>("/api/v1/school", payload),

  /**
   * Merge a patch into the onboarding block without clobbering the rest of
   * `profile`. Read-modify-write, because the endpoint replaces `profile`
   * wholesale rather than merging it.
   */
  saveOnboarding: async (patch: OnboardingProfile) => {
    const school = await schoolApi.get();
    const next = { ...readOnboarding(school), ...patch };
    return schoolApi.update({
      profile: { ...school.profile, [ONBOARDING_PROFILE_KEY]: next },
    });
  },

  /** Where the provider consent screen lives, for the SSO handover. */
  ssoStart: (schoolSlug: string, provider: string) =>
    api.get<{ authorization_url: string; school_entry_url: string }>(
      `/api/v1/schools/${schoolSlug}/sso/${provider}/start`,
    ),
};
