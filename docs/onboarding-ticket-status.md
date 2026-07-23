# Onboarding — Ticket Status (Product Arch B.2 · Step 4 Addendum)

**Ticket:** *"As a new student, I complete a 90-second to 2-minute onboarding
that seeds my learner profile without feeling like a test."*

**Status:** **Frontend-complete.** Every screen and behaviour in the flow is
built and runs end to end. The only unsatisfied requirements are **backend-
blocked** (see the last section) — there is no outstanding frontend work.

Audited clause by clause against the shipped code.

---

## Requirements coverage

| Requirement | Status | Where / notes |
| --- | --- | --- |
| 90s–2min, "not a test" framing | ✅ Met | Short playful sequence; calm, no scores. (Duration is by design; not machine-verified.) |
| Conditional branching — SSO skips Steps 1–3 | ✅ Met | SSO enters via `/auth/sso-callback` → straight into the Observed Interaction Sequence, never touching Welcome or Steps 1–3. Manual students go the full path. Variant is read from the session, not a URL param. |
| Name & age entry | ✅ Met | `NameAndAgeStep` |
| School connection | ✅ Met | `SchoolConnectionStep` — code entry, validate, warm (non-red) error |
| Class confirmation | ✅ Met | `ClassConfirmationStep` — auto-skip on a single class, searchable list otherwise |
| Four micro-activities generating signal data across cognitive dimensions | ✅ Met | `VisualSortingTask`, `AudioComprehensionTask`, `EngagementTask`, `MemoryPairsTask`. Each emits `ACTIVITY_START` → its dimension signal (`sort_placement` / `audio_response` / `pattern_tap` / `memory_flip`) → `ACTIVITY_COMPLETE` via `useSignals` |
| Parent consent gate blocking progression until D.1b confirmed | ⚠️ Simulated | Gate screen is built and correctly placed; the *blocking* is a simulated timer — **backend-blocked** (see below) |
| PIN creation **or** SSO confirmation | ✅ Met | `PinCreationScreen` — manual 4-digit PIN + confirm, or the SSO "You're signed in" variant |
| Lands directly into first lesson, not an empty dashboard | ✅ Met | `YoureInScreen` → `router.push('/student/lessons/${FIRST_LESSON_ID}')` |

## Flow (as built)

Welcome → Step 1 (name/age) → Step 2 (school) → Step 3 (class) → Transition →
Activity 1 (Visual Sorting) → Activity 2 (Audio Comprehension) → Activity 3
(Engagement) → Activity 4 (Memory Pairs) → The Close → Consent Gate → PIN
Creation → You're In → **first lesson**.

SSO students enter at the Transition and run the sequence identically; only the
transition copy and the PIN step (→ "you're signed in") differ, driven by the
session (`user.method`).

## Design fidelity

All 16 onboarding frames were diffed individually against the `nevo-design-outputs`
reference during the fidelity pass (see `context/onboarding-screen-comparison.md`,
local). Microcopy is verbatim; the entry rules (underline codes vs. boxed PIN),
timings, and illustration crops match.

## Not satisfied — backend-blocked only

These are the *only* gaps, and both wait on FastAPI contracts, not frontend work.
Full detail in **`blocked-items-handoff.md`**.

1. **Consent gate can't truly block on D.1b.** The screen opens on a simulated
   pending spinner (1400ms) and then always proceeds — there is no real check
   that the admin/parent-side consent (D.1b) occurred, because nothing can report
   it yet. `TODO(api)` marks the swap point. *(Also worth a design confirm: the
   current screen is student-facing explanatory copy that waits on consent
   happening elsewhere, not a parent-consent capture.)*
2. **Generated signals don't reach a profile.** The four activities produce real,
   structured signal events, but they batch to `/api/signals/`, which has no
   backend (they re-queue). Signal *generation* is complete; *profile seeding* is
   backend work.

## Known deferred (not part of this ticket's frontend)

- **Focus-driven `NevoKeyboard`** — deferred product decision (suppressing the
  native OS keyboard on web) affecting Steps 1–2 + PIN. See
  `context/design-reference-changes.md` item 1.
