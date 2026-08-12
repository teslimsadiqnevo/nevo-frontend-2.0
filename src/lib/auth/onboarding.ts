/**
 * Onboarding draft state - the identity the student gives us across the
 * route-per-step flow (name/age, school code), kept in sessionStorage so it
 * survives the step navigations and dies with the tab. At PIN creation the
 * draft folds into the device's RememberedProfile (`session.ts`), which is
 * what the returning-student login screen unlocks against.
 */

import { rememberProfile } from "./session";

const DRAFT_KEY = "nevo.onboarding.draft";

export interface OnboardingDraft {
  name?: string;
  age?: number;
  schoolCode?: string;
}

export function getOnboardingDraft(): OnboardingDraft {
  if (typeof window === "undefined") return {};
  try {
    const raw = window.sessionStorage.getItem(DRAFT_KEY);
    return raw ? (JSON.parse(raw) as OnboardingDraft) : {};
  } catch {
    return {};
  }
}

export function mergeOnboardingDraft(patch: OnboardingDraft): void {
  try {
    window.sessionStorage.setItem(
      DRAFT_KEY,
      JSON.stringify({ ...getOnboardingDraft(), ...patch }),
    );
  } catch {
    // Private mode etc. - the flow still works, the device just won't remember.
  }
}

export function clearOnboardingDraft(): void {
  try {
    window.sessionStorage.removeItem(DRAFT_KEY);
  } catch {
    // ignore
  }
}

/** "Amara Kalu" -> "AK"; single names fall back to the first two letters. */
function initialsOf(name: string): string {
  const words = name.trim().split(/\s+/).filter(Boolean);
  if (words.length >= 2) return (words[0][0] + words[1][0]).toUpperCase();
  return name.trim().slice(0, 2).toUpperCase();
}

/**
 * Fold the draft into the device's remembered profile - called when the
 * student finishes creating their PIN (the moment this device becomes theirs).
 * No-ops without a name; the login screen then keeps routing to onboarding.
 */
export function rememberOnboardedStudent(): void {
  const draft = getOnboardingDraft();
  const name = draft.name?.trim();
  if (!name) return;
  rememberProfile({
    schoolCode: draft.schoolCode ?? "",
    // TODO(api): the real login identifier comes from account provisioning
    // (roster/invites); until then the device derives one from the name so
    // the PIN screen can exercise the live login path.
    loginIdentifier: name.toLowerCase().replace(/\s+/g, "."),
    displayName: name.split(/\s+/)[0],
    initials: initialsOf(name),
  });
  clearOnboardingDraft();
}
