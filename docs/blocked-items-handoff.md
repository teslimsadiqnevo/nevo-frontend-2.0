# Blocked Items — Handoff to Design & Backend

Everything outstanding across the two closed student tickets — **Onboarding
(B.2)** and **Lesson Player (B.7)** — that the frontend cannot complete alone.
Each item names its owner (**Design** or **Backend**), what's needed, and what it
unblocks. Frontend is built to swap real data/decisions in as they land.

Companion status docs: `onboarding-ticket-status.md`, `lesson-player-ticket-status.md`.

---

## A · Design decisions needed

The frontend followed the `nevo-design-outputs` reference where it and the spec
prose disagreed, and flagged these rather than guessing. Each needs a yes/no or a
short spec.

| # | Decision | Current build | Recommendation |
| --- | --- | --- | --- |
| A1 | **"Layered" channels — simultaneous or offered?** The B.7 phrase "dynamically layered primary + secondary channels." *Simultaneous* (audio over text on a normal segment) is **not buildable today** — new frontend work. *Offered* (primary shown, secondary suggested) is **already built**. | One modality at a time + a system suggestion pill; only the calc solver layers | Clarify intent. If "offered," no work needed |
| A2 | **Manual modality switcher?** Spec prose implies student-selectable modalities; the frame has no picker. | System-only: modality changes only via the suggestion pill | Keep system-only (matches frame + "system owns adaptation") |
| A3 | **Comprehension-check audio-question format.** B.7 asks for audio questions for reading-difficulty profiles. No design frame exists for it in the lesson-check context. | Text-only check | Provide a frame (or confirm we adapt the onboarding audio pattern) |
| A4 | **"See summary" (completion) target** | Omitted (no destination) | Points at screen 18 once built |
| A5 | **"Review answers" (assessment result) target** | Omitted (no destination) | Confirm scope; spec the screen if wanted |
| A6 | **Calc solver back-chevron** — §11 "back disabled on step 1" describes the standalone frame; the player's chevrons are segment-level | Forward gated until solved; back is segment-level | Confirm segment-level is correct |
| A7 | **Calc audio/kinesthetic enabling UX** — 17b defines them as props but not the live toggle | Audio bar shown when available; "build it instead" at final step | Confirm, or spec a pill/toggle |
| A8 | **Progress-track colour** — player frame `near-black/10` vs onboarding frames `navy/12` (frames disagree) | `navy/12` | Pick one canonical value |
| A9 | **Density toggle on non-Text modalities** — always visible but inert | Visible (matches frame) | Confirm visible-but-inert is intended |
| A10 | **Feedback-strip copy** — placeholder wording | "Nice — that's got it. Here's what's next." | Provide canonical copy |
| A11 | **Consent gate scope** — student-facing explanation that *waits on* D.1b, vs a parent-consent *capture* | Explanatory wait screen | Confirm the frontend's role (see B3) |
| A12 | **Focus-driven `NevoKeyboard`** — product decision: suppress the native OS keyboard on web (onboarding Steps 1–2, PIN, calc numeric input) | Native keyboard | Decide; then a shared component is built |

## B · Backend contracts needed (FastAPI)

Frontend is wired to consume these; each is a data-source swap when the contract
exists. No frontend redesign required.

| # | Contract | Blocks | Frontend readiness |
| --- | --- | --- | --- |
| B1 | **Signals endpoint** `POST /api/signals/` — receive batched events per session | "Signals fire continuously to the backend" (B.7); onboarding profile seeding (B.2) | `useSignals` batches (5s / 20 / on-exit) + re-queues on failure; posts today and 404s |
| B2 | **Adaptation / profile contract** — `intelligenceApi.getAdaptation(studentId, lessonId)` returning the per-segment plan derived from the learner profile | The entire "adapts per my profile" spine (B.7): layered channels, format-adaptive checks, live system-triggered toggle | `useAdaptation` typed to `AdaptationPlan`; player renders a static mock plan today — swap the source |
| B3 | **Consent / provisioning check (D.1b)** — report whether admin/parent consent is confirmed | Consent gate "blocking progression until D.1b confirmed" (B.2) | `ConsentGate` opens on a simulated pending state; `TODO(api)` marks the real check |
| B4 | **Auth / session contract** — how the session/JWT is exposed (SSO + first-use detection, per-role timeouts) | Real SSO handshake + first-use routing; the `proxy.ts` route guard; `AuthContext` session hydration | `AuthContext.signIn` + mock SSO resolver in place; hydrates from a mock; `proxy.ts` not yet built |
| B5 | **Produced content** — real lesson content/assets, per-step calc **narration** audio, break-monitor instructions | Real lessons; audio modality + calc narration playback; `useBreakMonitor` | UI simulates playback; break monitor stubbed |

## C · Frontend work these unblock (for tracking)

Buildable **now** (no dependency):
- Audio-question comprehension **renderer** (A3 gives the visual; B2 gives the
  format selection — but the renderer can be built against a mock profile first).
- Live **system-triggered toggle** state wiring (small; pairs with B2 when live).

Gated on a decision above:
- **Layered-channel compositor** — only if A1 resolves to "simultaneous."
- **Summary screen** — after A4 + screen 18.

Gated on backend:
- Point the player at `useAdaptation` instead of the mock (B2).
- Real consent blocking (B3); real SSO + `proxy.ts` guard (B4); real
  content/audio/breaks (B5).

---

*Design questions were first captured in `context/lesson-player-design-questions.md`
and `context/lesson-player-followups.md` (local working notes); this doc is the
shareable, consolidated handoff.*
