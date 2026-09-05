# Nevo frontend — what is left

Last updated **5 September 2026**. Written from a survey of the source and the
deployed OpenAPI document, not from tickets.

Keep this current. Two rules make it useful rather than decorative:

1. **The deployed OpenAPI document is the contract.** Handoff docs have diverged
   from it on every item checked so far — `options` as strings where the schema
   says objects, `position` as an integer where it is a string, "everything
   optional" where `required` lists all seven fields. Run `scripts/api-audit.mjs`
   before believing a summary.
2. **Say which pile a thing is in.** "Not done" hides the difference between work
   we can do today and work nobody can do yet.

---

## The three piles

| pile | meaning |
|---|---|
| **BUILDABLE** | The contract and the design both exist. Ours to do. |
| **NEEDS BACKEND** | No endpoint, or an endpoint that cannot answer the question. |
| **NEEDS DESIGN** | No frame, or a frame that contradicts another. |

---

## Student app — the next focus

### The chokepoint

`src/lib/lessons/fromContent.ts` is the only adapter between `lessonsApi.detail()`
and the player, and **it discards `comprehensionCheckpoints` and all five typed
variants**. Its `RENDERABLE` list is `[TEXT]`, so a live lesson plays as text and
every other modality falls through to `ModalityPlaceholder` — the literal string
"This modality is coming next", shown to real children.

Its docblock still describes the pre-3-September contract ("every one of them is
typed `Record<string, unknown>`"). That is no longer true.

**Everything in the next section is behind that one file.**

### Typed, working, wired to nothing — BUILDABLE

Shipped 4–5 Sep as API-layer work. All have logic and no UI consumer:

| thing | where | what it needs |
|---|---|---|
| `markCheckpoint` / `toQuickCheck` | `lib/api/checkpoints.ts` | `fromContent` to carry checkpoints; the player already draws `QuickCheckSheet` |
| `markInteractive` / `mediaUrlExpired` | `lib/api/variants.ts` | `fromContent` to read the five variants |
| `contentApi.mediaUrl` | `lib/api/content.ts` | a caller — `mediaUrlExpired` decides when |
| `useDueReviews().playable` | `hooks/useDueReviews.ts` | `SubjectDetail` pills to become links into `/review-session` |
| `reflection` / `highlights` | `lib/api/students.ts` | `useStudentProgress` to return them; two screens to render them |

Neither `checkpoints.ts` nor `variants.ts` is exported from `lib/api/index.ts`.

### Stale comments that now contradict the contract — BUILDABLE

Each asserts a gap backend closed on 3 Sep, and will mislead the next reader:

- `lib/lessons/fromContent.ts:16-35` — "every one of them is typed `Record<string, unknown>`"
- `hooks/useStudentProgress.ts:19-22` — "WHAT IS GENUINELY ABSENT is the PROSE"
- `components/student/Progress/ProgressTab.tsx:28-31` — "No field carries…"
- `components/student/Progress/SubjectDetail.tsx:37-40`, `:241-243` — "nothing writes one"
- `components/teacher/Library/VariantReviewRoute.tsx:14-15` — still calls the variants "free-form"

### Routing and auth — BUILDABLE

- **`/student` 404s.** No `page.tsx` at `src/app/student/`. Same defect as
  `/teacher`, fixed 5 Sep — apply the same redirect to `/student/dashboard`.
- **`/student/*` is unguarded.** `proxy.ts` covers only `/teacher*`, `/admin*`
  and the two staff sign-in doors. `app/student/layout.tsx:17` notes the
  layout-level check is still owed.
- **`/student/lessons/[lessonId]/review-session` is an orphan** — nothing links
  to it. `playable` is its entry point.

### Stubs that 404 on a real lesson — NEEDS BACKEND

- `/student/lessons/[lessonId]/review` — `getMockLesson` + `notFound()`. No
  attempts endpoint; attempts live in `sessionStorage` (`reviewStore.ts`).
- `/student/lessons/[lessonId]/summary` — same shape. `lessonFromContent` never
  sets `lesson.summary`, so a live lesson silently loses the summary screen.

### Blocked — NEEDS BACKEND

| thing | why |
|---|---|
| Student → teacher messaging | `POST /api/messages` constrains `recipientType` to `^(student\|class)$`. There is no `teacher` value, so a child cannot address their teacher at all. Read works; send does not. |
| Thread unread state | No endpoint reports it; the dot stays off. |
| Student SSO sign-in | Entirely mock (`resolveMockSso`). `authApi.ssoCallback` exists and the teacher side calls it. |
| Teacher-join class code | Pre-auth join still compares a hard-coded `VALID_CODE`. **Re-check:** `connections/class-code` went public on 3 Sep, so this may now be closable. |
| Per-concept assessment result | Questions carry no concept id, so the after-lesson result can only tell *all* from *none*. |
| Adaptation plan | No student-facing endpoint; a live lesson plays unadapted. |
| Backend-triggered breaks | `useBreakMonitor` is time-threshold only. |
| Boredom escalation | The tap spends the offer and asks nothing. |
| Downloads / offline | Endpoints exist; the device half is a Service Worker project. Hidden from signed-in children, honestly. |
| Baseline Module 4 items | No IRT service; items are authored mocks. |
| Ask Nevo scoping | The console holds no student or lesson UUID to send. |
| Narration audio | 4 × `TODO(audio)` — the assets do not exist. Playback is a simulated progress bar with no `<audio>` element. |

### NEEDS DESIGN

- After-lesson "nothing landed" heading — ours, built from the frame's own
  wording. Needs sign-off.
- Forgot-PIN — `POST /api/v1/auth/pin/reset` exists and is deliberately not
  called; the frame draws the screen as informational.
- Home encouragement line — the designed copy claims something about the child
  that nothing verifies.
- Consent gate holding state — the gate never blocks.

---

## Teacher console

### Done 5 Sep

- `/teacher` root redirects to `/teacher/dashboard` (was a 404).
- `/teacher/students` redirects to `/teacher/classes` (was a placeholder string).
- Bulk ingestion shows the parse's `lessonTitle` with the filename beneath.
- Split a staged unit into lessons; named segment rows under each section.

### NEEDS BACKEND

| screen | why |
|---|---|
| C08c Recommend a lesson | Recommendations are **read-only** — `GET /api/intelligence/recommendations/{id}` only, returning prose (`recommendationText`), not selectable lesson options. No POST exists to send one. |
| C08d Session detail | Needs a section-by-section breakdown nothing serves. |
| C16d Variant Review | No lesson read carries the variant objects. |
| Escalate to SENCo | No transport for a teacher-to-SENCo note. The button is disabled rather than lying. |
| Teacher SSO connect | **Not the slug problem.** Nothing in the API enrols a school; all ten SSO operations presuppose a connection that exists. The two `start` endpoints are pre-login user handovers. |
| Profile photo upload | The frame draws the affordance only. |
| Drive / OneDrive import | Blocked on per-school credentials. |

### NEEDS DESIGN

- Help & support — a sidebar item with nowhere to go; no frame draws it.
- Pulse banding — the Strong/Steady/Building cutoffs are a frontend invention.
- ~12 undrawn sections: C09's written summary, C06b's stat cards, the C03 flag
  sparkline (deferred to v1.5), the noticing banner, subject filter pills.
- "Specific students" in the assign wizard has no frame; the wizard errors.

---

## Admin console

**43 `TODO(api)` in components** — the largest single block in the codebase,
spread across Students, Onboarding, Teachers, Senco, Invitations and Classes.
Not surveyed in detail. Standing rule: teacher before admin.

---

## Cross-cutting

| item | state |
|---|---|
| **Tests** | **Zero.** No `*.test.*`, no `*.spec.*`, no `__tests__` anywhere. Everything shipped 3–5 Sep was verified by throwaway probes that were then deleted. `markCheckpoint`, `markInteractive`, `mediaUrlExpired` and the signal-buffering guard are pure functions that need no browser. |
| **Landing performance** | **41** on mobile (was 62 on 18 Aug). 2,800 ms total blocking time, 3,658 ms style & layout, 3.3 s script evaluation on a 398 KB page. The server responds in 60 ms — this is client JS, not network. Two chunks carry most of it. |
| **Lint** | Green as of 5 Sep (0 errors, 1 warning). |
| **TOSSE** | Working end to end and deployed. One test lead — `27ac8e8a-a46b-45e0-befe-50787d3b9eb9`, "DO NOT CONTACT" — still needs deleting from the booth list. |

---

## For backend

- The student-app handoff PDF diverged from the deployed spec on **every** item
  it described. Worth fixing at the source: people will type from it.
- `PartnerInquiryIntent`'s own description still says "PLACEHOLDER … confirm
  against SCRUM-117", though the values are now correct.
- The documented error envelope is `{detail: {code, message}}`; validation
  actually returns FastAPI's `{detail: [{type, loc, msg}]}`. A client that
  trusts the former shows a generic message instead of the real reason.
- Legacy lessons need reparsing before checkpoints can auto-mark: `toQuickCheck`
  skips every checkpoint whose `answerKey` is null.
